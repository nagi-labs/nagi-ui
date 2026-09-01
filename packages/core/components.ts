/**
 * Component layer entry (`@nagi-labs/nagi-ui/components`).
 *
 * Kept separate from `.` (the composable layer) so the core entry stays
 * loadable by plain Node and ships no CSS. The re-exported SFCs are the same
 * files the `own` workflow copies (single-source principle, CHARTER §3).
 */
export { default as NAccordion } from "./blueprints/accordion/Accordion.vue";
export { default as NAutocomplete } from "./blueprints/autocomplete/Autocomplete.vue";
export type { AutocompleteOption } from "./blueprints/autocomplete/Autocomplete.vue";
export type { AccordionItem } from "./blueprints/accordion/Accordion.vue";
export { default as NAlert } from "./blueprints/alert/Alert.vue";
export { default as NAlertDialog } from "./blueprints/alert-dialog/AlertDialog.vue";
export { default as NAvatar } from "./blueprints/avatar/Avatar.vue";
export { default as NBadge } from "./blueprints/badge/Badge.vue";
export { default as NBreadcrumb } from "./blueprints/breadcrumb/Breadcrumb.vue";
export type { BreadcrumbItem } from "./blueprints/breadcrumb/Breadcrumb.vue";
export { default as NButton } from "./blueprints/button/Button.vue";
export { default as NButtonGroup } from "./blueprints/button-group/ButtonGroup.vue";
export { default as NCard } from "./blueprints/card/Card.vue";
export { default as NCalendar } from "./blueprints/calendar/Calendar.vue";
export { default as NCarousel } from "./blueprints/carousel/Carousel.vue";
export type { CarouselItem } from "./blueprints/carousel/Carousel.vue";
export { default as NCheckbox } from "./blueprints/checkbox/Checkbox.vue";
export { default as NCombobox } from "./blueprints/combobox/Combobox.vue";
export type { ComboboxOption } from "./blueprints/combobox/Combobox.vue";
export { default as NContextMenu } from "./blueprints/context-menu/ContextMenu.vue";
export type { ContextMenuItem } from "./blueprints/context-menu/ContextMenu.vue";
export { default as NDateField } from "./blueprints/date-field/DateField.vue";
export { default as NDatePicker } from "./blueprints/date-picker/DatePicker.vue";
export { default as NDateRangePicker } from "./blueprints/date-range-picker/DateRangePicker.vue";
export { default as NDialog } from "./blueprints/dialog/Dialog.vue";
export { default as NDisclosure } from "./blueprints/disclosure/Disclosure.vue";
export { default as NDropdownMenu } from "./blueprints/menu/DropdownMenu.vue";
export { default as NEmptyState } from "./blueprints/empty-state/EmptyState.vue";
export { default as NFieldset } from "./blueprints/fieldset/Fieldset.vue";
export { default as NFileInput } from "./blueprints/file-input/FileInput.vue";
export { default as NInput } from "./blueprints/input/Input.vue";
export { default as NInputGroup } from "./blueprints/input-group/InputGroup.vue";
export { default as NKbd } from "./blueprints/kbd/Kbd.vue";
export { default as NListbox } from "./blueprints/listbox/Listbox.vue";
export type { ListboxOption } from "./blueprints/listbox/Listbox.vue";
export { default as NMeter } from "./blueprints/meter/Meter.vue";
export { default as NMenubar } from "./blueprints/menubar/Menubar.vue";
export type { MenubarAction, MenubarMenu } from "./blueprints/menubar/Menubar.vue";
export { default as NMultiSelect } from "./blueprints/multi-select/MultiSelect.vue";
export type { MultiSelectOption } from "./blueprints/multi-select/MultiSelect.vue";
export { default as NNumberField } from "./blueprints/number-field/NumberField.vue";
export { default as NNavigationMenu } from "./blueprints/navigation-menu/NavigationMenu.vue";
export type { NavigationMenuItem, NavigationMenuLink } from "./blueprints/navigation-menu/NavigationMenu.vue";
export { default as NOtpField } from "./blueprints/otp-field/OTPField.vue";
export { default as NPagination } from "./blueprints/pagination/Pagination.vue";
export type { PaginationItem } from "./blueprints/pagination/Pagination.vue";
export { default as NPopover } from "./blueprints/popover/Popover.vue";
export { default as NProgress } from "./blueprints/progress/Progress.vue";
export { default as NPreviewCard } from "./blueprints/preview-card/PreviewCard.vue";
export { default as NRadio } from "./blueprints/radio/Radio.vue";
export { default as NRangeCalendar } from "./blueprints/range-calendar/RangeCalendar.vue";
export { default as NRangeSlider } from "./blueprints/range-slider/RangeSlider.vue";
export { default as NResizable } from "./blueprints/resizable/Resizable.vue";
export { default as NRating } from "./blueprints/rating/Rating.vue";
export type { RatingItem } from "./blueprints/rating/Rating.vue";
export { default as NSelect } from "./blueprints/select/Select.vue";
export type { NagiSelectOption } from "./blueprints/select/Select.vue";
export { default as NSeparator } from "./blueprints/separator/Separator.vue";
export { default as NSidebar } from "./blueprints/sidebar/Sidebar.vue";
export { default as NSidebarLink } from "./blueprints/sidebar/SidebarLink.vue";
export { default as NSidebarSection } from "./blueprints/sidebar/SidebarSection.vue";
export { default as NSkeleton } from "./blueprints/skeleton/Skeleton.vue";
export { default as NSlider } from "./blueprints/slider/Slider.vue";
export { default as NSpinner } from "./blueprints/spinner/Spinner.vue";
export { default as NStepper } from "./blueprints/stepper/Stepper.vue";
export type { StepperItem } from "./blueprints/stepper/Stepper.vue";
export { default as NSwitch } from "./blueprints/switch/Switch.vue";
export { default as NTable } from "./blueprints/table/Table.vue";
export type { TableColumn, TableColumnAlign } from "./blueprints/table/Table.vue";
export { default as NTabs } from "./blueprints/tabs/Tabs.vue";
export { default as NTagsInput } from "./blueprints/tags-input/TagsInput.vue";
export type { TabsItem } from "./blueprints/tabs/Tabs.vue";
export { default as NTextarea } from "./blueprints/textarea/Textarea.vue";
export { default as NTimeField } from "./blueprints/time-field/TimeField.vue";
export { default as NToolbar } from "./blueprints/toolbar/Toolbar.vue";
export type { ToolbarItem } from "./blueprints/toolbar/Toolbar.vue";
export { default as NToast } from "./blueprints/toast/Toast.vue";
export { default as NToggle } from "./blueprints/toggle/Toggle.vue";
export { default as NToggleGroup } from "./blueprints/toggle-group/ToggleGroup.vue";
export { default as NTree } from "./blueprints/tree/Tree.vue";
export type { TreeNode } from "./blueprints/tree/Tree.vue";
export type {
  ToggleGroupItem,
  ToggleGroupValue,
} from "./blueprints/toggle-group/ToggleGroup.vue";
export { default as NTooltip } from "./blueprints/tooltip/Tooltip.vue";
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
