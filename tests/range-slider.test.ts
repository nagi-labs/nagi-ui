import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import vue from "@vitejs/plugin-vue";
import { createServer } from "vite";
import { createSSRApp, effectScope, h, ref, type Component } from "vue";
import { renderToString } from "vue/server-renderer";

import { useRangeSlider } from "../packages/core/src/range-slider.ts";

const repo = path.join(import.meta.dirname, "..");
const sourcePath = path.join(repo, "packages/core/blueprints/range-slider/RangeSlider.vue");
const corePath = path.join(repo, "packages/core/src/range-slider.ts");

interface FakeRangeControl {
  control: HTMLInputElement;
  setNativeValue: (value: number) => void;
  focusCalls: string[];
}

function createRangeControl(options: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  form?: EventTarget | null;
}): FakeRangeControl {
  const min = options.min ?? 0;
  const max = options.max ?? 100;
  const step = options.step ?? 1;
  let value = options.value;
  const focusCalls: string[] = [];
  const control = new EventTarget() as HTMLInputElement;

  const sanitize = (next: number) => {
    const finite = Number.isFinite(next) ? next : (min + max) / 2;
    const stepped = min + Math.round((finite - min) / step) * step;
    return Math.min(max, Math.max(min, stepped));
  };

  value = sanitize(value);
  Object.defineProperties(control, {
    form: { value: options.form ?? null },
    min: { value: String(min) },
    max: { value: String(max) },
    step: { value: String(step) },
    disabled: { value: false, writable: true },
    value: {
      get: () => String(value),
      set: (next: string) => {
        value = sanitize(Number(next));
      },
    },
    valueAsNumber: { get: () => value },
    focus: { value: () => focusCalls.push("focus") },
  });

  return {
    control,
    setNativeValue: (next) => {
      value = sanitize(next);
    },
    focusCalls,
  };
}

function pointer(rail: object, clientX: number, pointerId = 1): PointerEvent {
  return {
    button: 0,
    clientX,
    currentTarget: rail,
    pointerId,
    preventDefault() {},
  } as unknown as PointerEvent;
}

function normalizeSsrHtml(html: string) {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--\[-->|<!--\]-->/gu, "");
}

test("RangeSlider keeps lower and upper model values ordered", () => {
  const lower = createRangeControl({ value: 20 });
  const upper = createRangeControl({ value: 80 });
  const model = ref<readonly [number, number]>([20, 80]);
  const scope = effectScope();

  const binding = scope.run(() => useRangeSlider(ref(lower.control), ref(upper.control), model));
  assert.ok(binding);

  lower.setNativeValue(90);
  binding.lowerValue.value = 90;
  assert.deepEqual(model.value, [80, 80]);
  assert.equal(lower.control.valueAsNumber, 80);

  upper.setNativeValue(10);
  binding.upperValue.value = 10;
  assert.deepEqual(model.value, [80, 80]);
  assert.equal(upper.control.valueAsNumber, 80);

  scope.stop();
});

test("RangeSlider reset restores browser-sanitized tuple values", async () => {
  const form = new EventTarget();
  const lower = createRangeControl({ value: -7, min: 0, max: 10, step: 2, form });
  const upper = createRangeControl({ value: 13, min: 0, max: 10, step: 2, form });
  const model = ref<readonly [number, number]>([-7, 13]);
  const scope = effectScope();

  scope.run(() => useRangeSlider(ref(lower.control), ref(upper.control), model));
  assert.deepEqual(model.value, [0, 10]);

  lower.setNativeValue(4);
  upper.setNativeValue(6);
  model.value = [4, 6];
  form.dispatchEvent(new Event("reset"));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(model.value, [0, 10]);
  assert.equal(lower.control.valueAsNumber, 0);
  assert.equal(upper.control.valueAsNumber, 10);
  scope.stop();
});

test("RangeSlider rail pointer policy recovers either thumb from a collision", () => {
  const lower = createRangeControl({ value: 40 });
  const upper = createRangeControl({ value: 40 });
  const model = ref<readonly [number, number]>([40, 40]);
  const scope = effectScope();
  const binding = scope.run(() => useRangeSlider(ref(lower.control), ref(upper.control), model));
  assert.ok(binding);

  const captures = new Set<number>();
  const rail = {
    ownerDocument: {
      defaultView: { getComputedStyle: () => ({ direction: "ltr" }) },
    },
    getBoundingClientRect: () => ({ left: 0, width: 100 }),
    setPointerCapture: (id: number) => captures.add(id),
    hasPointerCapture: (id: number) => captures.has(id),
    releasePointerCapture: (id: number) => captures.delete(id),
  };

  binding.railProps.onPointerdown(pointer(rail, 30));
  assert.deepEqual(model.value, [30, 40]);
  assert.deepEqual(lower.focusCalls, ["focus"]);
  binding.railProps.onPointermove(pointer(rail, 20));
  binding.railProps.onPointerup(pointer(rail, 20));
  assert.deepEqual(model.value, [20, 40]);
  assert.equal(captures.size, 0);

  binding.railProps.onPointerdown(pointer(rail, 70, 2));
  binding.railProps.onPointerup(pointer(rail, 70, 2));
  assert.deepEqual(model.value, [20, 70]);
  assert.deepEqual(upper.focusCalls, ["focus"]);
  scope.stop();
});

