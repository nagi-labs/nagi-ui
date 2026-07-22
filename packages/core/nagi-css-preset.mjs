/**
 * Nagi CSS semantic preset for package-component consumers.
 *
 * Package components are opaque boundaries until they are owned. The fixed
 * root classes mirror the raw SFC sources; declared slots are the only
 * places where consumer-owned markup can resume a styled sub-surface.
 */
export { nagiThemeTokens as nagiUiThemeTokens } from "./theme/tokens.mjs"

export const nagiUiSurfaceRootPrefixes = ["n-"]

/** Opaque package component names. Nagi CSS derives `n-<kebab-name>`. */
export const nagiUiComponents = [
  "Accordion",
  "Alert",
  "AlertDialog",
  "Avatar",
  "Badge",
  "Breadcrumb",
  "Button",
  "ButtonGroup",
  "Card",
  "Checkbox",
  "Combobox",
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
  "NumberField",
  "Pagination",
  "Popover",
  "Progress",
  "Radio",
  "Rating",
  "Select",
  "Separator",
  "Skeleton",
  "Slider",
  "Spinner",
  "Switch",
  "Tabs",
  "Textarea",
  "Toast",
  "Toggle",
  "ToggleGroup",
  "Tooltip",
]

export const nagiUiComponentSlots = {
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
  Popover: { default: "n-popover-content" },
  Tabs: { panel: "n-tabs-panel" },
  Toggle: { default: "n-toggle-content" },
}

const nagiUiPreset = {
  componentClassPrefix: "n-",
  componentClasses: nagiUiComponents,
  componentSlots: nagiUiComponentSlots,
}

export default nagiUiPreset
