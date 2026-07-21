/**
 * Nagi CSS semantic preset for package-component consumers.
 *
 * Package components are opaque boundaries until they are owned. The fixed
 * root classes mirror the raw SFC sources; declared default slots are the only
 * places where consumer-owned markup can resume a styled sub-surface.
 */
export { nagiThemeTokens as nagiUiThemeTokens } from "./theme/tokens.mjs"

export const nagiUiComponentClasses = {
  Alert: "alert",
  Badge: "badge",
  Button: "nagi-button",
  Card: "card",
  Checkbox: "nagi-checkbox",
  Combobox: "combobox",
  Dialog: "nagi-dialog",
  Disclosure: "nagi-disclosure",
  DropdownMenu: "dropdown-menu",
  Fieldset: "nagi-fieldset",
  Input: "nagi-input",
  Listbox: "listbox",
  Meter: "nagi-meter",
  Popover: "nagi-popover",
  Progress: "nagi-progress",
  Radio: "nagi-radio",
  Select: "nagi-select",
  Slider: "nagi-slider",
  Switch: "nagi-switch",
  Tabs: "tabs",
  Toast: "nagi-toast",
  Tooltip: "nagi-tooltip",
}

export const nagiUiComponentSlots = {
  Alert: { default: "alert-content" },
  Button: { default: "nagi-button-content" },
  Card: { default: "card-content" },
  Dialog: {
    default: "nagi-dialog-content",
    actions: "nagi-dialog-actions",
  },
  Disclosure: { default: "nagi-disclosure-content" },
  Fieldset: { default: "nagi-fieldset-content" },
  Popover: { default: "nagi-popover-content" },
  Tabs: { panel: "tabs-panel" },
}

const nagiUiPreset = {
  componentClasses: nagiUiComponentClasses,
  componentSlots: nagiUiComponentSlots,
}

export default nagiUiPreset
