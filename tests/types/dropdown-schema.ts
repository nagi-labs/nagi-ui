import {
  actionEntry,
  menuEntries,
  type DropdownMenuEntry,
  type DropdownMenuGroupChildNode,
  type DropdownMenuNode,
} from "../../packages/core/blueprints/menu/dropdown-schema.ts";

const noop = () => {};

// A full valid tree covering every node type.
const valid: readonly DropdownMenuNode[] = [
  {
    type: "group",
    key: "file",
    label: "File",
    items: [
      { type: "action", key: "duplicate", label: "Duplicate", shortcut: "⌘D", onSelect: noop },
      { type: "action", key: "delete", label: "Delete", variant: "danger", onSelect: noop },
    ],
  },
  { type: "separator", key: "s1" },
  { type: "checkbox", key: "toolbar", label: "Toolbar", checked: "mixed", onCheckedChange: noop },
  {
    type: "radio-group",
    key: "sort",
    value: "name",
    onValueChange: (value) => {
      const _value: string = value;
      void _value;
    },
    items: [{ key: "name", label: "Name" }],
  },
  {
    type: "submenu",
    key: "share",
    label: "Share",
    items: [{ type: "action", key: "copy", label: "Copy", onSelect: noop }],
  },
];

const entries: DropdownMenuEntry[] = menuEntries(valid);
void entries;

// Misspelled discriminant: the error points at `type`.
// @ts-expect-error "actoin" is not a DropdownMenuNode type
const misspelled: DropdownMenuNode = { type: "actoin", key: "x", label: "X", onSelect: noop };
void misspelled;

// Missing handler: the error names the absent property.
// @ts-expect-error an action node requires onSelect
const missingHandler: DropdownMenuNode = { type: "action", key: "x", label: "X" };
void missingHandler;

// Wrong checked payload: only boolean | "mixed" is allowed.
const wrongChecked: DropdownMenuNode = {
  type: "checkbox",
  key: "x",
  label: "X",
  // @ts-expect-error checked must be boolean | "mixed"
  checked: "yes",
  onCheckedChange: noop,
};
void wrongChecked;

// Groups do not nest.
const nestedGroup: readonly DropdownMenuGroupChildNode[] = [
  // @ts-expect-error a group cannot contain another group
  { type: "group", key: "inner", items: [] },
];
void nestedGroup;

// Variant is a closed vocabulary.
const wrongVariant: DropdownMenuNode = {
  type: "action",
  key: "x",
  label: "X",
  // @ts-expect-error only "danger" exists
  variant: "primary",
  onSelect: noop,
};
void wrongVariant;

// Entry builders reject foreign node kinds.
// @ts-expect-error actionEntry only accepts action nodes
actionEntry({ type: "separator", key: "s" });
