/**
 * Nagi CSS semantic preset for package-component consumers.
 *
 * Package components are opaque boundaries until they are owned. The fixed
 * root classes mirror the raw SFC sources; declared slots are the only
 * places where consumer-owned markup can resume a styled sub-surface.
 */
export { nagiThemeTokens as nagiUiThemeTokens } from "./theme/tokens.mjs"

export const nagiUiSurfaceRootPrefixes = ["n-"]

/** UI anatomy used by owned Nagi component sources. */
export const nagiUiAnatomyClasses = [
  "actions",
  "field",
  "icon",
  "media",
  "rail",
  "value",
]

/** Opaque package component names. Nagi CSS derives `n-<kebab-name>`. */
export const nagiUiComponents = [
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
  "Skeleton",
  "Slider",
  "Spinner",
  "Stepper",
  "Switch",
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
  Popover: { default: "n-popover-content" },
  PreviewCard: { default: "n-preview-card-content" },
  Tabs: { panel: "n-tabs-panel" },
  Toggle: { default: "n-toggle-content" },
}

const nagiUiPreset = {
  anatomyClasses: nagiUiAnatomyClasses,
  componentClassPrefix: "n-",
  componentClasses: nagiUiComponents,
  componentSlots: nagiUiComponentSlots,
}

export default nagiUiPreset
