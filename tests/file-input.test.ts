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
  "packages/core/blueprints/file-input/FileInput.vue",
);

function normalizeSsrHtml(html: string) {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--\[-->|<!--\]-->/gu, "");
}

test("FileInput renders a visible native file control and targets attrs at it", async () => {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nagi-file-input-vite-"));
  const server = await createServer({
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
    const fileInput = (
      await server.ssrLoadModule(`/@fs${sourcePath}`)
    ).default as Component;
    const html = normalizeSsrHtml(await renderToString(
      createSSRApp({
        render: () => h(fileInput, {
          label: "Attachments",
          name: "attachments",
          form: "message",
          accept: "image/*,.pdf",
          multiple: true,
          disabled: true,
          required: true,
          capture: "environment",
          webkitdirectory: "",
          "aria-describedby": "attachment-help",
          "data-track": "upload",
          class: "consumer-control",
          style: "max-inline-size: 28rem",
        }),
      }),
    ));

    const root = html.match(/<label[^>]*>/u)?.[0] ?? "";
    const control = html.match(/<input[^>]*>/u)?.[0] ?? "";

    assert.match(root, /class="n-file-input"/u);
    assert.doesNotMatch(root, /consumer-control|capture|aria-describedby|data-track/u);
    assert.match(html, /<span class="unit">Attachments<\/span>/u);
    assert.match(control, /class="[^"]*consumer-control/u);
    assert.match(control, /type="file"/u);
    assert.match(control, /name="attachments"/u);
    assert.match(control, /form="message"/u);
    assert.match(control, /accept="image\/\*,\.pdf"/u);
    assert.match(control, /multiple/u);
    assert.match(control, /disabled/u);
    assert.match(control, /required/u);
    assert.match(control, /capture="environment"/u);
    assert.match(control, /\swebkitdirectory(?:="true")?(?:\s|>)/u);
    assert.match(control, /aria-describedby="attachment-help"/u);
    assert.match(control, /data-track="upload"/u);
    assert.match(control, /style="max-inline-size:\s*28rem;?"/u);
    assert.equal(html.match(/<input/gu)?.length, 1);
  } finally {
    await server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
});

test("FileInput leaves file state, chooser, and reset policy with the browser", () => {
  const source = fs.readFileSync(sourcePath, "utf8");

  assert.match(source, /defineOptions\(\{ inheritAttrs: false \}\)/u);
  assert.match(source, /label: string/u);
  assert.doesNotMatch(source, /v-bind="\$attrs"/u);
  assert.match(source, /mergeElementProps\(attrs,/u);
  assert.match(source, /&::file-selector-button/u);
  assert.match(
    source,
    /&::file-selector-button \{[\s\S]*box-sizing: border-box[\s\S]*min-block-size: var\(--nagi-size-control\)[\s\S]*padding: var\(--nagi-space-item\)/u,
  );
  assert.match(
    source,
    /> \.input \{[\s\S]*border: 0[\s\S]*background: transparent/u,
  );
  assert.match(source, /&:focus-visible::file-selector-button/u);
  assert.doesNotMatch(
    source,
    /\bfont:\s*inherit|font-size:\s*0\.875rem/u,
    "native file-control typography stays UA-owned",
  );
  assert.doesNotMatch(source, /<slot\b|defineModel\b|modelValue|v-model/u);
  assert.doesNotMatch(
    source,
    /\b(?:ref|reactive|watch|watchEffect|onMounted|onUpdated)\s*[<(]/u,
  );
  assert.doesNotMatch(source, /\b(?:FileList|FileReader|FormData)\b|\.files\b/u);
  assert.doesNotMatch(source, /\b(?:document|window|ResizeObserver)\b/iu);
  assert.doesNotMatch(source, /display:\s*none|opacity:\s*0|clip-path|sr-only/iu);
  assert.doesNotMatch(source, /var\([^\n,]+,/u, "theme token fallbacks are forbidden");
  assert.doesNotMatch(
    source,
    /#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch|lab|lch)\(/iu,
    "color literals are forbidden",
  );
});
