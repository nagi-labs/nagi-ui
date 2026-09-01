/**
 * Nagi CSS semantic preset for package-component consumers.
 *
 * Package components are opaque boundaries until they are owned. The fixed
 * root classes mirror the raw SFC sources; declared slots are the only
 * places where consumer-owned markup can resume a styled sub-surface.
 */
export { nagiThemeTokens as nagiUiThemeTokens } from "./theme/tokens.mjs";

export const nagiUiSurfaceRootPrefixes = ["n-"];

/** UI anatomy used by owned Nagi component sources. */
export const nagiUiAnatomyClasses = ["actions", "field", "icon", "media", "rail", "value"];

/** Blueprint identities used to derive the public `N*` component boundary map. */
const nagiUiBlueprintNames = [
  "Accordion",
  "Autocomplete",
  "Alert",
  "AlertDialog",
  "Avatar",
  "Badge",
  "Breadcrumb",
  "Button",
  "ButtonGroup",
  "Card",
  "Calendar",
  "Carousel",
  "Checkbox",
  "Combobox",
  "ContextMenu",
  "DateField",
  "DatePicker",
  "DateRangePicker",
  "Dialog",
  "Disclosure",
  "DropdownMenu",
  "EmptyState",
  "Fieldset",
  "FileInput",
  "Input",
  "InputGroup",
  "Kbd",
  "Listbox",
  "Meter",
  "Menubar",
  "MultiSelect",
  "NumberField",
  "NavigationMenu",
  "OTPField",
  "Pagination",
  "Popover",
  "Progress",
  "PreviewCard",
  "Radio",
  "RangeCalendar",
  "RangeSlider",
  "Resizable",
  "Rating",
  "Select",
  "Separator",
  "Sidebar",
  "SidebarLink",
  "SidebarSection",
  "Skeleton",
  "Slider",
  "Spinner",
  "Stepper",
  "Switch",
  "Table",
  "Tabs",
  "TagsInput",
  "Textarea",
  "TimeField",
  "Toolbar",
  "Toast",
  "Toggle",
  "ToggleGroup",
  "Tree",
  "Tooltip",
];

function kebabCase(value) {
  return value
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

function publicComponentName(value) {
  const pascalName = kebabCase(value)
    .split("-")
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join("");
  return `N${pascalName}`;
}

/** Opaque package component names used in consumer templates. */
export const nagiUiComponents = nagiUiBlueprintNames.map(publicComponentName);

/** PascalCase imports and kebab-case Vue tags mapped to the same package boundary. */
export const nagiUiComponentClasses = Object.fromEntries(
  nagiUiBlueprintNames.flatMap((name) => {
    const exportName = publicComponentName(name);
    const templateName = kebabCase(exportName);
    const boundaryClass = `n-${kebabCase(name)}`;
    return [
      [exportName, boundaryClass],
      [templateName, boundaryClass],
    ];
  }),
);

const nagiUiBlueprintSlots = {
  Accordion: {
    summary: "n-accordion-summary",
    panel: "n-accordion-panel",
  },
  Alert: { default: "n-alert-content", icon: "n-alert-icon", title: "n-alert-title" },
  AlertDialog: {
    title: "n-alert-dialog-title",
    description: "n-alert-dialog-description",
  },
  Avatar: { fallback: "n-avatar-fallback" },
  Badge: { label: "n-badge-label" },
  Button: { default: "n-button-content" },
  ButtonGroup: { default: "n-button-group-content" },
  Card: {
    default: "n-card-content",
    title: "n-card-title",
    description: "n-card-description",
    footer: "n-card-footer",
  },
  ContextMenu: { default: "n-context-menu-content" },
  Dialog: {
    default: "n-dialog-content",
    title: "n-dialog-title",
    description: "n-dialog-description",
    actions: "n-dialog-actions",
  },
  Disclosure: {
    default: "n-disclosure-content",
    summary: "n-disclosure-summary",
  },
  EmptyState: { default: "n-empty-state-action" },
  Fieldset: { default: "n-fieldset-content" },
  InputGroup: {
    default: "n-input-group-control",
    prefix: "n-input-group-prefix",
    suffix: "n-input-group-suffix",
    action: "n-input-group-action",
  },
  Resizable: {
    first: "n-resizable-first",
    second: "n-resizable-second",
  },
  Sidebar: { default: "n-sidebar-content", footer: "n-sidebar-footer" },
  SidebarLink: { default: "n-sidebar-link-content" },
  SidebarSection: { default: "n-sidebar-section-content" },
  Table: {
    cell: "n-table-cell-content",
    header: "n-table-header-content",
    caption: "n-table-caption-content",
    empty: "n-table-empty-content",
  },
  Popover: { default: "n-popover-content" },
  PreviewCard: { default: "n-preview-card-content" },
  Tabs: { panel: "n-tabs-panel" },
  Toggle: { default: "n-toggle-content" },
};

export const nagiUiComponentSlots = Object.fromEntries(
  Object.entries(nagiUiBlueprintSlots).flatMap(([name, slots]) => {
    const exportName = publicComponentName(name);
    return [
      [exportName, slots],
      [kebabCase(exportName), slots],
    ];
  }),
);

const nagiUiPreset = {
  anatomyClasses: nagiUiAnatomyClasses,
  componentClasses: nagiUiComponentClasses,
  componentSlots: nagiUiComponentSlots,
};

export default nagiUiPreset;
