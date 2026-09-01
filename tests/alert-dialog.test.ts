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
const sourcePath = path.join(
  repo,
  "packages/core/blueprints/alert-dialog/AlertDialog.vue",
);

function normalizeSsrHtml(html: string) {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--\[-->|<!--\]-->/gu, "");
}

async function withAlertDialog(run: (component: Component) => Promise<void>) {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nagi-alert-dialog-vite-"));
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
    const component = (
      await server.ssrLoadModule(`/@fs${sourcePath}`)
    ).default as Component;
    await run(component);
  } finally {
    await server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
}

test("[ALD-DIALOG-SEM-01][ALD-DIALOG-SEM-02][ALD-DIALOG-SEM-03][ALD-FOCUS-01] AlertDialog SSR owns an alertdialog name, description, and explicit actions", async () => {
  await withAlertDialog(async (alertDialog) => {
    const html = normalizeSsrHtml(await renderToString(
      createSSRApp({
        render: () => h(alertDialog, {
          triggerLabel: "Delete account",
          title: "Delete this account?",
          description: "This action cannot be undone.",
          actionLabel: "Delete",
          cancelLabel: "Keep account",
        }),
      }),
    ));

    assert.match(html, /^<div class="n-alert-dialog"[^>]*>/);
    assert.match(html, /<button class="button -trigger" type="button"[^>]*>Delete account<\/button>/);

    const dialog = html.match(/<dialog[^>]*>/)?.[0] ?? "";
    assert.match(dialog, /role="alertdialog"/);
    assert.match(dialog, /aria-labelledby="([^"]+)-title"/);
    assert.match(dialog, /aria-describedby="([^"]+)-description"/);
    assert.match(dialog, /closedby="closerequest"/);

    assert.match(html, /<h2[^>]*>Delete this account\?<\/h2>/);
    assert.match(html, /<p[^>]*>This action cannot be undone\.<\/p>/);
    assert.match(html, /<footer class="footer">/);
    const cancelButton = html.match(/<button[^>]*>Keep account<\/button>/)?.[0] ?? "";
    assert.match(cancelButton, /autofocus/);
    assert.match(cancelButton, /class="button -cancel"/);
    assert.match(cancelButton, /type="button"/);
    assert.match(cancelButton, /command="close"/);

    const actionButton = html.match(/<button[^>]*>Delete<\/button>/)?.[0] ?? "";
    assert.match(actionButton, /class="[^"]*-action[^"]*" data-tone="accent"/);
    assert.match(actionButton, /type="button"/);
    assert.match(actionButton, /command="close"/);
  });
});

test("AlertDialog rich title and description keep the owned a11y wrappers", async () => {
  await withAlertDialog(async (alertDialog) => {
    const html = normalizeSsrHtml(await renderToString(
      createSSRApp({
        render: () => h(
          alertDialog,
          {
            triggerLabel: "Reset",
            title: "Reset settings?",
            description: "Restores defaults.",
            actionLabel: "Reset",
            actionTone: "danger",
          },
          {
            title: ({ title }: { title: string }) => h("strong", title),
            description: ({ description }: { description: string }) => h("em", description),
          },
        ),
      }),
    ));

    assert.match(html, /<h2[^>]*><strong>Reset settings\?<\/strong><\/h2>/);
    assert.match(html, /<p[^>]*><em>Restores defaults\.<\/em><\/p>/);
    assert.match(html, /class="[^"]*-action[^"]*" data-tone="danger"/);
  });
});

test("AlertDialog source delegates modal focus and dismiss behavior to the platform", () => {
  const source = fs.readFileSync(sourcePath, "utf8");

  assert.match(source, /<dialog/);
  assert.doesNotMatch(source, /<form|method="dialog"/);
  assert.match(source, /useAlertDialog\(open\)/);
  assert.doesNotMatch(source, /\b(?:watch|watchEffect|onMounted|onBeforeUnmount|useAttrs|document|window)\b/);
  assert.doesNotMatch(source, /Teleport|focusTrap|data-state/);
  assert.doesNotMatch(source, /var\(--[^,)]+,/);
  assert.doesNotMatch(source, /#[\da-f]{3,8}\b|\brgba?\(|\bhsla?\(/iu);
});
