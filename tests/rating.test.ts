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
const sourcePath = path.join(repo, "packages/core/blueprints/rating/Rating.vue");

function normalizeSsrHtml(html: string) {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--\[-->|<!--\]-->/gu, "");
}

async function loadRating() {
  const server = await createServer({
    configFile: false,
    plugins: [vue()],
    root: path.join(repo, "playground"),
    cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), "nagi-rating-vite-")),
    logLevel: "silent",
    server: { middlewareMode: true },
    appType: "custom",
  });

  const Rating = (
    await server.ssrLoadModule(`/@fs${sourcePath}`)
  ).default as Component;
  return { Rating, server };
}

test("Rating renders a localized native radio group", async () => {
  const { Rating, server } = await loadRating();

  try {
    const html = normalizeSsrHtml(await renderToString(
      createSSRApp({
        render: () => h(Rating, {
          label: "Satisfaction",
          items: [
            { value: 1, label: "Very dissatisfied" },
            { value: 2, label: "Dissatisfied" },
            { value: 3, label: "Satisfied" },
          ],
          name: "satisfaction",
          modelValue: 2,
          form: "survey",
          disabled: true,
          required: true,
        }),
      }),
    ));

    const controls = html.match(/<input[^>]*>/gu) ?? [];

    assert.match(html, /^<fieldset class="n-rating" disabled>/u);
    assert.match(html, /<legend class="legend">Satisfaction<\/legend>/u);
    assert.equal(controls.length, 3);
    for (const control of controls) {
      assert.match(control, /type="radio"/u);
      assert.match(control, /name="satisfaction"/u);
      assert.match(control, /form="survey"/u);
      assert.match(control, /required/u);
    }
    assert.doesNotMatch(controls[0] ?? "", /checked/u);
    assert.match(controls[1] ?? "", /checked/u);
    assert.doesNotMatch(controls[2] ?? "", /checked/u);
    assert.match(html, /<span class="icon" aria-hidden="true">★<\/span>/u);
    assert.match(html, /<span class="text">Very dissatisfied<\/span>/u);
    assert.match(html, /<span class="text">Dissatisfied<\/span>/u);
    assert.match(html, /<span class="text">Satisfied<\/span>/u);
  } finally {
    await server.close();
  }
});

test("Rating source keeps interaction native and its public schema small", () => {
  const source = fs.readFileSync(sourcePath, "utf8");

  assert.match(source, /export interface RatingItem/u);
  assert.match(source, /items: readonly RatingItem\[\]/u);
  assert.match(source, /name: string/u);
  assert.match(source, /defineModel<number \| null>\(\{ default: null \}\)/u);
  assert.match(source, /<fieldset[\s\S]*<legend[\s\S]*type="radio"/u);
  assert.match(source, /useNativeRadioGroupReset\(inputs, model\)/u);
  assert.doesNotMatch(source, /computed|nativeModel|resetControl/u);
  assert.match(source, /@media \(forced-colors: active\)/u);
  assert.doesNotMatch(source, /<slot\b|provide\(|inject\(|data-state|role="radiogroup"/u);
  assert.doesNotMatch(source, /watch(?:Effect)?\b|onMounted\b|onUpdated\b/u);
  assert.doesNotMatch(source, /\b(?:document|window|ResizeObserver)\b/iu);
  assert.doesNotMatch(source, /clearable|hover|halfStar|roving/iu);
  assert.doesNotMatch(source, /var\([^\n,]+,/u, "theme token fallbacks are forbidden");
  assert.doesNotMatch(
    source,
    /#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch|lab|lch)\(/iu,
    "color literals are forbidden",
  );
});
