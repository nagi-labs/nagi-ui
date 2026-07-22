import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import vue from "@vitejs/plugin-vue";
import { createServer } from "vite";
import { createSSRApp, h, type Component, type VNodeChild } from "vue";
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

function renderSlotFunctions(
  component: Component,
  props: Record<string, unknown>,
  slots: Readonly<Record<string, (props: Record<string, unknown>) => VNodeChild>>,
) {
  return renderToString(
    createSSRApp({
      render: () => h(component, props, slots),
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

test("components entry exposes Avatar, Separator, and Toggle", async () => {
  await withComponents(async (components) => {
    for (const name of ["Avatar", "Separator", "Toggle"]) {
      assert.ok(components[name], `${name} is exported from /components`);
    }
  });
});

test("components entry exposes Accordion and AlertDialog", async () => {
  await withComponents(async (components) => {
    for (const name of ["Accordion", "AlertDialog"]) {
      assert.ok(components[name], `${name} is exported from /components`);
    }
  });
});

test("Accordion and AlertDialog preserve their native SSR contracts", async () => {
  await withComponents(async (components) => {
    const accordion = await renderSlotFunctions(
      components.Accordion as Component,
      {
        items: [
          { key: "shipping", summary: "Shipping", content: "Two days" },
          { key: "returns", summary: "Returns", content: "Thirty days" },
        ],
        openKeys: ["shipping"],
      },
      {
        summary: (slotProps) => h("strong", String(slotProps.summary)),
        panel: (slotProps) => h("p", String(
          (slotProps.item as { content: string }).content,
        )),
      },
    );
    const names = [...accordion.matchAll(/<details[^>]* name="([^"]+)"/g)]
      .map((match) => match[1]);
    assert.deepEqual(names.length, 2);
    assert.equal(new Set(names).size, 1);
    assert.equal(accordion.match(/<details[^>]* open(?:="")?/g)?.length, 1);
    assert.match(accordion, /<strong>Shipping<\/strong>/);
    assert.match(accordion, /<section[^>]*class="section"[^>]*>.*<p>Two days<\/p>/);

    const alertDialog = await renderSlots(
      components.AlertDialog as Component,
      {
        triggerLabel: "Delete package",
        title: "Delete this package?",
        description: "This cannot be undone.",
        actionLabel: "Delete package",
        actionTone: "danger",
      },
      {
        title: "Delete this package?",
        description: "This cannot be undone.",
      },
    );
    const dialogTag = alertDialog.match(/<dialog[^>]*>/)?.[0] ?? "";
    assert.match(dialogTag, /role="alertdialog"/);
    assert.match(dialogTag, /closedby="closerequest"/);
    const labelledBy = dialogTag.match(/aria-labelledby="([^"]+)"/)?.[1];
    const describedBy = dialogTag.match(/aria-describedby="([^"]+)"/)?.[1];
    assert.ok(labelledBy && alertDialog.includes(`id="${labelledBy}"`));
    assert.ok(describedBy && alertDialog.includes(`id="${describedBy}"`));
    assert.doesNotMatch(alertDialog, /<form/);
    assert.equal(alertDialog.match(/command="close"/g)?.length, 2);
  });
});

test("small native primitives preserve their semantics during SSR", async () => {
  await withComponents(async (components) => {
    const avatar = await render(components.Avatar as Component, {
      src: "/ada.jpg",
      alt: "Ada Lovelace",
    });
    assert.match(avatar, /class="n-avatar"[^>]*role="img"/);
    assert.match(avatar, /aria-label="Ada Lovelace"/);
    assert.match(avatar, /<img[^>]*src="\/ada.jpg"[^>]*alt=""/);

    const separator = await render(components.Separator as Component);
    assert.match(separator, /<hr[^>]*class="n-separator"/);

    const verticalSeparator = await render(components.Separator as Component, {
      orientation: "vertical",
    });
    assert.match(verticalSeparator, /role="separator"/);
    assert.match(verticalSeparator, /aria-orientation="vertical"/);

    const decorativeSeparator = await render(components.Separator as Component, {
      decorative: true,
    });
    assert.match(decorativeSeparator, /aria-hidden="true"/);
    assert.doesNotMatch(decorativeSeparator, /role="separator"/);

    const toggle = await render(components.Toggle as Component, { modelValue: true }, "Pinned");
    assert.match(toggle, /<button[^>]*type="button"/);
    assert.match(toggle, /aria-pressed="true"/);
    assert.match(toggle, />Pinned</);
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
      autocomplete: "email",
      inputmode: "email",
      "aria-describedby": "email-help",
      class: "consumer-control",
    });
    const nativeInput = input.match(/<input[^>]*>/)?.[0] ?? "";
    assert.match(input, /<label[^>]*class="n-input"/);
    assert.doesNotMatch(input, /<label[^>]*consumer-control/);
    assert.match(input, /<input[^>]*type="email"/);
    assert.match(nativeInput, /autocomplete="email"/);
    assert.match(nativeInput, /inputmode="email"/);
    assert.match(nativeInput, /aria-describedby="email-help"/);
    assert.match(nativeInput, /class="[^"]*consumer-control/);
    assert.match(input, /name="email"/);
    assert.match(input, /form="profile"/);
    assert.match(input, /required/);

    const checkbox = await render(components.Checkbox as Component, {
      label: "Updates",
      modelValue: true,
      name: "updates",
      value: "yes",
      form: "profile",
      "aria-describedby": "updates-help",
      class: "consumer-checkbox",
    });
    const nativeCheckbox = checkbox.match(/<input[^>]*>/)?.[0] ?? "";
    assert.doesNotMatch(checkbox, /<label[^>]*consumer-checkbox/);
    assert.match(checkbox, /<input[^>]*type="checkbox"/);
    assert.match(checkbox, /checked/);
    assert.match(checkbox, /value="yes"/);
    assert.match(nativeCheckbox, /aria-describedby="updates-help"/);
    assert.match(nativeCheckbox, /class="[^"]*consumer-checkbox/);

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
      "aria-describedby": "public-help",
      class: "consumer-switch",
    });
    const nativeSwitch = toggle.match(/<input[^>]*>/)?.[0] ?? "";
    assert.doesNotMatch(toggle, /<label[^>]*consumer-switch/);
    assert.match(toggle, /role="switch"/);
    assert.match(toggle, /checked/);
    assert.match(nativeSwitch, /aria-describedby="public-help"/);
    assert.match(nativeSwitch, /class="[^"]*consumer-switch/);

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
      "aria-describedby": "volume-help",
      class: "consumer-slider",
    });
    const nativeSlider = slider.match(/<input[^>]*type="range"[^>]*>/)?.[0] ?? "";
    assert.doesNotMatch(slider, /<div[^>]*n-slider[^>]*consumer-slider/);
    assert.match(slider, /<input[^>]*type="range"/);
    assert.match(slider, /name="volume"/);
    assert.match(slider, /form="profile"/);
    assert.match(nativeSlider, /aria-describedby="volume-help"/);
    assert.match(nativeSlider, /class="[^"]*consumer-slider/);

    const combobox = await render(components.Combobox as Component, {
      label: "Framework",
      items: [{ key: "vue", label: "Vue" }],
      inputmode: "search",
      "aria-describedby": "framework-help",
      class: "consumer-combobox",
    });
    const nativeCombobox = combobox.match(/<input[^>]*type="text"[^>]*>/)?.[0] ?? "";
    assert.doesNotMatch(combobox, /<div[^>]*n-combobox[^>]*consumer-combobox/);
    assert.match(nativeCombobox, /inputmode="search"/);
    assert.match(nativeCombobox, /aria-describedby="framework-help"/);
    assert.match(nativeCombobox, /class="[^"]*consumer-combobox/);
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

    const richDialog = await renderSlotFunctions(
      components.Dialog as Component,
      {
        triggerLabel: "Open rich dialog",
        title: "Confirm",
        description: "Review this action",
      },
      {
        title: (slotProps) => h("span", `${String(slotProps.title)} now`),
        description: (slotProps) => h("strong", String(slotProps.description)),
      },
    );
    assert.match(richDialog, /<h2[^>]*class="title"/);
    assert.match(richDialog, /<span>Confirm now<\/span>/);
    assert.match(richDialog, /<p[^>]*class="text"/);
    assert.match(richDialog, /<strong>Review this action<\/strong>/);
    const richDescriptionTarget = richDialog.match(/aria-describedby="([^"]+)"/)?.[1];
    assert.ok(richDescriptionTarget);
    assert.ok(richDialog.includes(`id="${richDescriptionTarget}"`));

    const slotOnlyDialogDescription = await renderSlots(
      components.Dialog as Component,
      { triggerLabel: "Open slot description", title: "Confirm" },
      { description: "Slot-only description" },
    );
    const slotOnlyDescriptionTarget = slotOnlyDialogDescription.match(
      /aria-describedby="([^"]+)"/,
    )?.[1];
    assert.ok(slotOnlyDescriptionTarget);
    assert.ok(slotOnlyDialogDescription.includes(`id="${slotOnlyDescriptionTarget}"`));
    assert.match(slotOnlyDialogDescription, /Slot-only description/);

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
    assert.match(disclosure, /<summary[^>]*class="summary"/);
    assert.match(disclosure, /Question/);

    const richDisclosure = await renderSlotFunctions(
      components.Disclosure as Component,
      { summary: "Question", open: true },
      { summary: (slotProps) => h("span", `${String(slotProps.summary)} with icon`) },
    );
    assert.match(richDisclosure, /<summary[^>]*class="summary"/);
    assert.match(richDisclosure, /<span>Question with icon<\/span>/);

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
    assert.match(card, /<div[^>]*class="n-card"/);
    assert.match(card, /<div[^>]*class="title"/);
    assert.match(card, /Profile/);
    assert.match(card, /Owned when needed/);
    assert.match(card, /Card body/);

    const cardWithFooter = await renderSlots(
      components.Card as Component,
      { title: "Billing" },
      { default: "Plan details", footer: "Manage subscription" },
    );
    assert.match(cardWithFooter, /<div[^>]*class="unit -secondary"/);
    assert.match(cardWithFooter, /Manage subscription/);

    const cardWithRichHeader = await renderSlotFunctions(
      components.Card as Component,
      { title: "Base title", description: "Base description" },
      {
        title: (slotProps) => h("span", `Rich ${String(slotProps.title)}`),
        description: (slotProps) => h("span", `Rich ${String(slotProps.description)}`),
      },
    );
    assert.match(cardWithRichHeader, /<div[^>]*class="title"/);
    assert.match(cardWithRichHeader, /<span>Rich Base title<\/span>/);
    assert.match(cardWithRichHeader, /<div[^>]*class="text"/);
    assert.match(cardWithRichHeader, /<span>Rich Base description<\/span>/);

    const cardWithSlotOnlyHeader = await renderSlots(
      components.Card as Component,
      {},
      { title: "Slot-only title", description: "Slot-only description" },
    );
    assert.match(cardWithSlotOnlyHeader, /<header/);
    assert.match(cardWithSlotOnlyHeader, /Slot-only title/);
    assert.match(cardWithSlotOnlyHeader, /Slot-only description/);

    const untitledCard = await render(components.Card as Component, {}, "Untitled card body");
    assert.match(untitledCard, /<div[^>]*class="n-card"/);
    assert.doesNotMatch(untitledCard, /<header/);
    assert.match(untitledCard, /Untitled card body/);

    const alert = await render(
      components.Alert as Component,
      { title: "Action required", tone: "danger", role: "alert" },
      "Review the change",
    );
    assert.match(alert, /role="alert"/);
    assert.match(alert, /class="n-alert -danger"/);
    assert.match(alert, /Action required/);

    const alertWithIcon = await renderSlots(
      components.Alert as Component,
      { title: "Saved" },
      { icon: "Success icon", default: "The record is current" },
    );
    assert.match(alertWithIcon, /class="icon"/);
    assert.match(alertWithIcon, /Success icon/);

    const alertWithRichTitle = await renderSlotFunctions(
      components.Alert as Component,
      { title: "Saved" },
      { title: (slotProps) => h("span", `${String(slotProps.title)} status`) },
    );
    assert.match(alertWithRichTitle, /<h2[^>]*class="title"[^>]*>/);
    assert.match(alertWithRichTitle, /<span>Saved status<\/span>/);

    const smallButton = await render(components.Button as Component, { size: "small" }, "Small");
    const defaultButton = await render(components.Button as Component, {}, "Default");
    const largeButton = await render(components.Button as Component, { size: "large" }, "Large");
    assert.match(smallButton, /class="n-button -compact"/);
    assert.match(defaultButton, /class="n-button"/);
    assert.match(largeButton, /class="n-button -large"/);

    const badge = await render(components.Badge as Component, {
      label: "Ready",
      tone: "success",
    });
    assert.match(badge, /class="n-badge -positive"/);
    assert.match(badge, /Ready/);

    const badgeWithRichLabel = await renderSlotFunctions(
      components.Badge as Component,
      { label: "Ready", tone: "success" },
      { label: (slotProps) => h("span", `Icon ${String(slotProps.label)}`) },
    );
    assert.match(badgeWithRichLabel, /class="n-badge -positive"/);
    assert.match(badgeWithRichLabel, /<span>Icon Ready<\/span>/);
  });
});
