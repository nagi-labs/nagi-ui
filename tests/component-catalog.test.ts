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

test("compound Blueprints do not fall through unknown attributes", () => {
  for (const blueprint of [
    "menu/ActionMenu.vue",
    "menu/DropdownMenu.vue",
    "menu/DropdownMenuItem.vue",
    "menu/DropdownSubmenu.vue",
    "context-menu/ContextMenu.vue",
    "dialog/Dialog.vue",
    "alert-dialog/AlertDialog.vue",
    "listbox/Listbox.vue",
    "menubar/Menubar.vue",
    "navigation-menu/NavigationMenu.vue",
    "popover/Popover.vue",
    "toolbar/Toolbar.vue",
    "tooltip/Tooltip.vue",
    "tree/Tree.vue",
    "tree/TreeBranch.vue",
    "autocomplete/Autocomplete.vue",
    "combobox/Combobox.vue",
    "date-field/DateField.vue",
    "multi-select/MultiSelect.vue",
    "otp-field/OTPField.vue",
    "preview-card/PreviewCard.vue",
    "tags-input/TagsInput.vue",
    "time-field/TimeField.vue",
  ]) {
    const source = fs.readFileSync(path.join(repo, "packages/core/blueprints", blueprint), "utf8");
    assert.match(source, /inheritAttrs:\s*false/u, blueprint);
    assert.doesNotMatch(source, /\$attrs|mergeElementProps/u, blueprint);
  }
});

async function withComponents(
  run: (components: Record<string, Component>) => Promise<void>,
) {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nagi-catalog-vite-"));
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
    const components = await server.ssrLoadModule(
      `/@fs${path.join(repo, "packages/core/components.ts")}`,
    );
    await run(components as Record<string, Component>);
  } finally {
    await server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
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
      assert.ok(components[`N${name}`], `N${name} is exported from /components`);
    }
  });
});

test("components entry exposes the independent Tabs behavior Blueprint", async () => {
  await withComponents(async (components) => {
    assert.ok(components.NTabs, "Tabs is exported from /components");
  });
});

test("components entry exposes Avatar, Separator, and Toggle", async () => {
  await withComponents(async (components) => {
    for (const name of ["Avatar", "Separator", "Toggle"]) {
      assert.ok(components[`N${name}`], `N${name} is exported from /components`);
    }
  });
});

test("components entry exposes Accordion and AlertDialog", async () => {
  await withComponents(async (components) => {
    for (const name of ["Accordion", "AlertDialog"]) {
      assert.ok(components[`N${name}`], `N${name} is exported from /components`);
    }
  });
});

test("components entry exposes the complete date and time family", async () => {
  await withComponents(async (components) => {
    for (const name of [
      "Calendar",
      "RangeCalendar",
      "DateField",
      "DatePicker",
      "DateRangePicker",
      "TimeField",
    ]) {
      assert.ok(components[`N${name}`], `N${name} is exported from /components`);
    }

    const calendar = await render(components.NCalendar as Component, {
      label: "Arrival calendar",
      locale: "en-US",
      timeZone: "UTC",
      modelValue: "2026-07-23",
      name: "arrival",
    });
    assert.match(calendar, /<table[^>]*role="grid"[^>]*aria-label="Arrival calendar"/u);
    assert.equal(calendar.match(/role="gridcell"/gu)?.length, 42);
    assert.match(calendar, /<input[^>]*type="date"[^>]*name="arrival"[^>]*value="2026-07-23"/u);

    const picker = await render(components.NDatePicker as Component, {
      label: "Arrival",
      locale: "en-US",
      timeZone: "UTC",
      modelValue: "2026-07-23",
    });
    const popup = picker.match(/popovertarget="([^"]+)"/u)?.[1];
    assert.ok(popup);
    assert.ok(picker.includes(`id="${popup}"`));
    assert.match(picker, /popover[^>]*role="dialog"|role="dialog"[^>]*popover/u);

    const range = await render(components.NDateRangePicker as Component, {
      label: "Stay",
      locale: "en-US",
      timeZone: "UTC",
      modelValue: { start: "2026-07-23", end: "2026-07-25" },
    });
    assert.match(range, /<div[^>]*class="dialog"[^>]*role="dialog"[^>]*popover|<div[^>]*class="dialog"[^>]*popover[^>]*role="dialog"/u);
    assert.equal(range.match(/role="spinbutton"/gu)?.length, 6);
    assert.equal(range.match(/aria-selected="true"/gu)?.length, 3);

    const time = await render(components.NTimeField as Component, {
      label: "Start time",
      modelValue: "13:45",
      name: "starts",
    });
    assert.match(time, /<input[^>]*type="time"[^>]*name="starts"[^>]*value="13:45"/u);
  });
});

