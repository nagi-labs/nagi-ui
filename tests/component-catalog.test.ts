import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import vue from "@vitejs/plugin-vue";
import { createServer } from "vite";
import { createSSRApp, h, type Component } from "vue";
import { renderToString } from "vue/server-renderer";

import { createToastManager } from "../packages/core/src/toast.ts";

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

function renderSlots(
  component: Component,
  props: Record<string, unknown>,
  slots: Readonly<Record<string, string>>,
) {
  return renderToString(
    createSSRApp({
      render: () => h(
        component,
        props,
        Object.fromEntries(
          Object.entries(slots).map(([name, content]) => [name, () => h("span", content)]),
        ),
      ),
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

test("components entry exposes the independent Tabs behavior Blueprint", async () => {
  await withComponents(async (components) => {
    assert.ok(components.Tabs, "Tabs is exported from /components");
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

    const toastManager = createToastManager({ duration: 0 });
    toastManager.add({
      title: "Connection lost",
      description: "Changes are not being saved.",
      tone: "danger",
      priority: "assertive",
      action: { label: "Retry", onClick() {} },
    });
    const toast = await render(components.Toast as Component, { manager: toastManager });
    assert.match(toast, /popover="manual"/);
    assert.match(toast, /role="region"/);
    assert.match(toast, /aria-label="Notifications"/);
    assert.match(toast, /aria-keyshortcuts="F6"/);
    assert.match(toast, /role="alert"/);
    assert.match(toast, /Connection lost/);
    assert.match(toast, /Changes are not being saved/);
    assert.match(toast, />Retry</);
    assert.match(toast, /class="(?:item -danger|-danger item)"/);
  });
});

test("Tabs package Blueprint emits a complete ARIA relationship graph during SSR", async () => {
  await withComponents(async (components) => {
    const tabs = await render(components.Tabs as Component, {
      label: "Project sections",
      items: [
        { key: "overview", label: "Overview", content: "Project summary" },
        { key: "billing", label: "Billing", content: "Invoices", disabled: true },
        { key: "activity", label: "Activity", content: "Recent changes" },
      ],
    });

    assert.match(tabs, /role="tablist"/);
    assert.match(tabs, /aria-label="Project sections"/);
    const selectedTab = tabs.match(
      /<button[^>]*id="([^"]+)"[^>]*role="tab"[^>]*aria-selected="true"[^>]*aria-controls="([^"]+)"/,
    );
    assert.ok(selectedTab);
    const selectedTabId = selectedTab[1] as string;
    const selectedPanelId = selectedTab[2] as string;
    assert.ok(
      tabs.includes(`id="${selectedPanelId}"`) &&
        tabs.includes(`aria-labelledby="${selectedTabId}"`),
    );
    assert.match(tabs, /<button[^>]*disabled[^>]*aria-selected="false"/);
    assert.match(tabs, /<section[^>]*role="tabpanel"[^>]*hidden/);
    assert.match(tabs, /Project summary/);
    assert.match(tabs, /Recent changes/);

    for (const [selected, expected] of [
      [null, "overview"],
      ["missing", "overview"],
      ["billing", "activity"],
    ] as const) {
      const controlled = await render(components.Tabs as Component, {
        label: "Controlled sections",
        selected,
        "onUpdate:selected": () => undefined,
        items: [
          { key: "overview", label: "Overview", content: "Project summary" },
          { key: "billing", label: "Billing", content: "Invoices", disabled: true },
          { key: "activity", label: "Activity", content: "Recent changes" },
        ],
      });
      assert.match(
        controlled,
        new RegExp(`<button[^>]*id="[^"]*-tab-${expected}"[^>]*aria-selected="true"`),
      );
      const activePanelId = controlled.match(
        /<button[^>]*aria-selected="true"[^>]*aria-controls="([^"]+)"/,
      )?.[1];
      assert.ok(activePanelId);
      const activePanelTag = controlled.match(
        new RegExp(`<section[^>]*id="${activePanelId}"[^>]*>`),
      )?.[0];
      assert.ok(activePanelTag);
      assert.match(activePanelTag, /role="tabpanel"/);
      assert.match(activePanelTag, /aria-labelledby="[^"]+"/);
      assert.doesNotMatch(activePanelTag, /\shidden(?:[=\s>])/);
    }
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

    const cardWithFooter = await renderSlots(
      components.Card as Component,
      { title: "Billing" },
      { default: "Plan details", footer: "Manage subscription" },
    );
    assert.match(cardWithFooter, /<div[^>]*class="zone -secondary"/);
    assert.match(cardWithFooter, /Manage subscription/);

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

    const alertWithIcon = await renderSlots(
      components.Alert as Component,
      { title: "Saved" },
      { icon: "Success icon", default: "The record is current" },
    );
    assert.match(alertWithIcon, /class="icon"/);
    assert.match(alertWithIcon, /Success icon/);

    const smallButton = await render(components.Button as Component, { size: "small" }, "Small");
    const defaultButton = await render(components.Button as Component, {}, "Default");
    const largeButton = await render(components.Button as Component, { size: "large" }, "Large");
    assert.match(smallButton, /class="nagi-button -compact"/);
    assert.match(defaultButton, /class="nagi-button"/);
    assert.match(largeButton, /class="nagi-button -large"/);

    const badge = await render(components.Badge as Component, {
      label: "Ready",
      tone: "success",
    });
    assert.match(badge, /class="badge -positive"/);
    assert.match(badge, />\s*Ready\s*<\/span>/);
  });
});
