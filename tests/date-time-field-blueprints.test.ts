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
const dateSource = path.join(repo, "packages/core/blueprints/date-field/DateField.vue");
const timeSource = path.join(repo, "packages/core/blueprints/time-field/TimeField.vue");

function normalize(html: string) {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--\[-->|<!--\]-->/gu, "");
}

test("DateField and TimeField SSR plain segmented DOM with native form-value channels", async () => {
  const server = await createServer({
    configFile: false,
    plugins: [vue()],
    root: path.join(repo, "playground"),
    cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), "nagi-date-time-vite-")),
    logLevel: "silent",
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const DateField = (await server.ssrLoadModule(`/@fs${dateSource}`)).default as Component;
    const TimeField = (await server.ssrLoadModule(`/@fs${timeSource}`)).default as Component;
    const dateHtml = normalize(await renderToString(createSSRApp({
      render: () => h(DateField, {
        label: "Arrival",
        locale: "en-GB",
        modelValue: "2026-07-23",
        name: "arrival",
        form: "booking",
        min: "2026-07-01",
        required: true,
        "aria-describedby": "arrival-help",
      }),
    })));
    const timeHtml = normalize(await renderToString(createSSRApp({
      render: () => h(TimeField, {
        label: "Starts",
        locale: "en-US",
        granularity: "second",
        hourCycle: 12,
        modelValue: "13:45:30",
        name: "starts",
      }),
    })));

    assert.match(dateHtml, /<div[^>]*role="group"[^>]*aria-label="Arrival"[^>]*aria-required="true"/u);
    assert.match(dateHtml, /aria-describedby="arrival-help"/u);
    assert.equal(dateHtml.match(/role="spinbutton"/gu)?.length, 3);
    assert.match(dateHtml, /aria-label="Day"[^>]*aria-valuenow="23"/u);
    assert.match(dateHtml, /<input[^>]*type="date"[^>]*name="arrival"[^>]*form="booking"/u);
    assert.match(dateHtml, /value="2026-07-23"/u);
    assert.match(dateHtml, /min="2026-07-01"/u);

    assert.equal(timeHtml.match(/role="spinbutton"/gu)?.length, 4);
    assert.match(timeHtml, /aria-label="Hour"[^>]*aria-valuenow="1"/u);
    assert.match(timeHtml, /aria-label="Second"[^>]*aria-valuenow="30"/u);
    assert.match(timeHtml, /aria-label="AM\/PM"[^>]*aria-valuenow="1"/u);
    assert.match(timeHtml, /<input[^>]*type="time"[^>]*name="starts"[^>]*value="13:45:30"/u);
    assert.match(timeHtml, /step="1"/u);
  } finally {
    await server.close();
  }
});

test("Date/time Blueprints expose policy and DOM without forbidden integration structures", () => {
  for (const sourcePath of [dateSource, timeSource]) {
    const source = fs.readFileSync(sourcePath, "utf8");
    assert.match(source, /defineModel<string \| null>\(\{ default: null \}\)/u);
    assert.match(source, /role="spinbutton"|segmentProps\(segment\)/u);
    assert.match(source, /class="input -form-value"/u);
    assert.doesNotMatch(source, /<slot\b|Teleport\b|data-state|provide\(|inject\(/u);
    assert.doesNotMatch(source, /\b(?:watch|watchEffect|onMounted|onUpdated)\s*\(/u);
    assert.doesNotMatch(source, /\b(?:document|window|ResizeObserver)\b/u);
    assert.doesNotMatch(source, /\bmargin\s*:/u);
    assert.doesNotMatch(source, /var\([^\n,]+,/u, "theme token fallbacks are forbidden");
    assert.doesNotMatch(
      source,
      /#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch|lab|lch)\(/iu,
      "color literals are forbidden",
    );
  }
  assert.match(fs.readFileSync(dateSource, "utf8"), /useDateField\(props, model\)/u);
  assert.match(fs.readFileSync(timeSource, "utf8"), /useTimeField\(props, model\)/u);
});
