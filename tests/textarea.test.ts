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
  "packages/core/blueprints/textarea/Textarea.vue",
);

function normalizeSsrHtml(html: string) {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--\[-->|<!--\]-->/gu, "");
}

test("Textarea renders a native form-associated textarea and targets attrs at the control", async () => {
  const server = await createServer({
    configFile: false,
    plugins: [vue()],
    root: path.join(repo, "playground"),
    cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), "nagi-textarea-vite-")),
    logLevel: "silent",
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const textarea = (
      await server.ssrLoadModule(`/@fs${sourcePath}`)
    ).default as Component;
    const html = normalizeSsrHtml(await renderToString(
      createSSRApp({
        render: () => h(textarea, {
          label: "Biography",
          modelValue: "Vue developer",
          name: "biography",
          form: "profile",
          rows: 6,
          disabled: true,
          required: true,
          readOnly: true,
          autocomplete: "off",
          maxlength: 240,
          "aria-describedby": "biography-help",
          class: "consumer-control",
        }),
      }),
    ));

    const root = html.match(/<label[^>]*>/u)?.[0] ?? "";
    const control = html.match(/<textarea[^>]*>/u)?.[0] ?? "";

    assert.match(root, /class="n-textarea"/u);
    assert.doesNotMatch(root, /consumer-control/u);
    assert.match(html, /<span class="unit">Biography<\/span>/u);
    assert.match(control, /class="[^"]*consumer-control/u);
    assert.match(control, /name="biography"/u);
    assert.match(control, /form="profile"/u);
    assert.match(control, /rows="6"/u);
    assert.match(control, /disabled/u);
    assert.match(control, /required/u);
    assert.match(control, /readonly/u);
    assert.match(control, /autocomplete="off"/u);
    assert.match(control, /maxlength="240"/u);
    assert.match(control, /aria-describedby="biography-help"/u);
    assert.match(html, />Vue developer<\/textarea>/u);
    assert.equal(html.match(/<textarea/gu)?.length, 1);
  } finally {
    await server.close();
  }
});

test("Textarea source keeps reset mechanism fixed and exposes no speculative wiring", () => {
  const source = fs.readFileSync(sourcePath, "utf8");

  assert.match(source, /defineOptions\(\{ inheritAttrs: false \}\)/u);
  assert.match(source, /defineModel<string>\(\{ default: "" \}\)/u);
  assert.match(source, /ref<HTMLTextAreaElement \| null>\(null\)/u);
  assert.match(source, /useNativeValueReset\(textarea, model\)/u);
  assert.match(source, /<textarea[\s\S]*v-bind="\$attrs"/u);
  assert.doesNotMatch(source, /<slot\b|watch(?:Effect)?\b|onMounted\b|onUpdated\b/u);
  assert.doesNotMatch(source, /\b(?:document|window|ResizeObserver)\b|autosize/iu);
  assert.doesNotMatch(source, /var\([^\n,]+,/u, "theme token fallbacks are forbidden");
  assert.doesNotMatch(
    source,
    /#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch|lab|lch)\(/iu,
    "color literals are forbidden",
  );
});
