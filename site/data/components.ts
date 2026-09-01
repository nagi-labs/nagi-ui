export type ComponentCategory =
  | "Actions"
  | "Data display"
  | "Date and time"
  | "Feedback"
  | "Forms"
  | "Navigation"
  | "Overlays";

export interface ComponentDocument {
  name: string;
  slug: string;
  category: ComponentCategory;
  description: string;
  basicGuidance: string;
}

const descriptions: Record<ComponentCategory, string> = {
  Actions: "Interactive controls built on native buttons and familiar browser behavior.",
  "Data display": "Readable content and structured information with native semantics.",
  "Date and time": "Calendar and segmented date/time controls with form-compatible values.",
  Feedback: "Status, progress, loading, and notification patterns.",
  Forms: "Native form participation, validation, selection, and reset behavior.",
  Navigation: "Keyboard-aware navigation through content and application structure.",
  Overlays: "Top-layer and anchored interfaces using native dialog and popover behavior.",
};

const basicGuidance: Readonly<Record<string, string>> = {
  Button:
    "Use a Button for an action that changes the current interface or submits data. Use a link when the outcome is navigation.",
  ButtonGroup:
    "Group adjacent buttons only when they operate on the same object or workflow, and give the group a name that explains that shared purpose.",
  Toggle:
    "Use a Toggle for an action with a persistent pressed state, such as bold formatting; expose the accepted state through its model.",
  ToggleGroup:
    "Use a ToggleGroup for a small set of related view or formatting choices where one or several options can remain pressed.",
  Toolbar:
    "Use a Toolbar to collect frequently used controls for one work area and provide arrow-key movement between those controls.",
  Avatar:
    "Place an Avatar beside the person or entity it identifies, and always provide useful alternative text plus a fallback for failed images.",
  Badge:
    "Attach a Badge to the item whose status or category it summarizes; its tone should reinforce text, never replace it.",
  Card: "Use a Card to group one subject's summary and related actions. Keep heading, description, content, and footer about that same subject.",
  Carousel:
    "Use a Carousel for a short sequence users may browse in order. Give the collection a clear label and keep every slide understandable on its own.",
  EmptyState:
    "Show an EmptyState where content would normally appear, explain why it is empty, and offer the most useful next action when one exists.",
  Kbd: "Use Kbd inside instructions to identify a physical key or shortcut; it should accompany the action it performs rather than appear alone.",
  Meter:
    "Use a Meter for a known value within a meaningful range, such as quota usage. Use Progress when the value represents task completion.",
  Progress:
    "Use Progress while work is underway: provide a value when completion is measurable and omit it when duration is unknown.",
  Separator:
    "Use a horizontal Separator between meaningful content sections and a vertical Separator between adjacent control groups. Mark purely visual lines as decorative.",
  Skeleton:
    "Shape Skeleton placeholders like the content they temporarily replace, while keeping the surrounding layout stable during loading.",
  Spinner:
    "Place a Spinner beside the operation it represents and provide a status label when it is the only loading announcement.",
  Table:
    "Use a Table for records that users compare across consistent columns; provide a caption that identifies the dataset, even when visually hidden.",
  Calendar:
    "Use Calendar when choosing a date benefits from seeing its surrounding week or month, including unavailable and bounded dates.",
  DateField:
    "Use DateField for compact keyboard entry of a single date while retaining segmented editing, validation, and form-compatible output.",
  DatePicker:
    "Use DatePicker when users need both segmented date entry and an optional calendar popup for the same committed value.",
  DateRangePicker:
    "Use DateRangePicker for a bounded start-and-end period, and make unavailable dates and validation rules visible before submission.",
  RangeCalendar:
    "Use RangeCalendar when comparing dates visually is central to selecting a start and end date, such as a reporting period.",
  TimeField:
    "Use TimeField for segmented time entry; choose granularity and hour cycle to match the actual scheduling precision and locale.",
  Alert:
    "Place an Alert near the result or condition it explains. Reserve assertive announcement behavior for information requiring immediate attention.",
  Toast:
    "Use Toast for brief results that do not block the current task, and provide an action only when the user can usefully respond from the notification.",
  Autocomplete:
    "Use Autocomplete to suggest completions while preserving free-form text; use Combobox when selection must resolve to a known item.",
  Checkbox:
    "Use Checkbox for an independent boolean choice, or an indeterminate parent choice that summarizes a group of child selections.",
  Combobox:
    "Use Combobox to filter and select a known option while keyboard focus remains in the text input and selection stays explicit.",
  Fieldset:
    "Use Fieldset to give related form controls one legend, especially when individual labels do not explain the shared question.",
  FileInput:
    "Use FileInput when a form accepts local files, and state accepted types, multiplicity, and validation constraints before upload.",
  Input:
    "Use Input for a single line of text or another native input value, with a persistent label and the correct native type.",
  InputGroup:
    "Use InputGroup when a prefix, suffix, or adjacent action changes how one input value is interpreted; keep one visible label for the control.",
  Listbox:
    "Use Listbox when available options should remain visible for keyboard comparison and selection, including disabled choices.",
  MultiSelect:
    "Use MultiSelect for choosing several known items in limited space, with removable selections and a form-compatible submitted value.",
  NumberField:
    "Use NumberField for bounded numeric input where step controls are useful, while still allowing direct keyboard entry.",
  OTPField:
    "Use OTPField for a fixed-length verification code, not for passwords; let users paste the complete code and expose one meaningful label.",
  Radio:
    "Use Radio controls as a labelled group when exactly one option should be selected and every option benefits from remaining visible.",
  RangeSlider:
    "Use RangeSlider to choose lower and upper bounds from a continuous range when approximate spatial adjustment is useful.",
  Rating:
    "Use Rating for an ordered score with understandable labels for every value, and preserve an explicit empty state when no score is chosen.",
  Select:
    "Use Select for a compact native choice from known options when users do not need filtering or simultaneous option visibility.",
  Slider:
    "Use Slider for approximate adjustment within a known range; pair it with a visible value when precision matters.",
  Switch:
    "Use Switch for a setting that takes effect as soon as it changes. Use Checkbox when the value is collected for later submission.",
  TagsInput:
    "Use TagsInput to create and remove multiple short text values, with clear limits and validation for each committed tag.",
  Textarea:
    "Use Textarea for multi-line text, communicate any length limit, and keep the current character count available when the limit matters.",
  Accordion:
    "Use Accordion to let users reveal several related sections independently; keep essential information outside collapsed panels.",
  Breadcrumb:
    "Use Breadcrumb to show the current page's place in a hierarchy, ending with the current location rather than another link.",
  Disclosure:
    "Use Disclosure for optional supporting content controlled by one summary; do not hide information required to complete the primary task.",
  Menubar:
    "Use Menubar for persistent application commands organized into menus, not as ordinary site navigation.",
  NavigationMenu:
    "Use NavigationMenu for site destinations that benefit from grouped previews, while keeping direct destinations as ordinary links.",
  Pagination:
    "Use Pagination to navigate stable result pages, clearly identify the current page, and preserve link behavior where URLs exist.",
  Sidebar:
    "Use Sidebar as a labelled navigation region for a product area, grouping destinations into sections and reserving the footer for persistent context.",
  SidebarLink:
    "Use SidebarLink for one destination inside sidebar navigation and mark the current destination without disabling its link semantics.",
  SidebarSection:
    "Use SidebarSection to name a coherent group of sidebar destinations; avoid sections containing only one unrelated link.",
  Stepper:
    "Use Stepper to show progress through an ordered workflow, distinguishing the current step from completed and unavailable steps.",
  Tabs: "Use Tabs to switch among peer panels in the same context; each tab should have one corresponding panel and a stable label.",
  Tree: "Use Tree for hierarchical items that users expand, collapse, and select, such as files or nested categories.",
  AlertDialog:
    "Use AlertDialog only when a decision must interrupt the workflow, especially before a destructive or irreversible action.",
  ContextMenu:
    "Use ContextMenu for actions on a specific target through right-click or long-press, while keeping essential actions available elsewhere.",
  Dialog:
    "Use Dialog for a focused task that temporarily sits above the page, with a clear title, useful initial focus, and an obvious way to close it.",
  DropdownMenu:
    "Use DropdownMenu for a compact set of actions and choices triggered by a button; use links directly when navigation is the primary content.",
  Popover:
    "Use Popover for non-modal supporting content anchored to a trigger, where users can continue interacting with the surrounding page.",
  PreviewCard:
    "Use PreviewCard to supplement a link with a short preview after hover or focus; the link must remain understandable without the preview.",
  Resizable:
    "Use Resizable when users benefit from allocating space between two related panels, and preserve usable minimum sizes for both sides.",
  Tooltip:
    "Use Tooltip for brief supplementary text on hover or focus, never as the only source of a control's name or essential instructions.",
};

