import { defineRequirementSet } from "../definition.ts"

/**
 * Nagi-owned snapshot of the native dialog boundary shared by Dialog and
 * AlertDialog. Role, description, modality, and dismissal choices remain
 * explicit adoption profiles because those two components do not make the
 * same product-level choices on top of the platform primitive.
 */
export const nagiDialogRequirementsV1 = defineRequirementSet({
  id: "nagi/dialog",
  title: "Nagi native Dialog requirements",
  version: "1",
  profile: {
    role: ["dialog", "alertdialog"],
    modality: ["modal-default", "modal-only"],
    description: ["optional-simple", "required-message"],
    dismissal: ["configurable", "close-request-only"],
  },
  references: [
    {
      id: "html-dialog-ls",
      title: "HTML Living Standard — The dialog element",
      url: "https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element",
      kind: "living-standard",
      revision: "Living Standard snapshot",
      reviewedAt: "2026-09-01",
    },
    {
      id: "apg-dialog-modal",
      title: "WAI-ARIA APG Dialog (Modal) Pattern",
      url: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
      kind: "pattern",
      revision: "Rolling guidance snapshot",
      reviewedAt: "2026-09-01",
    },
    {
      id: "apg-alert-dialog",
      title: "WAI-ARIA APG Alert and Message Dialogs Pattern",
      url: "https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/",
      kind: "pattern",
      revision: "Rolling guidance snapshot",
      reviewedAt: "2026-09-01",
    },
  ],
  requirements: [
    {
      id: "SEM-01",
      section: "semantics",
      classification: "conformant",
      text: "The surface is a native `dialog` exposing its adopted `dialog` or `alertdialog` role, with an accessible name supplied by a visible title.",
      referenceIds: ["html-dialog-ls", "apg-dialog-modal", "apg-alert-dialog"],
    },
    {
      id: "SEM-02",
      section: "semantics",
      classification: "conformant",
      text: "A concise description, when required or supplied by the adopted profile, is connected to visible message content with `aria-describedby`.",
      referenceIds: ["apg-dialog-modal", "apg-alert-dialog"],
    },
    {
      id: "SEM-03",
      section: "semantics",
      classification: "intentional-extension",
      text: "Native button invokers target the same-tree dialog through Invoker Commands where supported and a root-local fallback otherwise.",
      referenceIds: ["html-dialog-ls"],
      policy: { name: "native-dialog-local-invocation", version: "1" },
    },
    {
      id: "STATE-01",
      section: "state",
      classification: "intentional-extension",
      text: "Native close and toggle transitions mirror into the open model, and model writes are applied idempotently to the locally registered dialog surface.",
      referenceIds: ["html-dialog-ls"],
      policy: { name: "native-dialog-model-sync", version: "1" },
    },
    {
      id: "STATE-02",
      section: "state",
      classification: "conformant",
      text: "The adopted modality profile uses `showModal()` for modal state and `show()` only for an explicitly supported non-modal state; only modal state promises an inert outside page.",
      referenceIds: ["html-dialog-ls", "apg-dialog-modal"],
    },
    {
      id: "INT-01",
      section: "interaction",
      classification: "conformant",
      text: "Escape, visible close actions, and light dismissal follow the native dialog close-request behavior selected by the adopted dismissal profile.",
      referenceIds: ["html-dialog-ls", "apg-dialog-modal"],
    },
    {
      id: "FOCUS-01",
      section: "focus",
      classification: "conformant",
      text: "Opening in modal state moves focus inside the dialog and keeps sequential focus within it until the dialog closes.",
      referenceIds: ["html-dialog-ls", "apg-dialog-modal"],
    },
    {
      id: "FOCUS-02",
      section: "focus",
      classification: "conformant",
      text: "Closing restores focus to the connected invoking element when the workflow has not declared a different logical destination.",
      referenceIds: ["html-dialog-ls", "apg-dialog-modal"],
    },
  ],
} as const)

/**
 * Modal-only revision used by shipped Dialog-family Blueprints. The low-level
 * useDialog Behavior API may still implement non-modal or other native close
 * policies, but those choices do not claim this Blueprint Requirement set.
 */
export const nagiDialogRequirementsV2 = defineRequirementSet({
  ...nagiDialogRequirementsV1,
  version: "2",
  profile: {
    role: ["dialog", "alertdialog"],
    modality: ["modal-only"],
    description: ["optional-simple", "required-message"],
    dismissal: ["light-dismiss-any", "close-request-only"],
  },
  requirements: nagiDialogRequirementsV1.requirements.map((requirement) => {
    if (requirement.id === "STATE-02") {
      return {
        ...requirement,
        text: "The shipped component opens with `showModal()` and promises an inert outside page; non-modal `show()` is not part of this Requirement set.",
      }
    }
    if (requirement.id === "INT-01") {
      return {
        ...requirement,
        text: "Escape, visible close actions, and native light dismissal follow the fixed close policy selected by the adopted modal profile.",
      }
    }
    return requirement
  }),
} as const)
