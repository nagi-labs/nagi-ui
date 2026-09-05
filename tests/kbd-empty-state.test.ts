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
const blueprintRoot = path.join(repo, "packages/core/blueprints");

function normalizeSsrHtml(html: string): string {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--(?:\[-->|\]-->|-->)?/gu, "");
}

async function withBlueprints(
  run: (components: { NKbd: Component; NEmptyState: Component }) => Promise<void>,
) {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nagi-presentational-vite-"));
  const server = await createServer({
    configFile: false,
    plugins: [vue()],
    root: repo,
    cacheDir,
    optimizeDeps: { noDiscovery: true, include: [] },
    logLevel: "silent",
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const kbd = await server.ssrLoadModule(
      `/@fs${path.join(blueprintRoot, "kbd/Kbd.vue")}`,
    );
    const emptyState = await server.ssrLoadModule(
      `/@fs${path.join(blueprintRoot, "empty-state/EmptyState.vue")}`,
    );
    await run({ Kbd: kbd.default as Component, EmptyState: emptyState.default as Component });
  } finally {
    await server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
}

test("Kbd renders its required plain label through the native kbd element", async () => {
  await withBlueprints(async ({ Kbd }) => {
    const html = normalizeSsrHtml(
      await renderToString(createSSRApp({ render: () => h(Kbd, { label: "Command K" }) })),
    );

    assert.equal(html, '<kbd class="n-kbd">Command K</kbd>');
  });
});

test("EmptyState keeps heading hierarchy neutral and omits absent optional anatomy", async () => {
  await withBlueprints(async ({ EmptyState }) => {
    const html = normalizeSsrHtml(
      await renderToString(
        createSSRApp({ render: () => h(EmptyState, { title: "No projects yet" }) }),
      ),
    );

    assert.match(html, /^<div class="n-empty-state">/);
    assert.match(
      html,
      /<div class="unit"><span class="text -primary">No projects yet<\/span><\/div>/,
    );
    assert.doesNotMatch(html, /<h[1-6]\b/);
    assert.doesNotMatch(html, /class="actions"/);
  });
});

test("EmptyState renders the optional description and only action markup from its default slot", async () => {
  await withBlueprints(async ({ EmptyState }) => {
    const html = normalizeSsrHtml(
      await renderToString(
        createSSRApp({
          render: () =>
            h(
              EmptyState,
              {
                title: "No search results",
                description: "Try a broader query.",
              },
              { default: () => h("button", { type: "button" }, "Clear search") },
            ),
        }),
      ),
    );

    assert.match(html, /<span class="text -secondary">Try a broader query\.<\/span>/);
    assert.match(
      html,
      /<div class="actions"><button type="button">Clear search<\/button><\/div>/,
    );
    assert.doesNotMatch(html, /<h[1-6]\b/);
  });
});

test("Kbd and EmptyState remain presentation-only and use the existing theme contract", () => {
  const sources = {
    Kbd: fs.readFileSync(path.join(blueprintRoot, "kbd/Kbd.vue"), "utf8"),
    EmptyState: fs.readFileSync(
      path.join(blueprintRoot, "empty-state/EmptyState.vue"),
      "utf8",
    ),
  };
  const themeTokens = new Set(nagiThemeTokens);

  assert.doesNotMatch(sources.Kbd, /<slot\b/);
  assert.equal(sources.EmptyState.match(/<slot(?:\s|\/|>)/g)?.length, 1);
  assert.doesNotMatch(sources.EmptyState, /<slot\s+name=/);

  for (const [name, source] of Object.entries(sources)) {
    assert.doesNotMatch(source, /\b(?:watch|watchEffect|onMounted|onUnmounted)\s*\(/);
    assert.doesNotMatch(source, /Teleport|provide\s*\(|inject\s*\(|data-state/);
    assert.doesNotMatch(source, /var\(--nagi-[^,)]+,/, `${name} has no token fallback`);
    assert.doesNotMatch(
      source,
      /#[\da-f]{3,8}\b|\brgba?\(|\bhsla?\(/iu,
      `${name} has no literal color`,
    );

    for (const match of source.matchAll(/var\((--nagi-[a-z0-9-]+)\)/g)) {
      assert.ok(themeTokens.has(match[1] as string), `${name} uses known token ${match[1]}`);
    }
  }
});
