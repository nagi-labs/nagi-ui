import type { ComponentDefinition } from "@nagi-labs/nagi-ui";
import { alertDialogDefinition } from "#nagi-blueprints/alert-dialog/alert-dialog.definition.ts";
import { buttonDefinition } from "#nagi-blueprints/button/button.definition.ts";
import { carouselDefinition } from "#nagi-blueprints/carousel/carousel.definition.ts";
import { comboboxDefinition } from "#nagi-blueprints/combobox/combobox.definition.ts";
import { datePickerDefinition } from "#nagi-blueprints/date-picker/date-picker.definition.ts";
import { dialogDefinition } from "#nagi-blueprints/dialog/dialog.definition.ts";
import { dropdownMenuDefinition } from "#nagi-blueprints/menu/dropdown-menu.definition.ts";
import { listboxDefinition } from "#nagi-blueprints/listbox/listbox.definition.ts";
import { popoverDefinition } from "#nagi-blueprints/popover/popover.definition.ts";

/**
 * Definitions are authored per component and owned with the source, so the docs
 * read the shipped declaration rather than restating it. Components without a
 * Definition are published as WIP instead of silently omitting their status.
 */
const definitions: Record<string, ComponentDefinition> = {
  AlertDialog: alertDialogDefinition,
  Button: buttonDefinition,
  Carousel: carouselDefinition,
  Combobox: comboboxDefinition,
  DatePicker: datePickerDefinition,
  Dialog: dialogDefinition,
  DropdownMenu: dropdownMenuDefinition,
  Listbox: listboxDefinition,
  Popover: popoverDefinition,
};

export function componentDefinition(name: string): ComponentDefinition | undefined {
  return definitions[name];
}

export function componentDefinitionStatus(name: string): "verified" | "wip" {
  return definitions[name]?.status === "verified" ? "verified" : "wip";
}