test("RangeSlider rail emits native input while moving and change only on commit", () => {
  const lower = createRangeControl({ value: 20 });
  const upper = createRangeControl({ value: 80 });
  const model = ref<readonly [number, number]>([20, 80]);
  const scope = effectScope();
  const binding = scope.run(() => useRangeSlider(ref(lower.control), ref(upper.control), model));
  assert.ok(binding);

  const lowerEvents: string[] = [];
  lower.control.addEventListener("input", () => lowerEvents.push("input"));
  lower.control.addEventListener("change", () => lowerEvents.push("change"));
  const upperEvents: string[] = [];
  upper.control.addEventListener("input", () => upperEvents.push("input"));
  upper.control.addEventListener("change", () => upperEvents.push("change"));
  const rail = {
    ownerDocument: {
      defaultView: { getComputedStyle: () => ({ direction: "ltr" }) },
    },
    getBoundingClientRect: () => ({ left: 0, width: 100 }),
    setPointerCapture() {},
    hasPointerCapture: () => false,
    releasePointerCapture() {},
  };

  binding.railProps.onPointerdown(pointer(rail, 30));
  binding.railProps.onPointermove(pointer(rail, 35));
  binding.railProps.onPointerup(pointer(rail, 35));
  assert.deepEqual(lowerEvents, ["input", "input", "change"]);
  assert.deepEqual(upperEvents, []);

  binding.railProps.onPointerdown(pointer(rail, 70, 2));
  binding.railProps.onPointercancel(pointer(rail, 70, 2));
  assert.deepEqual(upperEvents, ["input"]);
  scope.stop();
});

test("RangeSlider rail emits no extra input after the active thumb reaches its peer", () => {
  const lower = createRangeControl({ value: 20 });
  const upper = createRangeControl({ value: 30 });
  const model = ref<readonly [number, number]>([20, 30]);
  const scope = effectScope();
  const binding = scope.run(() => useRangeSlider(ref(lower.control), ref(upper.control), model));
  assert.ok(binding);

  const events: string[] = [];
  lower.control.addEventListener("input", () => events.push("input"));
  lower.control.addEventListener("change", () => events.push("change"));
  const rail = {
    ownerDocument: {
      defaultView: { getComputedStyle: () => ({ direction: "ltr" }) },
    },
    getBoundingClientRect: () => ({ left: 0, width: 100 }),
    setPointerCapture() {},
    hasPointerCapture: () => false,
    releasePointerCapture() {},
  };

  binding.railProps.onPointerdown(pointer(rail, 20));
  binding.railProps.onPointermove(pointer(rail, 90));
  binding.railProps.onPointermove(pointer(rail, 80));
  binding.railProps.onPointerup(pointer(rail, 80));

  assert.deepEqual(model.value, [30, 30]);
  assert.equal(lower.control.valueAsNumber, 30);
  assert.deepEqual(events, ["input", "change"]);
  scope.stop();
});

