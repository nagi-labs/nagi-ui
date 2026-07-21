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

test("components entry exposes every native form and indicator Blueprint", async () => {
  await withComponents(async (components) => {
    for (const name of [
      "Input",
      "Checkbox",
      "Radio",
      "Switch",
      "Select",
      "Fieldset",
      "Progress",
      "Meter",
      "Slider",
    ]) {
      assert.ok(components[name], `${name} is exported from /components`);
    }
  });
});

test("native form and indicator Blueprints preserve platform markup during SSR", async () => {
  await withComponents(async (components) => {
    const input = await render(components.Input as Component, {
      label: "Email",
      modelValue: "dev@example.com",
      type: "email",
      name: "email",
      form: "profile",
      required: true,
    });
    assert.match(input, /<input[^>]*type="email"/);
    assert.match(input, /name="email"/);
    assert.match(input, /form="profile"/);
    assert.match(input, /required/);

    const checkbox = await render(components.Checkbox as Component, {
      label: "Updates",
      modelValue: true,
      name: "updates",
      value: "yes",
      form: "profile",
    });
    assert.match(checkbox, /<input[^>]*type="checkbox"/);
    assert.match(checkbox, /checked/);
    assert.match(checkbox, /value="yes"/);

    const radio = await render(components.Radio as Component, {
      label: "Email",
      modelValue: "email",
      value: "email",
      name: "channel",
      form: "profile",
    });
    assert.match(radio, /<input[^>]*type="radio"/);
    assert.match(radio, /checked/);

    const toggle = await render(components.Switch as Component, {
      label: "Public",
      modelValue: true,
      name: "public",
      form: "profile",
    });
    assert.match(toggle, /role="switch"/);
    assert.match(toggle, /checked/);

    const select = await render(components.Select as Component, {
      label: "Framework",
      modelValue: "vue",
      name: "framework",
      form: "profile",
      options: [
        { label: "Vue", value: "vue" },
        { label: "React", value: "react", disabled: true },
      ],
    });
    assert.match(select, /<select[^>]*name="framework"/);
    assert.match(select, /<option[^>]*value="vue"[^>]*selected/);
    assert.match(select, /<option[^>]*value="react"[^>]*disabled/);

    const fieldset = await render(
      components.Fieldset as Component,
      { legend: "Contact", disabled: true },
      "Fields",
    );
    assert.match(fieldset, /<fieldset[^>]*disabled/);
    assert.match(fieldset, /<legend[^>]*>Contact<\/legend>/);

    const indeterminateProgress = await render(components.Progress as Component, {
      label: "Uploading",
      max: 100,
    });
    assert.match(indeterminateProgress, /<progress/);
    assert.doesNotMatch(indeterminateProgress, /<progress[^>]*\svalue=/);

    const meter = await render(components.Meter as Component, {
      label: "Storage",
      value: 72,
      min: 0,
      max: 100,
      low: 20,
      high: 80,
      optimum: 40,
    });
    assert.match(meter, /<meter[^>]*value="72"/);
    assert.match(meter, /low="20"/);
    assert.match(meter, /high="80"/);

    const slider = await render(components.Slider as Component, {
      label: "Volume",
      modelValue: 40,
      name: "volume",
      form: "profile",
      min: 0,
      max: 100,
    });
    assert.match(slider, /<input[^>]*type="range"/);
    assert.match(slider, /name="volume"/);
    assert.match(slider, /form="profile"/);
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
