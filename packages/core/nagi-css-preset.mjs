/**
 * Nagi CSS semantic preset for package-component consumers.
 *
 * Package components are opaque boundaries until they are owned. The fixed
 * root classes mirror the raw SFC sources; declared default slots are the only
 * places where consumer-owned markup can resume a styled sub-surface.
 */
export { nagiThemeTokens as nagiUiThemeTokens } from "./theme/tokens.mjs"

export const nagiUiSurfaceRootPrefixes = ["n-"]

export const nagiUiComponentClasses = {
  Accordion: "n-accordion",
  Alert: "n-alert",
  AlertDialog: "n-alert-dialog",
  Avatar: "n-avatar",
  Badge: "n-badge",
  Button: "n-button",
  Card: "n-card",
  Checkbox: "n-checkbox",
  Combobox: "n-combobox",
  Dialog: "n-dialog",
  Disclosure: "n-disclosure",
  DropdownMenu: "n-dropdown-menu",
  Fieldset: "n-fieldset",
  Input: "n-input",
  Listbox: "n-listbox",
  Meter: "n-meter",
  Popover: "n-popover",
  Progress: "n-progress",
  Radio: "n-radio",
  Select: "n-select",
  Separator: "n-separator",
  Slider: "n-slider",
  Switch: "n-switch",
  Tabs: "n-tabs",
  Toast: "n-toast",
  Toggle: "n-toggle",
  Tooltip: "n-tooltip",
}

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
  Fieldset: { default: "n-fieldset-content" },
  Popover: { default: "n-popover-content" },
  Tabs: { panel: "n-tabs-panel" },
  Toggle: { default: "n-toggle-content" },
}

const nagiUiPreset = {
  componentClasses: nagiUiComponentClasses,
  componentSlots: nagiUiComponentSlots,
}

export default nagiUiPreset
