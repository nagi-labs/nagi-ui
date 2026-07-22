import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import vue from "@vitejs/plugin-vue";
import { createServer, type ViteDevServer } from "vite";
import { createSSRApp, h, type Component } from "vue";
import { renderToString } from "vue/server-renderer";

import { nagiThemeTokens } from "../packages/core/theme/tokens.mjs";

const repo = path.join(import.meta.dirname, "..");
const skeletonPath = path.join(
  repo,
  "packages/core/blueprints/skeleton/Skeleton.vue",
);
const spinnerPath = path.join(
  repo,
  "packages/core/blueprints/spinner/Spinner.vue",
);

function normalizeSsrHtml(html: string) {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--\[-->|<!--\]-->/gu, "");
}

async function withComponents(
  run: (components: { skeleton: Component; spinner: Component }) => Promise<void>,
) {
  const server: ViteDevServer = await createServer({
    configFile: false,
    plugins: [vue()],
    root: path.join(repo, "playground"),
    cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), "nagi-indicators-vite-")),
    logLevel: "silent",
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const skeleton = (
      await server.ssrLoadModule(`/@fs${skeletonPath}`)
    ).default as Component;
    const spinner = (
      await server.ssrLoadModule(`/@fs${spinnerPath}`)
    ).default as Component;
    await run({ skeleton, spinner });
  } finally {
    await server.close();
  }
}

test("Skeleton SSR remains presentation-only", async () => {
  await withComponents(async ({ skeleton }) => {
    const html = normalizeSsrHtml(await renderToString(createSSRApp({
      render: () => h(skeleton),
    })));

    assert.match(html, /^<span class="n-skeleton" aria-hidden="true"><\/span>$/);
    assert.doesNotMatch(html, /aria-busy|aria-live|role=/);
  });
});

test("Spinner SSR exposes status semantics only when it has an accessible label", async () => {
  await withComponents(async ({ spinner }) => {
    const decorative = normalizeSsrHtml(await renderToString(createSSRApp({
      render: () => h(spinner),
    })));
    assert.match(decorative, /^<span class="n-spinner" aria-hidden="true"><\/span>$/);
    assert.doesNotMatch(decorative, /role=|aria-label=/);

    const labelled = normalizeSsrHtml(await renderToString(createSSRApp({
      render: () => h(spinner, { label: "Loading account" }),
    })));
    assert.match(labelled, /class="n-spinner"/);
    assert.match(labelled, /role="status"/);
    assert.match(labelled, /aria-label="Loading account"/);
    assert.doesNotMatch(labelled, /aria-hidden/);
    assert.doesNotMatch(labelled, /aria-valuenow|role="progressbar"/);
  });
});

test("Skeleton and Spinner sources keep a thin motion and theme contract", () => {
  const manifest = new Set<string>(nagiThemeTokens);

  for (const [name, sourcePath] of [
    ["Skeleton", skeletonPath],
    ["Spinner", spinnerPath],
  ] as const) {
    const source = fs.readFileSync(sourcePath, "utf8");

    assert.match(source, new RegExp(`class="n-${name.toLowerCase()}"`));
    assert.match(source, /@media \(prefers-reduced-motion: reduce\)/);
    assert.doesNotMatch(source, /<slot|Teleport|provide\(|inject\(|data-state/);
    assert.doesNotMatch(source, /\b(?:watch|watchEffect|computed|ref|onMounted|document|window)\b/);
    assert.doesNotMatch(source, /var\(--nagi-[^,)]+,/, "theme tokens have no fallbacks");
    assert.doesNotMatch(source, /#[\da-f]{3,8}\b|\brgba?\(|\bhsla?\(/iu);

    for (const match of source.matchAll(/var\((--nagi-[a-z0-9-]+)\)/g)) {
      assert.ok(manifest.has(match[1] as string), `${name}: unknown token ${match[1]}`);
    }
  }

  const skeleton = fs.readFileSync(skeletonPath, "utf8");
  assert.doesNotMatch(skeleton, /defineProps|aria-busy|aria-live|role=/);

  const spinner = fs.readFileSync(spinnerPath, "utf8");
  assert.match(spinner, /label\?: string/);
  assert.doesNotMatch(spinner, /value\??:|max\??:|aria-valuenow|role="progressbar"/);
});
