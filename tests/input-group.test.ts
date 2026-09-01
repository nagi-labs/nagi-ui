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
const sourceFile = path.join(repo, "packages/core/blueprints/input-group/InputGroup.vue");

function normalizeSsrHtml(html: string): string {
  return html.replace(/\sdata-v-[\da-f]+(?:-s)?/gu, "").replace(/<!--(?:\[-->|\]-->|-->)?/gu, "");
}

async function load(): Promise<{ component: Component; close: () => Promise<void> }> {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nagi-input-group-vite-"));
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
  const component = (await server.ssrLoadModule(`/@fs${sourceFile}`)).default as Component;
  return {
    component,
    close: async () => {
      await server.close();
      fs.rmSync(cacheDir, { recursive: true, force: true });
    },
  };
}

test("InputGroup owns the visual frame without duplicating the native input API", async () => {
  const { component, close } = await load();
  try {
    const html = normalizeSsrHtml(
      await renderToString(
        createSSRApp({
          render: () =>
            h(
              component,
              {
                prefix: "https://",
                suffix: ".dev",
                id: "project-url-group",
                "data-owner": "application",
              },
              {
                default: () =>
                  h("input", {
                    class: "n-input-group-control",
                    name: "project-url",
                    type: "url",
                    autocomplete: "url",
                    "aria-label": "Project URL",
                  }),
              },
            ),
        }),
      ),
    );

    assert.match(html, /^<div class="n-input-group"[^>]*>/);
    assert.match(html, /id="project-url-group"/);
    assert.match(html, /data-owner="application"/);
    assert.match(html, /<span class="unit -prefix">https:\/\/<\/span>/);
    assert.match(
      html,
      /<div class="unit -control"><input class="n-input-group-control" name="project-url" type="url" autocomplete="url" aria-label="Project URL"><\/div>/,
    );
    assert.match(html, /<span class="unit -suffix">\.dev<\/span>/);
    assert.doesNotMatch(html, /role="group"|data-state/);
  } finally {
    await close();
  }
});

test("InputGroup limits rich markup to adornment content and the action surface", async () => {
  const { component, close } = await load();
  try {
    const html = normalizeSsrHtml(
      await renderToString(
        createSSRApp({
          render: () =>
            h(
              component,
              { prefix: "ignored", suffix: "ignored" },
              {
                prefix: ({ prefix }: { prefix?: string }) =>
                  h(
                    "span",
                    { class: "n-input-group-prefix", "aria-hidden": "true", title: prefix },
                    "@",
                  ),
                default: () =>
                  h("input", { class: "n-input-group-control", "aria-label": "Username" }),
                suffix: ({ suffix }: { suffix?: string }) =>
                  h("abbr", { class: "n-input-group-suffix", title: suffix }, "ID"),
                action: () =>
                  h("button", { class: "n-input-group-action", type: "button" }, "Generate"),
              },
            ),
        }),
      ),
    );

    assert.match(
      html,
      /<span class="unit -prefix"><span class="n-input-group-prefix" aria-hidden="true" title="ignored">@<\/span><\/span>/,
    );
    assert.match(
      html,
      /<span class="unit -suffix"><abbr class="n-input-group-suffix" title="ignored">ID<\/abbr><\/span>/,
    );
    assert.match(
      html,
      /<div class="unit -action"><button class="n-input-group-action" type="button">Generate<\/button><\/div>/,
    );
    assert.doesNotMatch(html, />ignored</);
  } finally {
    await close();
  }
});

test("InputGroup remains a styling-only anatomy with a bounded slot surface", () => {
  const source = fs.readFileSync(sourceFile, "utf8");
  const themeTokens = new Set(nagiThemeTokens);

  assert.equal(source.match(/<slot(?:\s|\/|>)/g)?.length, 4);
  assert.match(source, /<slot\s+name="prefix"\s+:prefix="prefix"\s*>/);
  assert.match(source, /<slot\s+name="suffix"\s+:suffix="suffix"\s*>/);
  assert.match(source, /<slot name="action" \/>/);
  assert.match(source, /:slotted\(\.n-input-group-control\)/);
  assert.match(source, /:slotted\(\.n-input-group-action\)/);
  assert.match(source, /:has\([^\n]+:deep\(\.n-input-group-control:user-invalid\)\)/);
  assert.match(source, /:slotted\(\.n-input-group-action:focus-visible\)/);
  assert.doesNotMatch(source, /:slotted\(\.n-input-group-action\)[^{]*\{[^}]*box-shadow:\s*none/su);
  assert.match(source, /&\.-control\s*\{[^}]*min-inline-size:\s*4ch/su);
  assert.match(source, /&\.-prefix\s*\{[^}]*flex:\s*0 1 auto/su);
  assert.doesNotMatch(source, /:slotted\((?:input|select|textarea|button)\b/);
  assert.doesNotMatch(source, /defineModel|\b(?:name|form|type|disabled|required|readOnly)\?:/);
  assert.doesNotMatch(source, /\b(?:watch|watchEffect|onMounted|onUnmounted)\s*\(/);
  assert.match(source, /const attrs = useAttrs\(\)/u);
  assert.match(source, /v-bind="attrs"/u);
  assert.doesNotMatch(source, /mergeElementProps/u);
  assert.doesNotMatch(source, /Teleport|provide\s*\(|inject\s*\(|data-state|asChild/);
  assert.doesNotMatch(source, /var\(--nagi-[^,)]+,/);
  assert.doesNotMatch(source, /#[\da-f]{3,8}\b|\brgba?\(|\bhsla?\(/iu);
  assert.doesNotMatch(source, /margin(?:-|:)/);
  assert.match(source, /@media \(forced-colors: active\)/);

  for (const match of source.matchAll(/var\((--nagi-[a-z0-9-]+)\)/g)) {
    assert.ok(themeTokens.has(match[1] as string), `NInputGroup uses known token ${match[1]}`);
  }
});
