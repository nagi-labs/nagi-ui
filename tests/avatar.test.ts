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

function normalizeSsrHtml(html: string) {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--\[-->|<!--\]-->/gu, "");
}

test("Avatar SSR keeps image and fallback semantics deterministic", async () => {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nagi-avatar-vite-"));
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
    const avatar = (
      await server.ssrLoadModule(
        `/@fs${path.join(repo, "packages/core/blueprints/avatar/Avatar.vue")}`,
      )
    ).default as Component;

    const imageHtml = normalizeSsrHtml(
      await renderToString(
        createSSRApp({
        render: () => h(avatar, {
          src: "/ada.jpg",
          alt: "Ada Lovelace",
          class: "n-avatar -small",
          "data-testid": "owner",
        }),
        }),
      ),
    );
    assert.match(imageHtml, /<span[^>]*class="n-avatar -small"[^>]*role="img"/);
    assert.match(imageHtml, /class="n-avatar -small"/);
    assert.doesNotMatch(imageHtml, /class="n-avatar n-avatar/);
    assert.match(imageHtml, /data-testid="owner"/);
    assert.match(imageHtml, /aria-label="Ada Lovelace"/);
    assert.match(imageHtml, /<span class="unit">AL<\/span>/);
    assert.match(imageHtml, /<img[^>]*class="image"[^>]*src="\/ada.jpg"[^>]*alt=""/);

    const fallbackHtml = normalizeSsrHtml(
      await renderToString(
        createSSRApp({
          render: () => h(avatar, { alt: "Account owner", fallback: "AO" }),
        }),
      ),
    );
    assert.match(fallbackHtml, /<span class="unit">AO<\/span>/);
    assert.doesNotMatch(fallbackHtml, /<img/);

    const slotHtml = normalizeSsrHtml(
      await renderToString(
        createSSRApp({
          render: () =>
            h(
              avatar,
              { alt: "Account owner", fallback: "AO" },
              { fallback: ({ fallback }: { fallback: string }) => h("b", fallback) },
            ),
        }),
      ),
    );
    assert.match(slotHtml, /<span class="unit"><b>AO<\/b><\/span>/);

    const decorativeHtml = normalizeSsrHtml(
      await renderToString(createSSRApp({ render: () => h(avatar, { alt: "" }) })),
    );
    assert.match(decorativeHtml, /aria-hidden="true"/);
    assert.doesNotMatch(decorativeHtml, /role="img"/);
  } finally {
    await server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
});
