import { componentDocuments } from "./components";

const targets: Readonly<Record<string, string>> = {
  Accordion: "root <div>; item <details> behavior is component-owned",
  Alert: "root <section>",
  AlertDialog: "root wrapper; trigger and <dialog> use their explicit props",
  Autocomplete: "root and text <input>, selected by explicit attribute props",
  Avatar: "root <span>",
  Badge: "root <span>",
  Breadcrumb: "root <nav>",
  Button: "native <button>",
  ButtonGroup: "root group <div>",
  Calendar: "calendar grid and hidden form control, selected by explicit props",
  Card: "root <div>",
  Carousel: "root <section>; controls and slides are component-owned",
  Checkbox: "native checkbox <input>",
  Combobox: "root, text input, and hidden form control, selected by explicit props",
  ContextMenu: "target wrapper; popup and items are component-owned",
  DateField: "segmented field and hidden form control, selected by explicit props",
  DatePicker: "field, trigger, dialog, and hidden form control, selected by explicit props",
  DateRangePicker: "fields, dialog, and hidden form controls, selected by explicit props",
  Dialog: "root wrapper; trigger and <dialog> use their explicit props",
  Disclosure: "native <details>",
  DropdownMenu: "root wrapper; trigger, menu, and items use explicit props",
  EmptyState: "root <div>",
  Fieldset: "native <fieldset>",
  FileInput: "native file <input>",
  Input: "native <input>",
  InputGroup: "root frame <div>",
  Kbd: "native <kbd>",
  Listbox: "root listbox; options are component-owned",
  Menubar: "root and menubar, selected by explicit props",
  Meter: "native <meter>",
  MultiSelect: "root, text input, and hidden controls, selected by explicit props",
  NavigationMenu: "root <nav>; triggers and panels are component-owned",
  NumberField: "native number <input>; step buttons are component-owned",
  OTPField: "root field and native input, selected by explicit props",
  Pagination: "root <nav>; items render native links, buttons, or spans",
  Popover: "root wrapper; trigger and popover use explicit props",
  PreviewCard: "root wrapper and native trigger link, selected by explicit props",
  Progress: "native <progress>",
  Radio: "native radio <input>",
  RangeCalendar: "range grid and hidden controls, selected by explicit props",
  RangeSlider: "the two native range <input> elements",
  Rating: "native <fieldset> and radio inputs",
  Resizable: "root layout <div>",
  Select: "native <select>",
  Separator: "root separator <div>",
  Sidebar: "root <aside> and contained navigation landmark",
  SidebarLink: "native <a>",
  SidebarSection: "root <section>",
  Skeleton: "root <span>",
  Slider: "native range <input>",
  Spinner: "root <span>",
  Stepper: "root <nav>; step buttons are component-owned",
  Switch: "native checkbox <input>",
  Table: "horizontal-overflow root <div>; table parts remain native",
  Tabs: "root, tablist, tabs, and panels, selected by explicit props",
  TagsInput: "root, text input, and hidden controls, selected by explicit props",
  Textarea: "native <textarea>",
  TimeField: "segmented field and hidden form control, selected by explicit props",
  Toast: "toast region; individual notifications are manager-owned",
  Toggle: "native <button>",
  ToggleGroup: "root group; item buttons are component-owned",
  Toolbar: "root toolbar; item links and buttons are component-owned",
  Tooltip: "root wrapper; trigger and tooltip use explicit props",
  Tree: "root tree; branches and treeitems are component-owned",
};

const missing = componentDocuments.filter((component) => !Object.hasOwn(targets, component.name));
const unknown = Object.keys(targets).filter(
  (name) => !componentDocuments.some((component) => component.name === name),
);
if (missing.length || unknown.length || Object.keys(targets).length !== componentDocuments.length) {
  throw new Error(
    `Native target coverage is invalid. Missing: ${missing.map((item) => item.name).join(", ") || "none"}. Unknown: ${unknown.join(", ") || "none"}.`,
  );
}

export function componentNativeTarget(name: string) {
  const target = targets[name];
  if (!target) throw new Error(`No native attribute target registered for ${name}`);
  return target;
}