test("components entry exposes the expanded thin catalog slice", async () => {
  await withComponents(async (components) => {
    for (const name of [
      "Breadcrumb",
      "ButtonGroup",
      "EmptyState",
      "Kbd",
      "Skeleton",
      "Spinner",
      "Textarea",
    ]) {
      assert.ok(components[`N${name}`], `N${name} is exported from /components`);
    }

    const breadcrumb = await render(components.NBreadcrumb as Component, {
      label: "Project path",
      items: [
        { key: "home", label: "Home", href: "/" },
        { key: "project", label: "Project" },
      ],
    });
    assert.match(breadcrumb, /<nav[^>]*aria-label="Project path"/);
    assert.match(breadcrumb, /<ol[^>]*class="list"/);
    assert.match(breadcrumb, /<a[^>]*href="\/"/);
    assert.match(breadcrumb, /aria-current="page"[^>]*>Project/);

    const buttonGroup = await render(
      components.NButtonGroup as Component,
      { label: "Editor actions" },
      "Action",
    );
    assert.match(buttonGroup, /role="group"/);
    assert.match(buttonGroup, /aria-label="Editor actions"/);

    const emptyState = await render(
      components.NEmptyState as Component,
      { title: "No projects", description: "Create one to begin." },
      "Create project",
    );
    assert.match(emptyState, /No projects/);
    assert.match(emptyState, /Create one to begin\./);
    assert.match(emptyState, /Create project/);

    const kbd = await render(components.NKbd as Component, { label: "K" });
    assert.match(kbd, /<kbd[^>]*>K<\/kbd>/);

    const skeleton = await render(components.NSkeleton as Component);
    assert.match(skeleton, /aria-hidden="true"/);

    const spinner = await render(components.NSpinner as Component, { label: "Loading" });
    assert.match(spinner, /role="status"/);
    assert.match(spinner, /aria-label="Loading"/);

    const textarea = await render(components.NTextarea as Component, {
      label: "Notes",
      modelValue: "Initial",
      name: "notes",
      rows: 4,
      placeholder: "Describe the release",
    });
    assert.match(textarea, /<label[^>]*class="n-textarea"/);
    assert.match(textarea, /<textarea[^>]*name="notes"/);
    assert.match(textarea, /rows="4"/);
    assert.match(textarea, /placeholder="Describe the release"/);
    assert.match(textarea, />Initial<\/textarea>/);
  });
});

test("components entry exposes native Table", async () => {
  await withComponents(async (components) => {
    assert.ok(components.NTable, "Table is exported from /components");
    const rendered = await renderSlotFunctions(
      components.NTable as Component,
      {
        caption: "Package users",
        columns: [
          { key: "name", label: "Name", rowHeader: true },
          { key: "status", label: "Status" },
        ],
        rows: [{ name: "Ada", status: "active" }],
      },
      {
        "cell-status": ({ value }) => h("strong", String(value)),
      },
    );
    const html = rendered.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--\[-->|<!--\]-->/gu, "");
    assert.match(html, /<table[^>]*>/u);
    assert.match(html, /<caption[^>]*>Package users<\/caption>/u);
    assert.match(html, /<th[^>]*scope="row"[^>]*>Ada<\/th>/u);
    assert.match(html, /<td[^>]*><strong>active<\/strong><\/td>/u);
  });
});

