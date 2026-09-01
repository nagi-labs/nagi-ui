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
const sourcePath = path.join(repo, "packages/core/blueprints/table/Table.vue");

function normalizeSsrHtml(html: string) {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--\[-->|<!--\]-->/gu, "");
}

async function withTable(run: (table: Component) => Promise<void>) {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nagi-table-vite-"));
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
    const table = (await server.ssrLoadModule(`/@fs${sourcePath}`)).default as Component;
    await run(table);
  } finally {
    await server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
}

test("Table renders native headings, rows, cells, and a caption", async () => {
  await withTable(async (table) => {
    const html = normalizeSsrHtml(await renderToString(createSSRApp({
      render: () => h(table, {
        caption: "Users",
        rowKey: "id",
        columns: [
          { key: "name", label: "Name", rowHeader: true },
          { key: "email", label: "Email" },
        ],
        rows: [{ id: 7, name: "Ada", email: "ada@example.com" }],
      }),
    })));

    assert.match(html, /^<div class="n-table"><table class="table" data-layout="auto">/u);
    assert.match(html, /<caption class="caption">Users<\/caption>/u);
    assert.equal(html.match(/<th class="cell" scope="col"/gu)?.length, 2);
    assert.match(html, /<th class="cell" scope="row"[^>]*>Ada<\/th>/u);
    assert.match(html, /<td class="cell"[^>]*>ada@example\.com<\/td>/u);
    assert.doesNotMatch(html, /role="grid"|role="gridcell"/u);
  });
});

test("Table supports scoped header and cell rendering", async () => {
  await withTable(async (table) => {
    const html = normalizeSsrHtml(await renderToString(createSSRApp({
      render: () => h(table, {
        caption: "Deployments",
        columns: [{ key: "status", label: "Status" }],
        rows: [{ status: "ready" }],
      }, {
        "header-status": ({ column }: { column: { label: string } }) => h("abbr", { title: column.label }, "State"),
        "cell-status": ({ value }: { value: unknown }) => h("strong", String(value).toUpperCase()),
      }),
    })));

    assert.match(html, /<th[^>]*scope="col"[^>]*><abbr title="Status">State<\/abbr><\/th>/u);
    assert.match(html, /<td[^>]*><strong>READY<\/strong><\/td>/u);
  });
});

test("Table empty state keeps valid table structure and colspan", async () => {
  await withTable(async (table) => {
    const html = normalizeSsrHtml(await renderToString(createSSRApp({
      render: () => h(table, {
        caption: "Results",
        captionHidden: true,
        emptyText: "No matching results",
        columns: [
          { key: "name", label: "Name" },
          { key: "status", label: "Status" },
        ],
        rows: [],
      }),
    })));

    assert.match(html, /<caption class="caption" data-hidden="true">Results<\/caption>/u);
    assert.match(html, /<tbody class="tbody"><tr class="row -empty"><td class="cell" colspan="2">No matching results<\/td><\/tr><\/tbody>/u);
  });
});

test("Table source stays native and ownership-readable", () => {
  const source = fs.readFileSync(sourcePath, "utf8");
  for (const element of ["table", "caption", "thead", "tbody", "tr", "th", "td"]) {
    assert.match(source, new RegExp(`<${element}(?:\\s|>)`, "u"));
  }
  assert.doesNotMatch(source, /role=["']grid|virtual|sort|filter|paginate/iu);
});