const groups: Record<ComponentCategory, readonly string[]> = {
  Actions: ["Button", "ButtonGroup", "Toggle", "ToggleGroup", "Toolbar"],
  "Data display": [
    "Avatar",
    "Badge",
    "Card",
    "Carousel",
    "EmptyState",
    "Kbd",
    "Meter",
    "Progress",
    "Separator",
    "Skeleton",
    "Spinner",
    "Table",
  ],
  "Date and time": [
    "Calendar",
    "DateField",
    "DatePicker",
    "DateRangePicker",
    "RangeCalendar",
    "TimeField",
  ],
  Feedback: ["Alert", "Toast"],
  Forms: [
    "Autocomplete",
    "Checkbox",
    "Combobox",
    "Fieldset",
    "FileInput",
    "Input",
    "InputGroup",
    "Listbox",
    "MultiSelect",
    "NumberField",
    "OTPField",
    "Radio",
    "RangeSlider",
    "Rating",
    "Select",
    "Slider",
    "Switch",
    "TagsInput",
    "Textarea",
  ],
  Navigation: [
    "Accordion",
    "Breadcrumb",
    "Disclosure",
    "Menubar",
    "NavigationMenu",
    "Pagination",
    "Sidebar",
    "SidebarLink",
    "SidebarSection",
    "Stepper",
    "Tabs",
    "Tree",
  ],
  Overlays: [
    "AlertDialog",
    "ContextMenu",
    "Dialog",
    "DropdownMenu",
    "Popover",
    "PreviewCard",
    "Resizable",
    "Tooltip",
  ],
};

function kebabCase(value: string) {
  return value
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

export const componentDocuments: readonly ComponentDocument[] = Object.entries(groups).flatMap(
  ([category, names]) =>
    names.map((name) => ({
      name,
      slug: kebabCase(name),
      category: category as ComponentCategory,
      description: descriptions[category as ComponentCategory],
      basicGuidance: basicGuidance[name] ?? "Usage guidance is under review.",
    })),
);

export const componentCategories = Object.keys(groups) as ComponentCategory[];

export function componentDocument(slug: string) {
  return componentDocuments.find((entry) => entry.slug === slug);
}