test("components entry exposes the small interactive catalog slice", async () => {
  await withComponents(async (components) => {
    for (const name of ["FileInput", "Pagination", "Rating"]) {
      assert.ok(components[`N${name}`], `N${name} is exported from /components`);
    }

    const pagination = await render(components.NPagination as Component, {
      label: "Result pages",
      currentKey: "2",
      items: [
        { key: "1", label: "1", href: "/results?page=1" },
        { key: "2", label: "2" },
      ],
    });
    assert.match(pagination, /<nav[^>]*aria-label="Result pages"/);
    assert.match(pagination, /<a[^>]*href="\/results\?page=1"/);
    assert.match(pagination, /<button[^>]*aria-current="page"[^>]*>2/);

    const rating = await render(components.NRating as Component, {
      label: "Quality",
      name: "quality",
      modelValue: 2,
      items: [
        { value: 1, label: "Poor" },
        { value: 2, label: "Good" },
      ],
    });
    assert.match(rating, /<fieldset[^>]*class="n-rating"/);
    assert.match(rating, /<legend[^>]*>Quality<\/legend>/);
    assert.equal(rating.match(/type="radio"/g)?.length, 2);
    const selectedRating = rating.match(/<input[^>]*checked[^>]*>/)?.[0] ?? "";
    assert.match(selectedRating, /value="2"/);

    const fileInput = await render(components.NFileInput as Component, {
      label: "Attachment",
      name: "attachment",
      accept: ".txt",
      multiple: true,
      capture: "environment",
    });
    assert.match(fileInput, /<label[^>]*class="n-file-input"/);
    assert.match(fileInput, /<input[^>]*type="file"/);
    assert.match(fileInput, /name="attachment"/);
    assert.match(fileInput, /accept="\.txt"/);
    assert.match(fileInput, /multiple/);
    assert.match(fileInput, /capture="environment"/);
  });
});

