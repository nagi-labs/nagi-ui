/**
 * Component layer entry (`@nagi-labs/nagi-ui/components`).
 *
 * Kept separate from `.` (the composable layer) so the core entry stays
 * loadable by plain Node and ships no CSS. The re-exported SFCs are the same
 * files the `own` workflow copies (single-source principle, CHARTER §3).
 */
export { default as Button } from "./blueprints/button/NagiButton.vue";
export { default as Combobox } from "./blueprints/combobox/Combobox.vue";
export type { ComboboxOption } from "./blueprints/combobox/Combobox.vue";
export { default as DropdownMenu } from "./blueprints/menu/DropdownMenu.vue";
export { default as Listbox } from "./blueprints/listbox/Listbox.vue";
export type { ListboxOption } from "./blueprints/listbox/Listbox.vue";
export type {
  DropdownMenuActionNode,
  DropdownMenuCheckboxNode,
  DropdownMenuGroupChildNode,
  DropdownMenuGroupNode,
  DropdownMenuNode,
  DropdownMenuRadioGroupNode,
  DropdownMenuRadioItem,
  DropdownMenuSeparatorNode,
  DropdownMenuSubmenuNode,
} from "./blueprints/menu/dropdown-schema.ts";