test("RangeSlider renders two named native range controls with visible constraints", async () => {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nagi-range-slider-vite-"));
  const server = await createServer({
    configFile: false,
    plugins: [vue()],
    resolve: {
      alias: [
        {
          find: "@nagi-labs/nagi-ui/component-controls",
          replacement: corePath,
        },
      ],
    },
    root: path.join(repo, "playground"),
    cacheDir,
    optimizeDeps: { noDiscovery: true, include: [] },
    logLevel: "silent",
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const RangeSlider = (await server.ssrLoadModule(`/@fs${sourcePath}`)).default as Component;
    const html = normalizeSsrHtml(
      await renderToString(
        createSSRApp({
          render: () =>
            h(RangeSlider, {
              label: "Price range",
              lowerLabel: "Minimum price",
              upperLabel: "Maximum price",
              lowerId: "price-min",
              upperId: "price-max",
              lowerName: "priceMin",
              upperName: "priceMax",
              form: "filters",
              min: 10,
              max: 90,
              step: 5,
              disabled: true,
              modelValue: [25, 75],
            }),
        }),
      ),
    );
    const controls = html.match(/<input[^>]*>/gu) ?? [];

    assert.match(html, /^<fieldset class="n-range-slider"[^>]*disabled>/u);
    assert.match(html, /<legend class="legend">Price range<\/legend>/u);
    assert.equal(controls.length, 2);
    assert.match(controls[0] ?? "", /type="range"/u);
    assert.match(controls[0] ?? "", /id="price-min"/u);
    assert.match(controls[0] ?? "", /name="priceMin"/u);
    assert.match(controls[0] ?? "", /form="filters"/u);
    assert.match(controls[0] ?? "", /min="10"/u);
    assert.match(controls[0] ?? "", /max="90"/u);
    assert.match(controls[0] ?? "", /aria-valuemax="75"/u);
    assert.match(controls[0] ?? "", /step="5"/u);
    assert.match(controls[1] ?? "", /type="range"/u);
    assert.match(controls[1] ?? "", /id="price-max"/u);
    assert.match(controls[1] ?? "", /name="priceMax"/u);
    assert.match(controls[1] ?? "", /form="filters"/u);
    assert.match(controls[1] ?? "", /min="10"/u);
    assert.match(controls[1] ?? "", /max="90"/u);
    assert.match(controls[1] ?? "", /aria-valuemin="25"/u);
    assert.match(controls[1] ?? "", /step="5"/u);
    assert.match(html, /<label class="label" for="price-min">Minimum price<\/label>/u);
    assert.match(html, /<label class="label" for="price-max">Maximum price<\/label>/u);
    assert.match(html, /<output class="output" for="price-min">25<\/output>/u);
    assert.match(html, /<output class="output" for="price-max">75<\/output>/u);
  } finally {
    await server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
});

test("RangeSlider leaves native controls visible and delegates complete input bindings", () => {
  const source = fs.readFileSync(sourcePath, "utf8");
  const controlSource = fs.readFileSync(corePath, "utf8");

  assert.match(source, /defineModel<readonly \[number, number\]>/u);
  assert.match(source, /useRangeSlider\(\s*props,\s*model,?\s*\)/u);
  assert.match(source, /<span[\s\S]*?class="rail"[\s\S]*?v-bind="railProps"/u);
  assert.equal(source.match(/type="range"/gu)?.length, 2);
  assert.match(
    source,
    /<div class="seg -wide"[^>]*>[\s\S]*class="rail"[\s\S]*class="input -lower"[\s\S]*class="input -upper"/u,
  );
  assert.doesNotMatch(source, /const (?:lower|upper)InputProps = computed/u);
  assert.doesNotMatch(source, /aria-valuemax|aria-valuemin/u);
  assert.match(
    controlSource,
    /const lowerInputProps:[\s\S]*get min\(\)[\s\S]*get max\(\)[\s\S]*get step\(\)[\s\S]*get "aria-valuemax"\(\)/u,
  );
  assert.match(
    controlSource,
    /const upperInputProps:[\s\S]*get min\(\)[\s\S]*get max\(\)[\s\S]*get step\(\)[\s\S]*get "aria-valuemin"\(\)/u,
  );
  assert.match(source, /<input[\s\S]*?class="input -lower"[\s\S]*?v-bind="lowerInputProps"/u);
  assert.match(source, /<input[\s\S]*?class="input -upper"[\s\S]*?v-bind="upperInputProps"/u);
  assert.doesNotMatch(source, /const fieldsetProps = computed/u);
  assert.match(
    source,
    /<fieldset[\s\S]*?class="n-range-slider"[\s\S]*?v-bind="rangeSlider\.fieldsetProps"[\s\S]*?>/u,
  );
  assert.match(source, /> \.seg\.-wide[\s\S]*> \.rail[\s\S]*touch-action:\s*none/u);
  assert.match(source, /inset-inline:\s*calc\(var\(--nagi-size-control\) \/ 4\)/u);
  assert.match(
    source,
    /::-webkit-slider-thumb[\s\S]*inline-size:\s*calc\(var\(--nagi-size-control\) \/ 2\)/u,
  );
  assert.match(
    source,
    /pointer-events:\s*none[\s\S]*::-webkit-slider-thumb[\s\S]*pointer-events:\s*none/u,
  );
  assert.match(source, /::-moz-range-thumb[\s\S]*pointer-events:\s*none/u);
  assert.match(source, /@media \(forced-colors: active\)/u);
  assert.doesNotMatch(source, /@key(?:down|up)|role="slider"|aria-valuenow|tabindex/u);
  assert.doesNotMatch(source, /valueAsNumber|useNativeFormReset|setTimeout|queueMicrotask/u);
  assert.doesNotMatch(source, /\b(?:watch|watchEffect|onMounted|onUpdated)\s*\(/u);
  assert.doesNotMatch(source, /<slot\b|Teleport\b|data-state/u);
  assert.doesNotMatch(source, /\.zone\b/u);
  assert.doesNotMatch(source, /var\([^\n,]+,/u, "theme token fallbacks are forbidden");
  assert.doesNotMatch(
    source,
    /#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch|lab|lch)\(/iu,
    "color literals are forbidden",
  );
});