test("components entry exposes the first anatomy-sensitive catalog slice", async () => {
  await withComponents(async (components) => {
    for (const name of ["InputGroup", "NumberField", "ToggleGroup"]) {
      assert.ok(components[`N${name}`], `N${name} is exported from /components`);
    }

    const inputGroup = await renderSlotFunctions(
      components.NInputGroup as Component,
      { prefix: "https://", suffix: ".dev" },
      {
        default: () => h("input", {
          class: "n-input-group-control",
          name: "project",
          "aria-label": "Project URL",
        }),
        action: () => h("button", {
          class: "n-input-group-action",
          type: "button",
        }, "Open"),
      },
    );
    assert.match(inputGroup, /class="n-input-group"/);
    assert.match(inputGroup, />https:\/\//);
    assert.match(inputGroup, /class="n-input-group-control"/);
    assert.match(inputGroup, /class="n-input-group-action"/);

    const numberField = await render(components.NNumberField as Component, {
      label: "Seats",
      modelValue: 2,
      min: 0,
      max: 8,
      name: "seats",
    });
    assert.match(numberField, /<label[^>]*>Seats<\/label>/);
    assert.match(numberField, /<input[^>]*type="number"/);
    assert.match(numberField, /<input[^>]*value="2"/);
    assert.equal(numberField.match(/<button/gu)?.length, 2);

    const toggleGroup = await render(components.NToggleGroup as Component, {
      label: "Alignment",
      modelValue: "center",
      items: [
        { key: "left", label: "Left" },
        { key: "center", label: "Center" },
      ],
    });
    assert.match(toggleGroup, /role="group"[^>]*aria-label="Alignment"/);
    assert.match(toggleGroup, /aria-pressed="true"[^>]*>Center<\/button>/);
  });
});

test("components entry exposes RangeSlider as one native two-thumb range", async () => {
  await withComponents(async (components) => {
    assert.ok(components.NRangeSlider, "RangeSlider is exported from /components");
    const range = await render(components.NRangeSlider as Component, {
      label: "Price range",
      lowerLabel: "Minimum price",
      upperLabel: "Maximum price",
      lowerName: "priceMin",
      upperName: "priceMax",
      min: 0,
      max: 100,
      step: 5,
      modelValue: [25, 75],
    });
    assert.match(range, /<fieldset[^>]*class="n-range-slider"/);
    assert.match(range, /<legend[^>]*>Price range<\/legend>/);
    assert.equal(range.match(/<input[^>]*type="range"/gu)?.length, 2);
    assert.match(range, /<input[^>]*name="priceMin"[^>]*max="75"/);
    assert.match(range, /<input[^>]*name="priceMax"[^>]*min="25"/);
  });
});

test("components entry exposes PreviewCard as a real link with an interactive preview", async () => {
  await withComponents(async (components) => {
    assert.ok(components.NPreviewCard, "PreviewCard is exported from /components");
    const preview = await renderSlotFunctions(
      components.NPreviewCard as Component,
      {
        href: "/packages/nagi-ui",
        label: "Nagi UI package",
        title: "@nagi-labs/nagi-ui",
        description: "Native-first Vue components.",
      },
      {
        default: () => h("a", {
          class: "n-preview-card-content",
          href: "/packages/nagi-ui/compatibility",
        }, "Compatibility notes"),
      },
    );
    assert.match(preview, /<a[^>]*class="link"[^>]*href="\/packages\/nagi-ui"/);
    assert.match(preview, /<span[^>]*class="unit"[^>]*popover/);
    assert.match(preview, /href="\/packages\/nagi-ui\/compatibility"/);
    assert.doesNotMatch(preview, /role="tooltip"|aria-describedby/);
  });
});

test("components entry exposes Stepper as flat native navigation", async () => {
  await withComponents(async (components) => {
    assert.ok(components.NStepper, "Stepper is exported from /components");
    const stepper = await render(components.NStepper as Component, {
      label: "Package setup",
      currentKey: "access",
      items: [
        { key: "details", label: "Details", description: "Package identity" },
        { key: "access", label: "Access", description: "Visibility and roles" },
        { key: "publish", label: "Publish", disabled: true },
      ],
    });
    assert.match(stepper, /<nav[^>]*aria-label="Package setup"/);
    assert.match(stepper, /<ol[^>]*class="list"/);
    assert.equal(stepper.match(/<button/gu)?.length, 3);
    assert.match(stepper, /aria-current="step"[^>]*>.*Access/s);
    assert.match(stepper, /<button[^>]*disabled[^>]*>.*Publish/s);
  });
});

test("Accordion and AlertDialog preserve their native SSR contracts", async () => {
  await withComponents(async (components) => {
    const accordion = await renderSlotFunctions(
      components.NAccordion as Component,
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
      components.NAlertDialog as Component,
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
    const avatar = await render(components.NAvatar as Component, {
      src: "/ada.jpg",
      alt: "Ada Lovelace",
    });
    assert.match(avatar, /class="n-avatar"[^>]*role="img"/);
    assert.match(avatar, /aria-label="Ada Lovelace"/);
    assert.match(avatar, /<img[^>]*src="\/ada.jpg"[^>]*alt=""/);

    const separator = await render(components.NSeparator as Component);
    assert.match(separator, /<hr[^>]*class="n-separator"/);

    const verticalSeparator = await render(components.NSeparator as Component, {
      orientation: "vertical",
    });
    assert.match(verticalSeparator, /role="separator"/);
    assert.match(verticalSeparator, /aria-orientation="vertical"/);

    const decorativeSeparator = await render(components.NSeparator as Component, {
      decorative: true,
    });
    assert.match(decorativeSeparator, /aria-hidden="true"/);
    assert.doesNotMatch(decorativeSeparator, /role="separator"/);

    const toggle = await render(components.NToggle as Component, { modelValue: true }, "Pinned");
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
      assert.ok(components[`N${name}`], `N${name} is exported from /components`);
    }
  });
});

test("native form and indicator Blueprints preserve platform markup during SSR", async () => {
  await withComponents(async (components) => {
    const input = await render(components.NInput as Component, {
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

    const checkbox = await render(components.NCheckbox as Component, {
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

    const radio = await render(components.NRadio as Component, {
      label: "Email",
      modelValue: "email",
      value: "email",
      name: "channel",
      form: "profile",
    });
    assert.match(radio, /<input[^>]*type="radio"/);
    assert.match(radio, /checked/);

    const toggle = await render(components.NSwitch as Component, {
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

    const select = await render(components.NSelect as Component, {
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
      components.NFieldset as Component,
      { legend: "Contact", disabled: true },
      "Fields",
    );
    assert.match(fieldset, /<fieldset[^>]*disabled/);
    assert.match(fieldset, /<legend[^>]*>Contact<\/legend>/);

    const indeterminateProgress = await render(components.NProgress as Component, {
      label: "Uploading",
      max: 100,
    });
    assert.match(indeterminateProgress, /<progress/);
    assert.doesNotMatch(indeterminateProgress, /<progress[^>]*\svalue=/);

    const meter = await render(components.NMeter as Component, {
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

    const slider = await render(components.NSlider as Component, {
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

    const combobox = await render(components.NCombobox as Component, {
      label: "Framework",
      items: [{ key: "vue", label: "Vue" }],
      inputmode: "search",
      ariaDescribedby: "framework-help",
      class: "consumer-combobox",
      "data-unexpected": "must-not-leak",
    });
    const nativeCombobox = combobox.match(/<input[^>]*type="text"[^>]*>/)?.[0] ?? "";
    assert.match(combobox, /<div[^>]*n-combobox[^>]*consumer-combobox/);
    assert.match(nativeCombobox, /inputmode="search"/);
    assert.match(nativeCombobox, /aria-describedby="framework-help"/);
    assert.doesNotMatch(nativeCombobox, /consumer-combobox/);
    assert.doesNotMatch(combobox, /must-not-leak/);
  });
});

test("thin package Blueprints emit native relationship attributes during SSR", async () => {
  await withComponents(async (components) => {
    const popover = await render(
      components.NPopover as Component,
      { triggerLabel: "Open popover" },
      "Popover body",
    );
    const popoverTarget = popover.match(/popovertarget="([^"]+)"/)?.[1];
    assert.ok(popoverTarget);
    assert.ok(popover.includes(`id="${popoverTarget}"`));
    assert.match(popover, /<div[^>]*\spopover[\s>]/);

    const dialog = await render(
      components.NDialog as Component,
      { triggerLabel: "Open dialog", title: "Confirm" },
      "Dialog body",
    );
    const dialogTarget = dialog.match(/commandfor="([^"]+)"/)?.[1];
    assert.ok(dialogTarget);
    assert.ok(dialog.includes(`<dialog`));
    assert.ok(dialog.includes(`id="${dialogTarget}"`));
    assert.match(dialog, /command="close"/);

    const explicitlyIdentifiedDialog = await render(
      components.NDialog as Component,
      { id: "account-dialog", triggerLabel: "Open account dialog", title: "Account" },
      "Account body",
    );
    assert.equal(explicitlyIdentifiedDialog.match(/id="account-dialog"/g)?.length, 1);
    assert.match(explicitlyIdentifiedDialog, /<div[^>]*id="account-dialog"/);
    assert.doesNotMatch(explicitlyIdentifiedDialog, /<dialog[^>]*id="account-dialog"/);

    const describedDialog = await render(
      components.NDialog as Component,
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
      components.NDialog as Component,
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
      components.NDialog as Component,
      { triggerLabel: "Open slot description", title: "Confirm" },
      { description: "Slot-only description" },
    );
    const slotOnlyDescriptionTarget = slotOnlyDialogDescription.match(
      /aria-describedby="([^"]+)"/,
    )?.[1];
    assert.ok(slotOnlyDescriptionTarget);
    assert.ok(slotOnlyDialogDescription.includes(`id="${slotOnlyDescriptionTarget}"`));
    assert.match(slotOnlyDialogDescription, /Slot-only description/);

    const tooltip = await render(components.NTooltip as Component, {
      triggerLabel: "Help",
      text: "Hint text",
    });
    const describedBy = tooltip.match(/aria-describedby="([^"]+)"/)?.[1];
    assert.ok(describedBy);
    assert.ok(tooltip.includes(`id="${describedBy}"`));
    assert.match(tooltip, /role="tooltip"/);
    assert.match(tooltip, /popover="hint"/);

    const disclosure = await render(
      components.NDisclosure as Component,
      { summary: "Question", open: true },
      "Answer",
    );
    assert.match(disclosure, /<details[^>]*\sopen(?:="")?[\s>]/);
    assert.match(disclosure, /<summary[^>]*class="summary"/);
    assert.match(disclosure, /Question/);

    const richDisclosure = await renderSlotFunctions(
      components.NDisclosure as Component,
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
    const toast = await render(components.NToast as Component, { manager: toastManager });
    assert.match(toast, /popover="manual"/);
    assert.match(toast, /role="region"/);
    assert.match(toast, /aria-label="Notifications"/);
    assert.match(toast, /aria-keyshortcuts="F6"/);
    assert.match(toast, /role="alert"/);
    assert.match(toast, /Connection lost/);
    assert.match(toast, /Changes are not being saved/);
    assert.match(toast, />Retry</);
    assert.match(toast, /class="item" data-tone="danger"/);
  });
});

test("Tabs package Blueprint emits a complete ARIA relationship graph during SSR", async () => {
  await withComponents(async (components) => {
    const tabs = await render(components.NTabs as Component, {
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
      const controlled = await render(components.NTabs as Component, {
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

test("[BTN-SEM-01][BTN-SEM-02][BTN-STATE-01][BTN-INT-03][BTN-STYLE-01][BTN-STYLE-03] styling-only package Blueprints emit semantic, readable markup during SSR", async () => {
  await withComponents(async (components) => {
    const card = await render(
      components.NCard as Component,
      { title: "Profile", description: "Owned when needed" },
      "Card body",
    );
    assert.match(card, /<div[^>]*class="n-card"/);
    assert.match(card, /<div[^>]*class="title"/);
    assert.match(card, /Profile/);
    assert.match(card, /Owned when needed/);
    assert.match(card, /Card body/);

    const cardWithFooter = await renderSlots(
      components.NCard as Component,
      { title: "Billing" },
      { default: "Plan details", footer: "Manage subscription" },
    );
    assert.match(cardWithFooter, /<div[^>]*class="unit -secondary"/);
    assert.match(cardWithFooter, /Manage subscription/);

    const cardWithRichHeader = await renderSlotFunctions(
      components.NCard as Component,
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
      components.NCard as Component,
      {},
      { title: "Slot-only title", description: "Slot-only description" },
    );
    assert.match(cardWithSlotOnlyHeader, /<header/);
    assert.match(cardWithSlotOnlyHeader, /Slot-only title/);
    assert.match(cardWithSlotOnlyHeader, /Slot-only description/);

    const untitledCard = await render(components.NCard as Component, {}, "Untitled card body");
    assert.match(untitledCard, /<div[^>]*class="n-card"/);
    assert.doesNotMatch(untitledCard, /<header/);
    assert.match(untitledCard, /Untitled card body/);

    const alert = await render(
      components.NAlert as Component,
      { title: "Action required", tone: "danger", role: "alert" },
      "Review the change",
    );
    assert.match(alert, /role="alert"/);
    const alertRoot = alert.match(/<section[^>]*class="n-alert"[^>]*>/u)?.[0] ?? "";
    assert.match(alertRoot, /data-tone="danger"/u);
    assert.match(alert, /Action required/);

    const alertWithIcon = await renderSlots(
      components.NAlert as Component,
      { title: "Saved" },
      { icon: "Success icon", default: "The record is current" },
    );
    assert.match(alertWithIcon, /class="icon"/);
    assert.match(alertWithIcon, /Success icon/);

    const alertWithRichTitle = await renderSlotFunctions(
      components.NAlert as Component,
      { title: "Saved" },
      { title: (slotProps) => h("span", `${String(slotProps.title)} status`) },
    );
    assert.match(alertWithRichTitle, /<h2[^>]*class="title"[^>]*>/);
    assert.match(alertWithRichTitle, /<span>Saved status<\/span>/);

    const defaultButton = await render(components.NButton as Component, {}, "Default");
    const attributedButton = await render(
      components.NButton as Component,
      {
        id: "save-button",
        class: "consumer-button",
        title: "Save changes",
        type: "submit",
        name: "intent",
        value: "save",
        form: "settings-form",
        "aria-label": "Save settings",
      },
      "Save",
    );
    const presetStyledButton = await render(
      components.NButton as Component,
      { class: "n-button -destructive" },
      "Delete",
    );
    assert.match(defaultButton, /class="n-button"/);
    assert.match(defaultButton, /data-scope="button"/);
    assert.match(defaultButton, /data-part="root"/);
    assert.match(defaultButton, /type="button"/);
    assert.doesNotMatch(defaultButton, /data-(?:variant|size)=/u);
    assert.match(attributedButton, /id="save-button"/);
    assert.match(attributedButton, /class="n-button consumer-button"/);
    assert.match(attributedButton, /title="Save changes"/);
    assert.match(attributedButton, /type="submit"/);
    assert.match(attributedButton, /name="intent"/);
    assert.match(attributedButton, /value="save"/);
    assert.match(attributedButton, /form="settings-form"/);
    assert.match(attributedButton, /aria-label="Save settings"/);
    assert.match(presetStyledButton, /class="n-button -destructive"/);
    assert.doesNotMatch(presetStyledButton, /n-button n-button/u);

    const badge = await render(components.NBadge as Component, {
      label: "Ready",
      tone: "success",
    });
    assert.match(badge, /class="n-badge" data-tone="success"/);
    assert.match(badge, /Ready/);

    const badgeWithRichLabel = await renderSlotFunctions(
      components.NBadge as Component,
      { label: "Ready", tone: "success" },
      { label: (slotProps) => h("span", `Icon ${String(slotProps.label)}`) },
    );
    assert.match(badgeWithRichLabel, /class="n-badge" data-tone="success"/);
    assert.match(badgeWithRichLabel, /<span>Icon Ready<\/span>/);
  });
});

test("[CAR-SEM-02][CAR-SEM-03][CAR-SEM-04][CAR-SEM-06] components entry exposes the completed expanded catalog with semantic SSR markup", async () => {
  await withComponents(async (components) => {
    for (const name of [
      "Autocomplete",
      "Carousel",
      "ContextMenu",
      "Menubar",
      "MultiSelect",
      "NavigationMenu",
      "OTPField",
      "Resizable",
      "TagsInput",
      "Toolbar",
      "Tree",
    ]) {
      const exportName = name === "OTPField" ? "NOtpField" : `N${name}`;
      assert.ok(components[exportName], `${exportName} is exported from /components`);
    }

    const choices = [{ key: "jp", label: "Japan" }, { key: "jm", label: "Jamaica" }];
    const autocomplete = await render(components.NAutocomplete as Component, {
      label: "Destination", items: choices, modelValue: "Ja", name: "destination",
    });
    assert.match(autocomplete, /role="combobox"/u);
    assert.match(autocomplete, /<input[^>]*name="destination"/u);
    assert.match(autocomplete, /popover/u);

    const multi = await render(components.NMultiSelect as Component, {
      label: "Countries", items: choices, modelValue: ["jp"], name: "countries",
      ariaDescribedby: "countries-help",
    });
    assert.match(multi, /role="combobox"/u);
    assert.match(multi, /<select[^>]*multiple[^>]*name="countries"|<select[^>]*name="countries"[^>]*multiple/u);
    assert.match(multi, /<option[^>]*value="jp"[^>]*selected/u);
    assert.match(multi, /<input[^>]*aria-describedby="countries-help"/u);

    const tags = await render(components.NTagsInput as Component, {
      label: "Topics", modelValue: ["vue", "aria"], name: "topics",
      ariaDescribedby: "topics-help",
    });
    assert.equal(tags.match(/<option/gu)?.length, 2);
    assert.match(tags, /<select[^>]*multiple[^>]*name="topics"|<select[^>]*name="topics"[^>]*multiple/u);
    assert.match(tags, /<input[^>]*aria-describedby="topics-help"/u);

    const otp = await render(components.NOtpField as Component, {
      label: "Verification code", modelValue: "12", name: "code", length: 4,
      ariaDescribedby: "code-help", enterkeyhint: "done",
    });
    assert.equal(otp.match(/<input/gu)?.length, 1);
    const otpInput = otp.match(/<input[^>]*>/u)?.[0] ?? "";
    assert.match(otpInput, /name="code"/u);
    assert.match(otpInput, /value="12"/u);
    assert.match(otpInput, /aria-describedby="code-help"/u);
    assert.match(otpInput, /enterkeyhint="done"/u);
    assert.equal(otp.match(/class="cell"/gu)?.length, 4);

    const carousel = await render(components.NCarousel as Component, {
      label: "Highlights", slidesLabel: "Highlight slides", landmark: true, modelValue: 0,
      items: [{ key: "a", label: "First" }, { key: "b", label: "Second" }],
    });
    assert.match(carousel, /role="region"/u);
    assert.match(carousel, /aria-roledescription="carousel"/u);
    assert.equal(carousel.match(/aria-roledescription="slide"/gu)?.length, 2);
    assert.equal(carousel.match(/data-scope="carousel"/gu)?.length, 4);
    assert.match(carousel, /data-part="root"/u);
    assert.match(carousel, /data-part="viewport"/u);
    assert.equal(carousel.match(/data-part="slide"/gu)?.length, 2);
    assert.equal(carousel.match(/aria-labelledby="[^"]+-slide-[12]-label"/gu)?.length, 2);
    assert.doesNotMatch(carousel, /data-nagi-carousel-track/u);
    assert.match(carousel, /role="group" aria-label="Highlight slides" aria-roledescription="slides" tabindex="0"/u);
    assert.match(carousel, /aria-label="Highlight slides"[\s\S]*class="seg -slides"[\s\S]*aria-roledescription="slide"/u);
    assert.match(carousel, />First[\s\S]*?1 \/ 2/u);

    const resizable = await renderSlots(components.NResizable as Component, {
      label: "Panels", modelValue: 50,
    }, { first: "Editor", second: "Preview" });
    assert.match(resizable, /role="separator"/u);
    assert.match(resizable, /aria-valuenow="50"/u);

    const toolbar = await render(components.NToolbar as Component, {
      label: "Formatting",
      items: [{ key: "bold", label: "Bold" }, { key: "link", label: "Link" }],
    });
    assert.match(toolbar, /role="toolbar"/u);
    assert.equal(toolbar.match(/tabindex="0"/gu)?.length, 1);

    const context = await render(components.NContextMenu as Component, {
      items: [{ key: "copy", label: "Copy" }],
    }, "Context target");
    assert.match(context, /Context target/u);
    assert.match(context, /role="menu"/u);
    assert.match(context, /aria-label="Context menu"/u);
    assert.match(context, /class="unit -assistive"/u);
    assert.doesNotMatch(context, /class="value -assistive"/u);

    const menubar = await render(components.NMenubar as Component, {
      label: "Application",
      items: [{ key: "file", label: "File", items: [{ key: "new", label: "New" }] }],
    });
    assert.match(menubar, /role="menubar"/u);
    assert.match(menubar, /aria-label="Application"/u);

    const navigation = await render(components.NNavigationMenu as Component, {
      label: "Primary",
      items: [{ key: "about", label: "About", href: "/about" }],
    });
    assert.match(navigation, /<nav[^>]*aria-label="Primary"/u);
    assert.doesNotMatch(navigation, /role="menu(?:bar|item)?"/u);

    const tree = await render(components.NTree as Component, {
      label: "Files", modelValue: null, expanded: [],
      items: [{ key: "src", label: "Source", children: [{ key: "app", label: "App" }] }],
    });
    assert.match(tree, /role="tree"/u);
    assert.match(tree, /role="treeitem"/u);
    assert.match(tree, /aria-expanded="false"/u);
  });
});
