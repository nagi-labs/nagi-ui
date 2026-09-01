import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import vue from "@vitejs/plugin-vue";
import { createServer } from "vite";
import { createSSRApp, h, type Component } from "vue";
import { renderToString } from "vue/server-renderer";

import { nagiThemeTokens } from "../packages/core/theme/tokens.mjs";

const repo = path.join(import.meta.dirname, "..");
const sourcePath = path.join(
  repo,
  "packages/core/blueprints/pagination/Pagination.vue",
);

function normalizeSsrHtml(html: string) {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--\[-->|<!--\]-->/gu, "");
}

async function renderPagination(props: Record<string, unknown>) {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nagi-pagination-vite-"));
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
    const pagination = (
      await server.ssrLoadModule(`/@fs${sourcePath}`)
    ).default as Component;
    return normalizeSsrHtml(await renderToString(createSSRApp({
      render: () => h(pagination, props),
    })));
  } finally {
    await server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
}

test("Pagination SSR uses native navigation, list, links, and buttons", async () => {
  const html = await renderPagination({
    label: "Search results",
    currentKey: "two",
    items: [
      { key: "one", label: "1", href: "/search?page=1" },
      { key: "two", label: "2" },
      { key: "three", label: "3", href: "/search?page=3" },
    ],
  });

  assert.match(html, /^<nav class="n-pagination"[^>]*aria-label="Search results">/u);
  assert.match(html, /<ol class="list">/u);
  assert.equal(html.match(/<li class="item">/gu)?.length, 3);
  assert.match(html, /<a class="link" href="\/search\?page=1">1<\/a>/u);
  assert.match(html, /<button class="button" type="button" aria-current="page">2<\/button>/u);
  assert.match(html, /<a class="link" href="\/search\?page=3">3<\/a>/u);
  assert.equal(html.match(/aria-current="page"/gu)?.length, 1);
});

test("Pagination keeps disabled navigation and activation inert", async () => {
  const html = await renderPagination({
    currentKey: "disabled-link",
    items: [
      { key: "disabled-link", label: "Previous", href: "/previous", disabled: true },
      { key: "disabled-button", label: "More", disabled: true },
      { key: "enabled", label: "Next", href: "/next" },
    ],
  });

  assert.match(
    html,
    /<span class="text" aria-disabled="true" aria-current="page">Previous<\/span>/u,
  );
  assert.doesNotMatch(html, /href="\/previous"/u);
  assert.match(html, /<button class="button" type="button" disabled>More<\/button>/u);
  assert.equal(html.match(/aria-current="page"/gu)?.length, 1);
});

test("Pagination does not invent a current page for an invalid controlled key", async () => {
  const html = await renderPagination({
    currentKey: "missing",
    items: [
      { key: "one", label: "1", href: "/one" },
      { key: "two", label: "2" },
    ],
  });

  assert.doesNotMatch(html, /aria-current="page"/u);
});

test("Pagination source delegates controlled selection and keeps its schema visible", () => {
  const source = fs.readFileSync(sourcePath, "utf8");
  const manifest = new Set<string>(nagiThemeTokens);

  assert.match(source, /export interface PaginationItem/u);
  assert.match(source, /key: string/u);
  assert.match(source, /label: string/u);
  assert.match(source, /href\?: string/u);
  assert.match(source, /disabled\?: boolean/u);
  assert.match(source, /defineModel<string>\("currentKey", \{ required: true \}\)/u);
  assert.match(source, /select: \[item: PaginationItem\]/u);
  assert.match(source, /usePagination<PaginationItem>/u);
  assert.doesNotMatch(source, /function select(?:Button|Link)/u);
  assert.doesNotMatch(source, /preventDefault|@click\.prevent/u, "native link navigation must remain intact");
  assert.doesNotMatch(source, /<slot\b|Teleport|provide\(|inject\(|asChild|data-state/u);
  assert.doesNotMatch(source, /\b(?:watch|watchEffect|onMounted|document|window)\b/u);
  assert.doesNotMatch(source, /ellipsis|pageCount|firstPage|lastPage/iu);
  assert.doesNotMatch(source, /var\(--nagi-[^,)]+,/u, "theme tokens have no fallbacks");
  assert.doesNotMatch(source, /#[\da-f]{3,8}\b|\brgba?\(|\bhsla?\(/iu);

  for (const match of source.matchAll(/var\((--nagi-[a-z0-9-]+)\)/g)) {
    assert.ok(manifest.has(match[1] as string), `unknown token ${match[1]}`);
  }
});
