import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { useDialog, useDisclosure, usePopover, useToggle, useTooltip } from "@nagi-labs/nagi-ui";
import * as nagiUi from "@nagi-labs/nagi-ui";
import * as componentBindings from "@nagi-labs/nagi-ui/component-controls";
import { ref } from "vue";

const repo = path.join(import.meta.dirname, "..");

test("public low-level defaults remain callable without an options object", () => {
  assert.equal(usePopover().open.value, false);
  assert.equal(useTooltip().open.value, false);
  assert.equal(useDialog().open.value, false);
  assert.equal(useDisclosure().open.value, false);
  assert.equal(useToggle().pressed.value, false);
});

test("runtime package exports contain no legacy useXControl names", () => {
  for (const [entrypoint, exports] of [
    ["root", nagiUi],
    ["component-controls", componentBindings],
  ] as const) {
    const legacy = Object.keys(exports).filter((name) => /^use[A-Z].*Control$/u.test(name));
    assert.deepEqual(legacy, [], `${entrypoint} exports legacy controls`);
  }
});

test("public component overloads preserve the model and map named props", () => {
  const popoverOpen = ref(false);
  const popover = usePopover({ area: "block-start", offset: 12 }, popoverOpen);
  assert.equal(popover.open, popoverOpen);
  assert.equal(popover.popoverProps.style?.["position-area"], "block-start");
  assert.equal(popover.popoverProps.style?.["margin-block-end"], "12px");

  const tooltipOpen = ref(false);
  const tooltip = useTooltip(
    { openDelay: 150, closeDelay: 0, disabled: false, area: "block-start", offset: 4 },
    tooltipOpen,
  );
  tooltip.show();
  assert.equal(tooltip.open, tooltipOpen);
  assert.equal(tooltipOpen.value, true);

  const dialogOpen = ref(false);
  const dialog = useDialog({ modal: true, closedby: "closerequest" }, dialogOpen);
  assert.equal(dialog.open, dialogOpen);
  assert.equal(dialog.dialogProps.closedby, "closerequest");

  const disclosureOpen = ref(false);
  const disclosure = useDisclosure({ name: "faq", disabled: false }, disclosureOpen);
  assert.equal(disclosure.open, disclosureOpen);
  assert.equal(disclosure.detailsProps.name, "faq");
  assert.equal(disclosure.summaryProps["aria-disabled"], undefined);

  const pressed = ref(false);
  const toggle = useToggle({ disabled: false }, pressed);
  toggle.buttonProps.onClick({} as MouseEvent);
  assert.equal(toggle.pressed, pressed);
  assert.equal(toggle.buttonProps.disabled, false);
  assert.equal(pressed.value, true);
});

test("thin behavior SFCs use only the public component overload", () => {
  const controls = {
    "popover/Popover.vue": ["popover", "usePopover", "open"],
    "tooltip/Tooltip.vue": ["tooltip", "useTooltip", "open"],
    "disclosure/Disclosure.vue": ["disclosure", "useDisclosure", "open"],
    "toggle/Toggle.vue": ["toggle", "useToggle", "pressed"],
  } as const;

  for (const [file, [variable, composable, model]] of Object.entries(controls)) {
    const source = fs.readFileSync(path.join(repo, "packages/core/blueprints", file), "utf8");
    assert.match(
      source,
      new RegExp(
        `const ${variable} = ${composable}\\([\\s\\S]*?${model},?\\s*(?:useAttrs\\(\\),?\\s*)?\\);`,
      ),
    );
    assert.doesNotMatch(source, new RegExp(`${composable}\\([\\s\\S]*?${model},\\s*\\{`));
    assert.doesNotMatch(source, new RegExp(`${composable}Control`));
    assert.doesNotMatch(source, /component-controls/);
  }

  const toggleSource = fs.readFileSync(
    path.join(repo, "packages/core/blueprints/toggle/Toggle.vue"),
    "utf8",
  );
  assert.match(toggleSource, /useAttrs\(\)/u);
  assert.match(toggleSource, /v-bind="toggle\.buttonProps"/u);
  assert.doesNotMatch(toggleSource, /mergeElementProps|const buttonProps = computed/u);

  const dialogSource = fs.readFileSync(
    path.join(repo, "packages/core/blueprints/dialog/Dialog.vue"),
    "utf8",
  );
  assert.match(
    dialogSource,
    /const dialog = useDialog\(\{ open, modal: true, closedby: "any" \}\);/u,
  );
  assert.doesNotMatch(dialogSource, /modal\?:|closedby\?:/u);

  const adapters = fs.readFileSync(
    path.join(repo, "packages/core/src/component-controls.ts"),
    "utf8",
  );
  for (const legacy of [
    "usePopoverControl",
    "useTooltipControl",
    "useDialogControl",
    "useDisclosureControl",
    "useToggleControl",
  ]) {
    assert.ok(!adapters.includes(legacy), `${legacy} must not remain in component-controls`);
  }
  assert.match(adapters, /useAlertDialog/);
});
