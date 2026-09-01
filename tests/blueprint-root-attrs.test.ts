import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import vue from "@vitejs/plugin-vue";
import { createServer, type ViteDevServer } from "vite";
import { createSSRApp, h, type Component } from "vue";
import { renderToString } from "vue/server-renderer";

const repo = path.join(import.meta.dirname, "..");
const blueprintPaths = {
  Calendar: path.join(repo, "packages/core/blueprints/calendar/Calendar.vue"),
  DatePicker: path.join(repo, "packages/core/blueprints/date-picker/DatePicker.vue"),
  DateRangePicker: path.join(repo, "packages/core/blueprints/date-range-picker/DateRangePicker.vue"),
  RangeCalendar: path.join(repo, "packages/core/blueprints/range-calendar/RangeCalendar.vue"),
  Separator: path.join(repo, "packages/core/blueprints/separator/Separator.vue"),
  Skeleton: path.join(repo, "packages/core/blueprints/skeleton/Skeleton.vue"),
  Spinner: path.join(repo, "packages/core/blueprints/spinner/Spinner.vue"),
} as const;
const additionalBlueprintPaths = [
  path.join(repo, "packages/core/blueprints/carousel/Carousel.vue"),
  path.join(repo, "packages/core/blueprints/disclosure/Disclosure.vue"),
  path.join(repo, "packages/core/blueprints/pagination/Pagination.vue"),
  path.join(repo, "packages/core/blueprints/range-slider/RangeSlider.vue"),
  path.join(repo, "packages/core/blueprints/rating/Rating.vue"),
  path.join(repo, "packages/core/blueprints/resizable/Resizable.vue"),
  path.join(repo, "packages/core/blueprints/stepper/Stepper.vue"),
  path.join(repo, "packages/core/blueprints/tabs/Tabs.vue"),
  path.join(repo, "packages/core/blueprints/toast/Toast.vue"),
  path.join(repo, "packages/core/blueprints/tree/Tree.vue"),
  path.join(repo, "packages/core/blueprints/tree/TreeBranch.vue"),
];

function normalizeSsrHtml(html: string) {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--\[-->|<!--\]-->/gu, "");
}

