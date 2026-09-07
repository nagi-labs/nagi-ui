import { readFile } from "node:fs/promises";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const coreSource = path.join(repositoryRoot, "packages/core/src");
const blueprints = path.join(repositoryRoot, "packages/core/blueprints");

const contracts = [
  ["calendar", "calendar.vue", "calendar.cellButtonProps", "calendar.ts", "cellElements.refFor"],
  ["carousel", "carousel.vue", "carousel.viewportProps", "carousel.ts", "ref: setViewport"],
  ["combobox", "combobox.vue", "combobox.inputProps", "combobox.ts", "ref: setInput"],
  ["combobox", "combobox.vue", "combobox.listboxProps", "combobox.ts", "ref: setListbox"],
  ["dialog", "dialog.vue", "dialog.dialogProps", "dialog.ts", "ref: setDialog"],
  ["disclosure", "disclosure.vue", "disclosure.detailsProps", "disclosure.ts", "ref: setDetails"],
  ["listbox", "listbox.vue", "listbox.optionProps", "listbox.ts", "optionElements.refFor"],
  ["menubar", "menubar.vue", "menubar.menubarTriggerProps", "menubar.ts", "triggerElements.refFor"],
  ["multi-select", "multi-select.vue", "select.inputProps", "multi-select.ts", "ref: setInput"],
  ["multi-select", "multi-select.vue", "select.optionProps", "multi-select.ts", "optionElements.refFor"],
  ["navigation-menu", "navigation-menu.vue", "navigation.navigationTriggerProps", "navigation-menu.ts", "triggerElements.refFor"],
  ["popover", "popover.vue", "popover.triggerProps", "popover.ts", "ref: setTrigger"],
  ["popover", "popover.vue", "popover.popoverProps", "popover.ts", "ref: setPopover"],
  ["preview-card", "preview-card.vue", "preview.triggerProps", "preview-card.ts", "ref: setTrigger"],
  ["preview-card", "preview-card.vue", "preview.previewProps", "preview-card.ts", "ref: setPreview"],
  ["tabs", "tabs.vue", "tabs.tabProps", "tabs.ts", "tabElements.refFor"],
  ["time-field", "time-field.vue", "behavior.segmentProps", "time-field.ts", "segmentElements.refFor"],
  ["date-field", "date-field.vue", "behavior.segmentProps", "date-field.ts", "segmentElements.refFor"],
  ["toolbar", "toolbar.vue", "toolbar.itemProps", "toolbar.ts", "itemElements.refFor"],
  ["tooltip", "tooltip.vue", "tooltip.triggerProps", "tooltip.ts", "ref: setTrigger"],
  ["tooltip", "tooltip.vue", "tooltip.tooltipProps", "tooltip.ts", "ref: setTooltip"],
  ["toast", "toast.vue", "notifier.regionProps", "toast-document-coordinator.ts", "ref: setRegion"],
  ["tree", "tree-branch.vue", "tree.treeItemProps", "tree.ts", "itemElements.refFor"],
];

const issues = [];
const sourceCache = new Map();

async function source(file) {
  const cached = sourceCache.get(file);
  if (cached) return cached;
  const value = await readFile(file, "utf8");
  sourceCache.set(file, value);
  return value;
}

for (const [directory, blueprintFile, binding, behaviorFile, registration] of contracts) {
  const blueprintPath = path.join(blueprints, directory, blueprintFile);
  const behaviorPath = path.join(coreSource, behaviorFile);
  const blueprint = await source(blueprintPath);
  const behavior = await source(behaviorPath);
  const escapedBinding = binding.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const destination = new RegExp(`<[^>]+v-bind="${escapedBinding}(?:\\([^)]*\\))?"[^>]*>`, "gu")
    .exec(blueprint)?.[0];

  if (!destination) {
    issues.push(`${path.relative(repositoryRoot, blueprintPath)} does not consume ${binding}.`);
  } else if (/\s(?::?ref)\s*=/u.test(destination)) {
    issues.push(`${path.relative(repositoryRoot, blueprintPath)} duplicates the ref owned by ${binding}.`);
  }
  if (!behavior.includes(registration)) {
    issues.push(`${path.relative(repositoryRoot, behaviorPath)} does not register ${binding} with ${registration}.`);
  }
}

for (const behaviorFile of [
  "calendar.ts",
  "combobox.ts",
  "date-field.ts",
  "disclosure.ts",
  "listbox.ts",
  "menubar.ts",
  "multi-select.ts",
  "navigation-menu.ts",
  "tabs.ts",
  "time-field.ts",
  "toolbar.ts",
  "tooltip.ts",
  "tree.ts",
]) {
  const behaviorPath = path.join(coreSource, behaviorFile);
  const behavior = await source(behaviorPath);
  if (/\b(?:document|ownerDocument)\??\.(?:querySelector|querySelectorAll|getElementById)\s*\(/u.test(behavior)) {
    issues.push(`${path.relative(repositoryRoot, behaviorPath)} rediscovers a registered element by document lookup.`);
  }
}

if (issues.length > 0) {
  throw new Error(`Behavior binding audit failed:\n${issues.join("\n")}`);
}

console.log(`Behavior bindings: ${contracts.length}/${contracts.length} destinations register locally.`);
