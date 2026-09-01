import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import vue from "@vitejs/plugin-vue";
import { createServer, type ViteDevServer } from "vite";
import { createSSRApp, h, type Component } from "vue";
import { renderToString } from "vue/server-renderer";

const repo = path.join(import.meta.dirname, "..");

function normalizeSsrHtml(html: string): string {
  return html.replace(/<!--(?:\[-->|\]-->|-->)?/g, "");
}

async function loadAccordion(): Promise<{ server: ViteDevServer; component: Component; cacheDir: string }> {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nagi-accordion-vite-"));
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
    await server.ssrLoadModule(
      `/@fs${path.join(repo, "packages/core/blueprints/accordion/Accordion.vue")}`,
    )
  ).default as Component;
  return { server, component, cacheDir };
}

const items = [
  { key: "shipping", summary: "How does shipping work?", content: "Ships in two days." },
  { key: "returns", summary: "Can I return it?", content: "Returns are accepted." },
  { key: "legacy", summary: "Legacy policy", disabled: true },
] as const;

test("SSR emits native exclusive details anatomy and one normalized initial open item", async () => {
  const { server, component, cacheDir } = await loadAccordion();
  try {
    const html = normalizeSsrHtml(await renderToString(createSSRApp({
      render: () => h(component, { items, defaultOpenKeys: ["shipping", "returns"] }),
    })));

    assert.match(html, /^<div class="n-accordion/);
    assert.equal(html.match(/<details /g)?.length, 3);
    const names = [...html.matchAll(/<details[^>]* name="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(names.length, 3);
    assert.equal(new Set(names).size, 1);
    assert.equal(html.match(/ open(?:="")?/g)?.length, 1);
    assert.match(
      html,
      /<details[^>]*><summary[^>]*>How does shipping work\?<\/summary><section/,
      "summary is the first child of each native details element",
    );
    assert.match(html, /<summary[^>]*aria-disabled="true"[^>]*>Legacy policy<\/summary>/);
    assert.doesNotMatch(html, /role="(?:button|region)"/, "native semantics are not duplicated with ARIA roles");
  } finally {
    await server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
});

test("multiple mode omits the native group name and preserves all initial open items", async () => {
  const { server, component, cacheDir } = await loadAccordion();
  try {
    const html = normalizeSsrHtml(await renderToString(createSSRApp({
      render: () => h(component, {
        items,
        multiple: true,
        defaultOpenKeys: ["shipping", "returns"],
      }),
    })));

    assert.doesNotMatch(html, /<details[^>]* name=/);
    assert.equal(html.match(/ open(?:="")?/g)?.length, 2);
  } finally {
    await server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
});

test("content-only slots keep the owned summary and panel wrappers", async () => {
  const { server, component, cacheDir } = await loadAccordion();
  try {
    const html = normalizeSsrHtml(await renderToString(createSSRApp({
      render: () => h(
        component,
        { items: [items[0]] },
        {
          summary: ({ summary }: { summary: string }) => h("strong", `${summary} — Express`),
          panel: () => h("ul", [h("li", "Tracked"), h("li", "Insured")]),
        },
      ),
    })));

    assert.match(html, /<summary[^>]*><strong>How does shipping work\? — Express<\/strong><\/summary>/);
    assert.match(html, /<section class="section"[^>]*><ul><li>Tracked<\/li>/);
  } finally {
    await server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
});

test("Accordion source keeps behavior native and uses token-only themed values", () => {
  const source = fs.readFileSync(
    path.join(repo, "packages/core/blueprints/accordion/Accordion.vue"),
    "utf8",
  );

  assert.match(source, /<details/);
  assert.match(source, /useAccordion\(props, openKeys\)/);
  assert.doesNotMatch(source, /useId|preventDefault|stopPropagation/);
  assert.doesNotMatch(source, /\b(?:watch|watchEffect|onMounted|onBeforeUnmount|useAttrs|document|window)\b/);
  assert.doesNotMatch(source, /Teleport|provide\(|inject\(|data-state/);
  assert.doesNotMatch(source, /var\(--nagi-[^,)]+,/, "theme tokens have no literal fallbacks");
});
