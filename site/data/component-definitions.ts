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
import { toastDefinition } from "#nagi-blueprints/toast/toast.definition.ts";
import generatedDefinitionTests from "./generated/definition-tests.json";

export type DefinitionTestLayer = "component-contract" | "implementation";
export type DefinitionTestSection =
  | "semantics"
  | "state"
  | "interaction"
  | "focus"
  | "anatomy"
  | "style";

export interface GeneratedDefinitionTests {
  status: "passing" | "failed";
  componentContract: {
    id: string;
    revision: string;
  };
  implementations: readonly {
    id: string;
    version: string;
  }[];
  references: readonly {
    layer: DefinitionTestLayer;
    implementation?: {
      id: string;
      version: string;
    };
    url: string;
  }[];
  requirements: readonly {
    key: string;
    layer: DefinitionTestLayer;
    sections: readonly DefinitionTestSection[];
    title: string;
    runner: string;
    evidence: readonly {
      fixture: string;
      fixtureKind: "package" | "owned";
      source: string;
      status: "passed" | "failed";
    }[];
  }[];
}

export type DefinitionEvidenceStatus = "passed" | "failed" | "not-collected";
export type DefinitionAuditStatus = "ready" | "wip";

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
  Toast: toastDefinition,
};

export function componentDefinition(name: string): ComponentDefinition | undefined {
  return definitions[name];
}

/** Runner-native registrations projected into migrated Definition pages. */
export function componentDefinitionTests(name: string): GeneratedDefinitionTests | undefined {
  return (generatedDefinitionTests.components as Record<string, GeneratedDefinitionTests>)[name];
}

/** Result of the currently collected browser evidence, not overall Definition maturity. */
export function componentDefinitionEvidenceStatus(name: string): DefinitionEvidenceStatus {
  const tests = componentDefinitionTests(name);
  const definition = componentDefinition(name);
  if (!tests) return "not-collected";
  if (!definition?.contract) return "failed";
  if (
    tests.componentContract.id !== definition.contract.id ||
    tests.componentContract.revision !== definition.contract.revision
  ) {
    return "failed";
  }
  const standardImplementation = definition.implementation;
  if (
    standardImplementation &&
    !tests.implementations.some(
      ({ id, version }) =>
        id === standardImplementation.id && version === standardImplementation.version,
    )
  ) {
    return "failed";
  }
  return tests.status === "passing" ? "passed" : "failed";
}

/** Contract-boundary audit state. Passing browser evidence alone never makes this ready. */
export function componentDefinitionAuditStatus(name: string): DefinitionAuditStatus {
  const definition = componentDefinition(name);
  return definition?.status === "verified" && componentDefinitionEvidenceStatus(name) === "passed"
    ? "ready"
    : "wip";
}
