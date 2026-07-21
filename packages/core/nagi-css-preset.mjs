/**
 * Nagi CSS semantic preset for package-component consumers.
 *
 * Package components are opaque boundaries until they are owned. The fixed
 * root classes mirror the raw SFC sources; declared default slots are the only
 * places where consumer-owned markup can resume a styled sub-surface.
 */
export const nagiUiComponentClasses = {
  Alert: "alert",
  Badge: "badge",
  Button: "nagi-button",
  Card: "card",
  Combobox: "combobox",
  Dialog: "nagi-dialog",
  Disclosure: "nagi-disclosure",
  DropdownMenu: "dropdown-menu",
  Listbox: "listbox",
  Popover: "nagi-popover",
  Toast: "nagi-toast",
  Tooltip: "nagi-tooltip",
}

export const nagiUiComponentSlots = {
  Alert: { default: "alert-content" },
  Button: { default: "nagi-button-content" },
  Card: { default: "card-content" },
  Dialog: { default: "nagi-dialog-content" },
  Disclosure: { default: "nagi-disclosure-content" },
  Popover: { default: "nagi-popover-content" },
}

const nagiUiPreset = {
  componentClasses: nagiUiComponentClasses,
  componentSlots: nagiUiComponentSlots,
}

export default nagiUiPreset
