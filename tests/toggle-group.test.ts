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
  "packages/core/blueprints/toggle-group/ToggleGroup.vue",
);

function normalizeSsrHtml(html: string) {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--\[-->|<!--\]-->/gu, "");
}

async function renderToggleGroup(props: Record<string, unknown>) {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nagi-toggle-group-vite-"));
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
    const toggleGroup = (
      await server.ssrLoadModule(`/@fs${sourcePath}`)
    ).default as Component;
    return normalizeSsrHtml(await renderToString(createSSRApp({
      render: () => h(toggleGroup, props),
    })));
  } finally {
    await server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
}

test("ToggleGroup renders a named native button group in single mode", async () => {
  const html = await renderToggleGroup({
    label: "Text alignment",
    modelValue: "center",
    items: [
      { key: "left", label: "Left" },
      { key: "center", label: "Center" },
      { key: "right", label: "Right" },
    ],
  });

  assert.match(html, /^<div class="n-toggle-group" role="group" aria-label="Text alignment">/u);
  assert.equal(html.match(/<button class="button" type="button"/gu)?.length, 3);
  assert.match(html, /aria-pressed="false">Left<\/button>/u);
  assert.match(html, /aria-pressed="true">Center<\/button>/u);
  assert.match(html, /aria-pressed="false">Right<\/button>/u);
  assert.equal(html.match(/aria-pressed="true"/gu)?.length, 1);
  assert.doesNotMatch(html, /tabindex|aria-selected|role="radio"/u);
});

test("ToggleGroup multiple mode preserves all buttons as native tab stops", async () => {
  const html = await renderToggleGroup({
    label: "Text styles",
    mode: "multiple",
    modelValue: ["bold", "underline"],
    items: [
      { key: "bold", label: "Bold" },
      { key: "italic", label: "Italic" },
      { key: "underline", label: "Underline" },
    ],
  });

  assert.match(html, /aria-pressed="true">Bold<\/button>/u);
  assert.match(html, /aria-pressed="false">Italic<\/button>/u);
  assert.match(html, /aria-pressed="true">Underline<\/button>/u);
  assert.equal(html.match(/aria-pressed="true"/gu)?.length, 2);
  assert.doesNotMatch(html, /tabindex|aria-activedescendant/u);
});

test("ToggleGroup combines group and item disabled state on native buttons", async () => {
  const itemDisabled = await renderToggleGroup({
    label: "View",
    modelValue: null,
    items: [
      { key: "grid", label: "Grid", disabled: true },
      { key: "list", label: "List" },
    ],
  });
  assert.match(itemDisabled, /aria-pressed="false" disabled>Grid<\/button>/u);
  assert.match(itemDisabled, /aria-pressed="false">List<\/button>/u);

  const groupDisabled = await renderToggleGroup({
    label: "View",
    modelValue: "list",
    disabled: true,
    items: [
      { key: "grid", label: "Grid" },
      { key: "list", label: "List" },
    ],
  });
  assert.equal(groupDisabled.match(/ disabled/gu)?.length, 2);
  assert.match(groupDisabled, /aria-pressed="true" disabled>List<\/button>/u);
});

test("ToggleGroup source delegates selection policy and avoids a focus state machine", () => {
  const source = fs.readFileSync(sourcePath, "utf8");
  const manifest = new Set<string>(nagiThemeTokens);

  assert.match(source, /export interface ToggleGroupItem/u);
  assert.match(source, /useToggleGroup/u);
  assert.match(source, /mode\?: "single" \| "multiple"/u);
  assert.match(source, /defineModel<ToggleGroupValue>\(\{ required: true \}\)/u);
  assert.doesNotMatch(source, /function (?:isPressed|toggleItem)/u);
  assert.match(source, /<button[\s\S]*type="button"[\s\S]*:aria-pressed="toggleGroup\.isPressed\(item\.key\)"/u);
  assert.doesNotMatch(source, /tabindex|onKeydown|@keydown|aria-activedescendant|aria-selected/u);
  assert.doesNotMatch(source, /<slot\b|Teleport|provide\(|inject\(|asChild|data-state/u);
  assert.doesNotMatch(source, /\b(?:watch|watchEffect|onMounted|document|window)\b/u);
  assert.doesNotMatch(source, /\.zone\b/u);
  assert.doesNotMatch(source, /var\(--nagi-[^,)]+,/u, "theme tokens have no fallbacks");
  assert.doesNotMatch(source, /#[\da-f]{3,8}\b|\brgba?\(|\bhsla?\(/iu);
  assert.match(source, /@media \(forced-colors: active\)/u);

  for (const match of source.matchAll(/var\((--nagi-[a-z0-9-]+)\)/g)) {
    assert.ok(manifest.has(match[1] as string), `unknown token ${match[1]}`);
  }
});
