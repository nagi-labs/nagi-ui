/**
 * Component layer entry (`@nagi-labs/nagi-ui/components`).
 *
 * Kept separate from `.` (the composable layer) so the core entry stays
 * loadable by plain Node and ships no CSS. The re-exported SFCs are the same
 * files the `own` workflow copies (single-source principle, CHARTER §3).
 */
export { default as NAccordion } from "./blueprints/accordion/accordion.vue";
export { default as NAutocomplete } from "./blueprints/autocomplete/autocomplete.vue";
export type { AutocompleteOption } from "./blueprints/autocomplete/autocomplete.vue";
export type { AccordionItem } from "./blueprints/accordion/accordion.vue";
export { default as NAlert } from "./blueprints/alert/alert.vue";
export { default as NAlertDialog } from "./blueprints/alert-dialog/alert-dialog.vue";
export { default as NAvatar } from "./blueprints/avatar/avatar.vue";
export { default as NBadge } from "./blueprints/badge/badge.vue";
export { default as NBreadcrumb } from "./blueprints/breadcrumb/breadcrumb.vue";
export type { BreadcrumbItem } from "./blueprints/breadcrumb/breadcrumb.vue";
export { default as NButton } from "./blueprints/button/button.vue";
export { default as NButtonGroup } from "./blueprints/button-group/button-group.vue";
export { default as NCard } from "./blueprints/card/card.vue";
export { default as NCalendar } from "./blueprints/calendar/calendar.vue";
export { default as NCarousel } from "./blueprints/carousel/carousel.vue";
export type { CarouselItem } from "./blueprints/carousel/carousel.vue";
export { default as NCheckbox } from "./blueprints/checkbox/checkbox.vue";
export { default as NCombobox } from "./blueprints/combobox/combobox.vue";
export type { ComboboxOption } from "./blueprints/combobox/combobox.vue";
export { default as NContextMenu } from "./blueprints/context-menu/context-menu.vue";
export type { ContextMenuItem } from "./blueprints/context-menu/context-menu.vue";
export { default as NDateField } from "./blueprints/date-field/date-field.vue";
export { default as NDatePicker } from "./blueprints/date-picker/date-picker.vue";
export { default as NDateRangePicker } from "./blueprints/date-range-picker/date-range-picker.vue";
export { default as NDialog } from "./blueprints/dialog/dialog.vue";
export { default as NDisclosure } from "./blueprints/disclosure/disclosure.vue";
export { default as NDropdownMenu } from "./blueprints/menu/dropdown-menu.vue";
export { default as NEmptyState } from "./blueprints/empty-state/empty-state.vue";
export { default as NFieldset } from "./blueprints/fieldset/fieldset.vue";
export { default as NFileInput } from "./blueprints/file-input/file-input.vue";
export { default as NInput } from "./blueprints/input/input.vue";
export { default as NInputGroup } from "./blueprints/input-group/input-group.vue";
export { default as NKbd } from "./blueprints/kbd/kbd.vue";
export { default as NListbox } from "./blueprints/listbox/listbox.vue";
export type { ListboxOption } from "./blueprints/listbox/listbox.vue";
export { default as NMeter } from "./blueprints/meter/meter.vue";
export { default as NMenubar } from "./blueprints/menubar/menubar.vue";
export type { MenubarAction, MenubarMenu } from "./blueprints/menubar/menubar.vue";
export { default as NMultiSelect } from "./blueprints/multi-select/multi-select.vue";
export type { MultiSelectOption } from "./blueprints/multi-select/multi-select.vue";
export { default as NNumberField } from "./blueprints/number-field/number-field.vue";
export { default as NNavigationMenu } from "./blueprints/navigation-menu/navigation-menu.vue";
export type { NavigationMenuItem, NavigationMenuLink } from "./blueprints/navigation-menu/navigation-menu.vue";
export { default as NOtpField } from "./blueprints/otp-field/otp-field.vue";
export { default as NPagination } from "./blueprints/pagination/pagination.vue";
export type { PaginationItem } from "./blueprints/pagination/pagination.vue";
export { default as NPopover } from "./blueprints/popover/popover.vue";
export { default as NProgress } from "./blueprints/progress/progress.vue";
export { default as NPreviewCard } from "./blueprints/preview-card/preview-card.vue";
export { default as NRadio } from "./blueprints/radio/radio.vue";
export { default as NRangeCalendar } from "./blueprints/range-calendar/range-calendar.vue";
export { default as NRangeSlider } from "./blueprints/range-slider/range-slider.vue";
export { default as NResizable } from "./blueprints/resizable/resizable.vue";
export { default as NRating } from "./blueprints/rating/rating.vue";
export type { RatingItem } from "./blueprints/rating/rating.vue";
export { default as NSelect } from "./blueprints/select/select.vue";
export type { NagiSelectOption } from "./blueprints/select/select.vue";
export { default as NSeparator } from "./blueprints/separator/separator.vue";
export { default as NSidebar } from "./blueprints/sidebar/sidebar.vue";
export { default as NSidebarLink } from "./blueprints/sidebar/sidebar-link.vue";
export { default as NSidebarSection } from "./blueprints/sidebar/sidebar-section.vue";
export { default as NSkeleton } from "./blueprints/skeleton/skeleton.vue";
export { default as NSlider } from "./blueprints/slider/slider.vue";
export { default as NSpinner } from "./blueprints/spinner/spinner.vue";
export { default as NStepper } from "./blueprints/stepper/stepper.vue";
export type { StepperItem } from "./blueprints/stepper/stepper.vue";
export { default as NSwitch } from "./blueprints/switch/switch.vue";
export { default as NTable } from "./blueprints/table/table.vue";
export type { TableColumn, TableColumnAlign } from "./blueprints/table/table.vue";
export { default as NTabs } from "./blueprints/tabs/tabs.vue";
export { default as NTagsInput } from "./blueprints/tags-input/tags-input.vue";
export type { TabsItem } from "./blueprints/tabs/tabs.vue";
export { default as NTextarea } from "./blueprints/textarea/textarea.vue";
export { default as NTimeField } from "./blueprints/time-field/time-field.vue";
export { default as NToolbar } from "./blueprints/toolbar/toolbar.vue";
export type { ToolbarItem } from "./blueprints/toolbar/toolbar.vue";
export { default as NToast } from "./blueprints/toast/toast.vue";
export { default as NToggle } from "./blueprints/toggle/toggle.vue";
export { default as NToggleGroup } from "./blueprints/toggle-group/toggle-group.vue";
export { default as NTree } from "./blueprints/tree/tree.vue";
export type { TreeNode } from "./blueprints/tree/tree.vue";
export type {
  ToggleGroupItem,
  ToggleGroupValue,
} from "./blueprints/toggle-group/toggle-group.vue";
export { default as NTooltip } from "./blueprints/tooltip/tooltip.vue";
export type {
  DropdownMenuActionNode,
  DropdownMenuCheckboxNode,
  DropdownMenuGroupChildNode,
  DropdownMenuGroupNode,
  DropdownMenuLinkNode,
  DropdownMenuNode,
  DropdownMenuRadioGroupNode,
  DropdownMenuRadioItem,
  DropdownMenuSeparatorNode,
  DropdownMenuSubmenuNode,
} from "./blueprints/menu/dropdown-schema.ts";
