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

function normalizeSsrHtml(html: string): string {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--(?:\[-->|\]-->|-->)?/gu, "");
}

async function load(file: string): Promise<{ component: Component; close: () => Promise<void> }> {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nagi-thin-navigation-vite-"));
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
  const component = (
    await server.ssrLoadModule(`/@fs${path.join(repo, "packages/core/blueprints", file)}`)
  ).default as Component;
  return {
    component,
    close: async () => {
      await server.close();
      fs.rmSync(cacheDir, { recursive: true, force: true });
    },
  };
}

test("Breadcrumb emits a native named navigation trail", async () => {
  const { component, close } = await load("breadcrumb/Breadcrumb.vue");
  try {
    const html = normalizeSsrHtml(await renderToString(createSSRApp({
      render: () => h(component, {
        label: "Project path",
        separator: "›",
        items: [
          { key: "home", label: "Home", href: "/" },
          { key: "packages", label: "Packages", href: "/packages" },
          { key: "nagi", label: "Nagi UI" },
        ],
      }),
    })));

    assert.match(html, /^<nav class="n-breadcrumb" aria-label="Project path"/);
    assert.match(html, /<ol class="list"/);
    assert.equal(html.match(/<li class="item"/g)?.length, 3);
    assert.match(html, /<a class="link" href="\/">Home<\/a>/);
    assert.match(html, /aria-hidden="true"[^>]*>\s*›\s*<\/span>/);
    assert.match(html, /<span class="text" aria-current="page">Nagi UI<\/span>/);
    assert.equal(html.match(/aria-current="page"/g)?.length, 1);
  } finally {
    await close();
  }
});

test("Breadcrumb permits an explicitly current linked item", async () => {
  const { component, close } = await load("breadcrumb/Breadcrumb.vue");
  try {
    const html = normalizeSsrHtml(await renderToString(createSSRApp({
      render: () => h(component, {
        items: [
          { key: "current", label: "Current", href: "/current", current: true },
          { key: "child", label: "Child", href: "/child", current: true },
        ],
      }),
    })));
    assert.match(html, /<a class="link" href="\/current" aria-current="page">Current<\/a>/);
    assert.match(html, /<a class="link" href="\/child">Child<\/a>/);
    assert.equal(html.match(/aria-current="page"/g)?.length, 1);
  } finally {
    await close();
  }
});

test("ButtonGroup owns only group semantics and layout orientation", async () => {
  const { component, close } = await load("button-group/ButtonGroup.vue");
  try {
    const html = normalizeSsrHtml(await renderToString(createSSRApp({
      render: () => h(
        component,
        { label: "Editor actions", orientation: "vertical" },
        { default: () => [h("button", { type: "button" }, "Save"), h("a", { href: "/" }, "Back")] },
      ),
    })));
    const root = html.match(/^<div[^>]*>/u)?.[0] ?? "";
    assert.match(root, /class="n-button-group"/u);
    assert.match(root, /data-orientation="vertical"/u);
    assert.match(root, /role="group"/u);
    assert.match(root, /aria-label="Editor actions"/u);
    assert.match(html, /<button type="button">Save<\/button>/);
    assert.match(html, /<a href="\/">Back<\/a>/);
    assert.doesNotMatch(html, /aria-orientation|data-state/);
  } finally {
    await close();
  }
});

test("thin navigation SFCs contain no lifecycle behavior or literal theme fallback", () => {
  for (const file of ["breadcrumb/Breadcrumb.vue", "button-group/ButtonGroup.vue"]) {
    const source = fs.readFileSync(path.join(repo, "packages/core/blueprints", file), "utf8");
    assert.doesNotMatch(source, /\b(?:watch|watchEffect|onMounted|document|window)\b/);
    assert.doesNotMatch(source, /var\(--nagi-[^,)]+,|#[\da-f]{3,8}\b|\brgba?\(/iu);
    assert.doesNotMatch(source, /Teleport|provide\(|inject\(|data-state/);
  }
});
