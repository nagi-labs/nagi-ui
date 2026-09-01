import { defineRequirementSet } from "../definition.ts"

/** Shared observable guarantees for components backed by HTML Popover. */
export const nagiPopupRequirementsV1 = defineRequirementSet({
  id: "nagi/popup",
  title: "Nagi native Popup requirements",
  version: "1",
  profile: {
    invocation: ["native-target", "behavior-imperative"],
    focus: ["unmanaged", "input-retained", "menu-managed", "calendar-managed"],
    dismissal: ["auto"],
  },
  references: [
    {
      id: "html-popover-ls",
      title: "HTML Living Standard — The popover attribute",
      url: "https://html.spec.whatwg.org/multipage/popover.html#the-popover-attribute",
      kind: "living-standard",
      revision: "Living Standard snapshot",
      reviewedAt: "2026-09-01",
    },
  ],
  requirements: [
    {
      id: "SEM-01",
      section: "semantics",
      classification: "conformant",
      text: "The popup surface is an element with the native `popover` attribute; Nagi does not imitate top-layer state with a teleported or ARIA-only surface.",
      referenceIds: ["html-popover-ls"],
    },
    {
      id: "STATE-01",
      section: "state",
      classification: "intentional-extension",
      text: "Native toggle state is mirrored into the component's open model, and accepted model writes are applied to the locally registered popup surface.",
      referenceIds: ["html-popover-ls"],
      policy: { name: "native-popup-model-sync", version: "1" },
    },
    {
      id: "INT-01",
      section: "interaction",
      classification: "conformant",
      text: "Escape and light dismissal use native auto-popover behavior.",
      referenceIds: ["html-popover-ls"],
    },
  ],
} as const)
