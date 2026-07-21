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

async function withComponents(
  run: (components: Record<string, Component>) => Promise<void>,
) {
  const server = await createServer({
    configFile: false,
    plugins: [vue()],
    root: path.join(repo, "playground"),
    cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), "nagi-catalog-vite-")),
    logLevel: "silent",
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const components = await server.ssrLoadModule(
      `/@fs${path.join(repo, "packages/core/components.ts")}`,
    );
    await run(components as Record<string, Component>);
  } finally {
    await server.close();
  }
}

function render(component: Component, props: Record<string, unknown> = {}, body?: string) {
  return renderToString(
    createSSRApp({
      render: () => h(component, props, body ? { default: () => h("p", body) } : undefined),
    }),
  );
}

test("components entry exposes every thin behavior Blueprint", async () => {
  await withComponents(async (components) => {
    for (const name of ["Popover", "Dialog", "Tooltip", "Disclosure", "Toast"]) {
      assert.ok(components[name], `${name} is exported from /components`);
    }
  });
});

test("thin package Blueprints emit native relationship attributes during SSR", async () => {
  await withComponents(async (components) => {
    const popover = await render(
      components.Popover as Component,
      { triggerLabel: "Open popover" },
      "Popover body",
    );
    const popoverTarget = popover.match(/popovertarget="([^"]+)"/)?.[1];
    assert.ok(popoverTarget);
    assert.ok(popover.includes(`id="${popoverTarget}"`));
    assert.match(popover, /<div[^>]*\spopover[\s>]/);

    const dialog = await render(
      components.Dialog as Component,
      { triggerLabel: "Open dialog", title: "Confirm" },
      "Dialog body",
    );
    const dialogTarget = dialog.match(/commandfor="([^"]+)"/)?.[1];
    assert.ok(dialogTarget);
    assert.ok(dialog.includes(`<dialog`));
    assert.ok(dialog.includes(`id="${dialogTarget}"`));
    assert.match(dialog, /command="close"/);

    const describedDialog = await render(
      components.Dialog as Component,
      {
        triggerLabel: "Open described dialog",
        title: "Confirm",
        description: "Review this action",
      },
      "Dialog body",
    );
    const descriptionTarget = describedDialog.match(/aria-describedby="([^"]+)"/)?.[1];
    assert.ok(descriptionTarget);
    assert.ok(describedDialog.includes(`id="${descriptionTarget}"`));

    const tooltip = await render(components.Tooltip as Component, {
      triggerLabel: "Help",
      text: "Hint text",
    });
    const describedBy = tooltip.match(/aria-describedby="([^"]+)"/)?.[1];
    assert.ok(describedBy);
    assert.ok(tooltip.includes(`id="${describedBy}"`));
    assert.match(tooltip, /role="tooltip"/);
    assert.match(tooltip, /popover="hint"/);

    const disclosure = await render(
      components.Disclosure as Component,
      { summary: "Question", open: true },
      "Answer",
    );
    assert.match(disclosure, /<details[^>]*\sopen(?:="")?[\s>]/);
    assert.match(disclosure, /<summary[^>]*>Question<\/summary>/);

    const toast = await render(components.Toast as Component, { duration: 0 });
    assert.match(toast, /popover="manual"/);
    assert.match(toast, /aria-live="polite"/);
  });
});

test("styling-only package Blueprints emit semantic, readable markup during SSR", async () => {
  await withComponents(async (components) => {
    const card = await render(
      components.Card as Component,
      { title: "Profile", description: "Owned when needed" },
      "Card body",
    );
    assert.match(card, /<div[^>]*class="card"/);
    assert.match(card, /<div[^>]*class="title"[^>]*>Profile<\/div>/);
    assert.match(card, /Owned when needed/);
    assert.match(card, /Card body/);

    const untitledCard = await render(components.Card as Component, {}, "Untitled card body");
    assert.match(untitledCard, /<div[^>]*class="card"/);
    assert.doesNotMatch(untitledCard, /<header/);
    assert.match(untitledCard, /Untitled card body/);

    const alert = await render(
      components.Alert as Component,
      { title: "Action required", tone: "danger", role: "alert" },
      "Review the change",
    );
    assert.match(alert, /role="alert"/);
    assert.match(alert, /class="alert -danger"/);
    assert.match(alert, /Action required/);

    const badge = await render(components.Badge as Component, {
      label: "Ready",
      tone: "success",
    });
    assert.match(badge, /class="badge -positive"/);
    assert.match(badge, />\s*Ready\s*<\/span>/);
  });
});
