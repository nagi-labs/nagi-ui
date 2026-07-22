import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import vue from "@vitejs/plugin-vue";
import { createServer } from "vite";
import { createSSRApp, h, type Component } from "vue";
import { renderToString } from "vue/server-renderer";

const repo = path.join(import.meta.dirname, "..");
const sourcePath = path.join(
  repo,
  "packages/core/blueprints/number-field/NumberField.vue",
);

function normalizeSsrHtml(html: string) {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--\[-->|<!--\]-->/gu, "");
}

test("NumberField renders one native number input and two explicit step actions", async () => {
  const server = await createServer({
    configFile: false,
    plugins: [vue()],
    root: path.join(repo, "playground"),
    cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), "nagi-number-field-vite-")),
    logLevel: "silent",
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const numberField = (
      await server.ssrLoadModule(`/@fs${sourcePath}`)
    ).default as Component;
    const html = normalizeSsrHtml(await renderToString(
      createSSRApp({
        render: () => h(numberField, {
          label: "Guests",
          id: "guest-count",
          modelValue: 4,
          name: "guests",
          form: "booking",
          min: 0,
          max: 4,
          step: 2,
          required: true,
          decrementLabel: "Remove one guest",
          incrementLabel: "Add one guest",
          inputmode: "numeric",
          autocomplete: "off",
          "aria-describedby": "guest-help",
          class: "consumer-control",
        }),
      }),
    ));

    const root = html.match(/<div class="n-number-field"[^>]*>/u)?.[0] ?? "";
    const control = html.match(/<input[^>]*>/u)?.[0] ?? "";
    const buttons = [...html.matchAll(/<button[^>]*>/gu)].map((match) => match[0]);

    assert.match(root, /class="n-number-field"/u);
    assert.doesNotMatch(root, /consumer-control|inputmode|aria-describedby/u);
    assert.match(html, /<label class="label" for="guest-count">Guests<\/label>/u);
    assert.equal(buttons.length, 2);
    assert.match(buttons[0] ?? "", /type="button"/u);
    assert.match(buttons[0] ?? "", /aria-label="Remove one guest"/u);
    assert.doesNotMatch(buttons[0] ?? "", /disabled/u);
    assert.match(buttons[1] ?? "", /type="button"/u);
    assert.match(buttons[1] ?? "", /aria-label="Add one guest"/u);
    assert.match(buttons[1] ?? "", /disabled/u, "max disables increment");
    assert.match(control, /class="[^"]*consumer-control/u);
    assert.match(control, /type="number"/u);
    assert.match(control, /id="guest-count"/u);
    assert.match(control, /name="guests"/u);
    assert.match(control, /form="booking"/u);
    assert.match(control, /min="0"/u);
    assert.match(control, /max="4"/u);
    assert.match(control, /step="2"/u);
    assert.match(control, /required/u);
    assert.match(control, /inputmode="numeric"/u);
    assert.match(control, /autocomplete="off"/u);
    assert.match(control, /aria-describedby="guest-help"/u);
    assert.match(control, /value="4"/u);
    assert.equal(html.match(/<input/gu)?.length, 1);
  } finally {
    await server.close();
  }
});

test("NumberField disables both step actions when the native input is readonly", async () => {
  const server = await createServer({
    configFile: false,
    plugins: [vue()],
    root: path.join(repo, "playground"),
    cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), "nagi-number-field-vite-")),
    logLevel: "silent",
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const numberField = (
      await server.ssrLoadModule(`/@fs${sourcePath}`)
    ).default as Component;
    const html = normalizeSsrHtml(await renderToString(
      createSSRApp({
        render: () => h(numberField, {
          label: "Seats",
          modelValue: null,
          readOnly: true,
        }),
      }),
    ));

    const buttons = [...html.matchAll(/<button[^>]*>/gu)].map((match) => match[0]);
    const control = html.match(/<input[^>]*>/u)?.[0] ?? "";

    assert.equal(buttons.length, 2);
    assert.match(buttons[0] ?? "", /disabled/u);
    assert.match(buttons[1] ?? "", /disabled/u);
    assert.match(control, /readonly/u);
    assert.doesNotMatch(control, /value="null"/u);
  } finally {
    await server.close();
  }
});

test("NumberField keeps browser-owned behavior behind one fixed adapter", () => {
  const source = fs.readFileSync(sourcePath, "utf8");

  assert.match(source, /defineModel<number \| null>\(\{ default: null \}\)/u);
  assert.match(source, /useNumberFieldControl\(input, model\)/u);
  assert.match(source, /<input[\s\S]*v-bind="\$attrs"[\s\S]*type="number"/u);
  assert.match(source, /:name="name"[\s\S]*:form="form"/u);
  assert.match(source, /:min="min"[\s\S]*:max="max"[\s\S]*:step="step"/u);
  assert.match(source, /:disabled="disabled"[\s\S]*:readonly="readOnly"[\s\S]*:required="required"/u);
  assert.match(source, /<button[\s\S]*type="button"[\s\S]*@click="decrement"/u);
  assert.match(source, /<button[\s\S]*type="button"[\s\S]*@click="increment"/u);
  assert.doesNotMatch(source, /<slot\b|Teleport\b|data-state/u);
  assert.doesNotMatch(source, /\.(?:stepUp|stepDown|valueAsNumber)\b/u);
  assert.doesNotMatch(source, /useNativeFormReset|setTimeout|queueMicrotask/u);
  assert.doesNotMatch(source, /\b(?:watch|watchEffect|onMounted|onUpdated)\s*\(/u);
  assert.doesNotMatch(source, /\b(?:document|window|Event|ResizeObserver)\b/u);
  assert.doesNotMatch(source, /locale|formatter|parser|scrub|gesture/iu);
  assert.doesNotMatch(source, /\.zone\b/u);
  assert.doesNotMatch(source, /\bmargin\s*:/u, "surface owns no external margin");
  assert.doesNotMatch(source, /var\([^\n,]+,/u, "theme token fallbacks are forbidden");
  assert.doesNotMatch(
    source,
    /#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch|lab|lch)\(/iu,
    "color literals are forbidden",
  );
});
