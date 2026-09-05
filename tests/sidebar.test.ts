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
const blueprintRoot = path.join(repo, "packages/core/blueprints/sidebar");

function normalize(html: string) {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--(?:\[-->|\]-->|-->)?/gu, "");
}

test("Sidebar composes native complementary and navigation landmarks", async () => {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nagi-sidebar-vite-"));
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
    const load = async (file: string) =>
      (await server.ssrLoadModule(`/@fs${path.join(blueprintRoot, file)}`)).default as Component;
    const [Sidebar, SidebarSection, SidebarLink] = await Promise.all([
      load("Sidebar.vue"),
      load("SidebarSection.vue"),
      load("SidebarLink.vue"),
    ]);
    const html = normalize(
      await renderToString(
        createSSRApp({
          render: () =>
            h(
              Sidebar,
              { label: "Workspace navigation", id: "workspace-sidebar" },
              {
                default: () =>
                  h(
                    SidebarSection,
                    { label: "Workspace", headingId: "workspace-heading" },
                    {
                      default: () => [
                        h(
                          SidebarLink,
                          { href: "/dashboard", current: true },
                          { default: () => "Dashboard" },
                        ),
                        h(
                          SidebarLink,
                          { href: "/customers", target: "_blank" },
                          { default: () => "Customers" },
                        ),
                      ],
                    },
                  ),
                footer: () => "All systems operational",
              },
            ),
        }),
      ),
    );

    assert.match(
      html,
      /^<aside class="n-sidebar" id="workspace-sidebar" aria-label="Workspace navigation">/u,
    );
    assert.match(html, /<nav class="nav" aria-label="Workspace navigation">/u);
    assert.match(html, /<section class="n-sidebar-section" aria-labelledby="workspace-heading">/u);
    assert.match(html, /<h2 id="workspace-heading" class="title">Workspace<\/h2>/u);
    assert.match(
      html,
      /<a class="n-sidebar-link" href="\/dashboard" aria-current="page">Dashboard<\/a>/u,
    );
    assert.match(
      html,
      /<a class="n-sidebar-link"[^>]*href="\/customers"[^>]*target="_blank"[^>]*>Customers<\/a>/u,
    );
    assert.match(html, /<footer class="footer">All systems operational<\/footer>/u);
  } finally {
    await server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
});

test("Sidebar Blueprints stay thin, native, and token-only", () => {
  for (const file of ["Sidebar.vue", "SidebarSection.vue", "SidebarLink.vue"]) {
    const source = fs.readFileSync(path.join(blueprintRoot, file), "utf8");
    assert.match(source, /defineOptions\(\{ inheritAttrs: false \}\)/u, file);
    assert.doesNotMatch(source, /\b(?:watch|watchEffect|onMounted|document|window)\b/u, file);
    assert.doesNotMatch(source, /var\(--nagi-[^,)]+,|#[\da-f]{3,8}\b|\brgba?\(/iu, file);
    assert.doesNotMatch(source, /role="(?:menu|tree)"|aria-expanded|data-state/u, file);
  }

  const linkSource = fs.readFileSync(path.join(blueprintRoot, "SidebarLink.vue"), "utf8");
  assert.match(linkSource, /useSidebarLink\(props, useAttrs\(\)\)/u);
  assert.doesNotMatch(linkSource, /mergeElementProps|linkInteractionProps|function\s+/u);
});