async function withBlueprints(
  run: (components: Record<keyof typeof blueprintPaths, Component>) => Promise<void>,
) {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nagi-root-attrs-vite-"));
  const server: ViteDevServer = await createServer({
    configFile: false,
    plugins: [vue()],
    root: path.join(repo, "playground"),
    cacheDir,
    optimizeDeps: { noDiscovery: true, include: [] },
    logLevel: "silent",
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const components = Object.fromEntries(
      await Promise.all(
        Object.entries(blueprintPaths).map(async ([name, sourcePath]) => [
          name,
          (await server.ssrLoadModule(`/@fs${sourcePath}`)).default as Component,
        ]),
      ),
    ) as Record<keyof typeof blueprintPaths, Component>;
    await run(components);
  } finally {
    await server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
}

async function render(component: Component, props: Record<string, unknown>) {
  return normalizeSsrHtml(await renderToString(createSSRApp({
    render: () => h(component, props),
  })));
}

test("calendar Blueprints expose only intentional root attributes", async () => {
  await withBlueprints(async ({ Calendar, DatePicker, DateRangePicker, RangeCalendar }) => {
    const calendar = await render(Calendar, {
      label: "Arrival",
      id: "arrival-calendar",
      class: "consumer-calendar",
      style: "max-inline-size: 32rem",
      title: "Select an arrival date",
      unknown: "must-not-leak",
    });
    const calendarRoot = calendar.match(/<div class="n-calendar[^"]*"[^>]*>/u)?.[0] ?? "";
    assert.match(calendarRoot, /consumer-calendar/u);
    assert.match(calendarRoot, /style="max-inline-size:\s*32rem/u);
    assert.match(calendarRoot, /title="Select an arrival date"/u);
    assert.doesNotMatch(calendarRoot, /\sid=|must-not-leak/u);
    assert.match(calendar, /<table[^>]*id="arrival-calendar"/u);

    const picker = await render(DatePicker, {
      label: "Arrival",
      id: "arrival-picker",
      class: "consumer-picker",
      style: "max-inline-size: 32rem",
      title: "Select an arrival date",
      unknown: "must-not-leak",
    });
    const pickerRoot = picker.match(/<div[^>]*class="n-date-picker[^>]*>/u)?.[0] ?? "";
    assert.match(pickerRoot, /id="arrival-picker"/u);
    assert.match(pickerRoot, /consumer-picker/u);
    assert.match(pickerRoot, /title="Select an arrival date"/u);
    assert.doesNotMatch(picker, /must-not-leak/u);

    const rangePicker = await render(DateRangePicker, {
      label: "Stay",
      id: "stay-picker",
      class: "consumer-range-picker",
      title: "Select a stay",
      unknown: "must-not-leak",
    });
    const rangePickerRoot = rangePicker.match(/<div[^>]*class="n-date-range-picker[^>]*>/u)?.[0] ?? "";
    assert.match(rangePickerRoot, /id="stay-picker"/u);
    assert.match(rangePickerRoot, /consumer-range-picker/u);
    assert.match(rangePickerRoot, /title="Select a stay"/u);
    assert.doesNotMatch(rangePicker, /must-not-leak/u);

    const rangeCalendar = await render(RangeCalendar, {
      label: "Stay",
      id: "stay-calendar",
      class: "consumer-range-calendar",
      title: "Select a stay",
      unknown: "must-not-leak",
    });
    const rangeCalendarRoot = rangeCalendar.match(/<div class="n-range-calendar[^"]*"[^>]*>/u)?.[0] ?? "";
    assert.match(rangeCalendarRoot, /consumer-range-calendar/u);
    assert.match(rangeCalendarRoot, /title="Select a stay"/u);
    assert.doesNotMatch(rangeCalendarRoot, /\sid=|must-not-leak/u);
    assert.match(rangeCalendar, /<table[^>]*id="stay-calendar"/u);
  });
});

test("non-interactive Blueprints expose explicit root and semantic attributes", async () => {
  await withBlueprints(async ({ Separator, Skeleton, Spinner }) => {
    const horizontal = await render(Separator, {
      id: "section-divider",
      class: "consumer-divider",
      style: "margin-block: 1rem",
      title: "Section divider",
      ariaLabel: "Section divider",
      unknown: "must-not-leak",
    });
    assert.match(horizontal, /<hr[^>]*id="section-divider"/u);
    assert.match(horizontal, /consumer-divider/u);
    assert.match(horizontal, /title="Section divider"/u);
    assert.match(horizontal, /aria-label="Section divider"/u);
    assert.doesNotMatch(horizontal, /must-not-leak/u);

    const vertical = await render(Separator, {
      orientation: "vertical",
      ariaLabel: "Column divider",
      unknown: "must-not-leak",
    });
    assert.match(vertical, /role="separator"/u);
    assert.match(vertical, /aria-label="Column divider"/u);
    assert.doesNotMatch(vertical, /must-not-leak/u);

    const decorative = await render(Separator, {
      decorative: true,
      ariaLabel: "Must remain hidden",
      unknown: "must-not-leak",
    });
    assert.match(decorative, /aria-hidden="true"/u);
    assert.doesNotMatch(decorative, /aria-label=|must-not-leak/u);

    const skeleton = await render(Skeleton, {
      id: "loading-placeholder",
      class: "consumer-skeleton",
      style: "inline-size: 12rem",
      title: "Loading",
      "data-track": "skeleton",
    });
    assert.match(skeleton, /<span[^>]*class="n-skeleton[^>]*consumer-skeleton/u);
    assert.match(skeleton, /id="loading-placeholder"/u);
    assert.match(skeleton, /title="Loading"/u);
    assert.match(skeleton, /data-track="skeleton"/u);

    const spinner = await render(Spinner, {
      label: "Loading account",
      id: "account-spinner",
      class: "consumer-spinner",
      "data-track": "spinner",
    });
    assert.match(spinner, /<span[^>]*class="n-spinner[^>]*consumer-spinner/u);
    assert.match(spinner, /id="account-spinner"/u);
    assert.match(spinner, /role="status"/u);
    assert.match(spinner, /aria-label="Loading account"/u);
    assert.match(spinner, /data-track="spinner"/u);
  });
});

test("target Blueprints do not contain implicit attrs forwarding", () => {
  for (const sourcePath of [...Object.values(blueprintPaths), ...additionalBlueprintPaths]) {
    assert.doesNotMatch(fs.readFileSync(sourcePath, "utf8"), /v-bind="\$attrs"/u, sourcePath);
  }
});

test("additional wrapper Blueprints opt out of Vue fallthrough", () => {
  for (const sourcePath of additionalBlueprintPaths) {
    assert.match(
      fs.readFileSync(sourcePath, "utf8"),
      /defineOptions\(\{[^}]*inheritAttrs:\s*false/u,
      sourcePath,
    );
  }
});
