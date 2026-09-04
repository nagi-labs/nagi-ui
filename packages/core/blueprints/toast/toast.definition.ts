import {
  defineComponentContract,
  defineComponentDefinition,
  defineComponentImplementation,
} from "@nagi-labs/nagi-ui";

export const toastContract = defineComponentContract({
  id: "nagi/toast",
  revision: "1",
  description:
    "Notification announcements, manager state, actions, keyboard access, timer policy, and focus continuity independent of visual presence and stacking implementation.",
  api: [
    { name: "manager", kind: "prop", description: "Connects one explicit notification owner." },
    { name: "duration", kind: "prop", description: "Sets the default auto-dismiss delay." },
    { name: "limit", kind: "prop", description: "Limits the number of live notifications." },
    {
      name: "label",
      kind: "prop",
      description: "Names the keyboard-reachable notification region.",
    },
    { name: "dismissLabel", kind: "prop", description: "Names each visible dismiss action." },
    { name: "add", kind: "method", description: "Adds or upserts a structured notification." },
    { name: "update", kind: "method", description: "Updates an existing live notification." },
    { name: "close", kind: "method", description: "Closes one or all live notifications." },
    {
      name: "promise",
      kind: "method",
      description: "Updates one notification across promise states.",
    },
  ],
  parts: [
    { name: "region", description: "The named keyboard destination for visible notifications." },
    { name: "notification", description: "One visible notification.", multiple: true },
    {
      name: "announcement",
      description: "The live-region representation of a notification.",
      multiple: true,
    },
    {
      name: "action",
      description: "An optional application action.",
      required: false,
      multiple: true,
    },
    { name: "dismiss", description: "The action that closes a notification.", multiple: true },
  ],
  references: [
    {
      id: "wai-aria-status-1.2",
      title: "WAI-ARIA 1.2 — status role",
      url: "https://www.w3.org/TR/wai-aria-1.2/#status",
      kind: "standard",
      revision: "1.2 Recommendation (2023-06-06)",
      reviewedAt: "2026-09-02",
    },
    {
      id: "wai-aria-alert-1.2",
      title: "WAI-ARIA 1.2 — alert role",
      url: "https://www.w3.org/TR/wai-aria-1.2/#alert",
      kind: "standard",
      revision: "1.2 Recommendation (2023-06-06)",
      reviewedAt: "2026-09-02",
    },
    {
      id: "base-ui-toast",
      title: "Base UI Toast",
      url: "https://base-ui.com/react/components/toast",
      kind: "example",
      revision: "Rolling documentation snapshot",
      reviewedAt: "2026-09-02",
    },
  ],
  semantics: [
    {
      id: "TST-SEM-01",
      classification: "conformant",
      source: "WAI-ARIA status and alert roles",
      text: "Polite notifications are announced through an atomic status; urgent notifications use an atomic alert. Updating a notification produces a new announcement without duplicating its visible controls.",
      evidence: ["tests/browser/catalog.spec.ts"],
      origin: {
        kind: "reference",
        referenceIds: ["wai-aria-status-1.2", "wai-aria-alert-1.2"],
      },
    },
    {
      id: "TST-SEM-02",
      classification: "intentional-extension",
      source: "Base UI Toast keyboard-region precedent and Nagi naming policy",
      text: "Visible notifications are exposed in a named region with an F6 shortcut; optional application actions and every dismiss action are native named buttons.",
      evidence: ["tests/browser/catalog.spec.ts"],
      origin: { kind: "nagi", policy: "named-toast-region-and-actions", policyVersion: "1" },
    },
  ],
  state: [
    {
      id: "TST-STATE-01",
      classification: "intentional-extension",
      source: "Nagi explicit Toast manager policy",
      text: "One explicit manager owns add, update, upsert, close, promise replacement, and live-item limit state without a hidden singleton.",
      evidence: ["tests/toast.test.ts"],
      origin: { kind: "nagi", policy: "explicit-toast-manager", policyVersion: "1" },
    },
    {
      id: "TST-STATE-02",
      classification: "intentional-extension",
      source: "Nagi interruption-safe timer policy",
      text: "Auto-dismiss timers retain their remaining duration while pointer or keyboard attention is inside the notification region and resume afterward.",
      evidence: ["tests/toast.test.ts", "tests/browser/catalog.spec.ts"],
      origin: { kind: "nagi", policy: "attention-paused-toast-timers", policyVersion: "1" },
    },
  ],
  interaction: [
    {
      id: "TST-INT-01",
      classification: "intentional-extension",
      source: "Nagi structured notification action policy",
      text: "A notification may run one structured application action and may always be dismissed without activating another notification.",
      evidence: ["tests/browser/catalog.spec.ts"],
      origin: { kind: "nagi", policy: "structured-toast-actions", policyVersion: "1" },
    },
    {
      id: "TST-INT-02",
      classification: "intentional-extension",
      source: "Base UI Toast F6 precedent and Nagi multi-region routing policy",
      text: "F6 cycles through open notification regions and then returns to the external focus origin; Shift+F6 does not enter the region.",
      evidence: ["tests/browser/catalog.spec.ts"],
      origin: { kind: "nagi", policy: "toast-f6-routing", policyVersion: "1" },
    },
  ],
  focus: [
    {
      id: "TST-FOCUS-01",
      classification: "intentional-extension",
      source: "Nagi non-interrupting notification focus policy",
      text: "Adding a notification never steals focus. When focused notification content disappears, focus moves to a remaining notification action or returns to the external origin.",
      evidence: ["tests/browser/catalog.spec.ts"],
      origin: { kind: "nagi", policy: "toast-focus-continuity", policyVersion: "1" },
    },
  ],
});

export const manualPopoverToastImplementation = defineComponentImplementation({
  id: "nagi/blueprint/toast-manual-popover",
  title: "Manual-popover Toast Blueprint",
  version: "1",
  strategy: "platform-first",
  description:
    "The standard Blueprint renders visible notifications in one native manual popover and removes list items when the manager closes them.",
  references: [
    {
      id: "html-popover-ls",
      title: "HTML Living Standard — The popover attribute",
      url: "https://html.spec.whatwg.org/multipage/popover.html#the-popover-attribute",
      kind: "living-standard",
      revision: "Living Standard snapshot",
      reviewedAt: "2026-09-02",
    },
  ],
  decisions: [
    {
      name: "layer",
      value: "manual-popover",
      description: "Use one native manual popover as the visible notification region.",
      evidence: ["tests/component-catalog.test.ts", "tests/browser/toast.spec.ts"],
    },
    {
      name: "presence",
      value: "vue-list-immediate",
      description:
        "Remove a visible item when it leaves the manager collection; no exit runtime owns it.",
      evidence: ["tests/browser/catalog.spec.ts"],
    },
    {
      name: "announcement",
      value: "separate-live-region",
      description: "Keep assistive announcements separate from visible interactive items.",
      evidence: ["tests/component-catalog.test.ts", "tests/browser/catalog.spec.ts"],
    },
    {
      name: "focus-repair",
      value: "scoped-item-marker",
      description: "Resolve only notification items in this renderer when repairing removed focus.",
      evidence: ["tests/browser/catalog.spec.ts"],
    },
  ],
  semantics: [
    {
      id: "TST-SEM-03",
      classification: "implementation-constraint",
      source: "Standard Toast Blueprint native-layer policy",
      text: "The visible notification region is a native manual popover in the top layer, independently named from its hidden live announcements.",
      evidence: ["tests/component-catalog.test.ts"],
      origin: { kind: "nagi", policy: "native-toast-layer", policyVersion: "1" },
    },
  ],
  state: [
    {
      id: "TST-STATE-03",
      classification: "implementation-constraint",
      source: "Standard Toast Blueprint top-layer coordination",
      text: "The region is shown while notifications are live, hidden when none remain, and re-promoted when a newly opened modal would otherwise cover it.",
      evidence: ["tests/browser/toast.spec.ts"],
      origin: { kind: "nagi", policy: "native-toast-top-layer-coordination", policyVersion: "1" },
    },
  ],
  focus: [
    {
      id: "TST-FOCUS-02",
      classification: "implementation-constraint",
      source: "Standard Toast Blueprint scoped focus repair",
      text: "Focused-item repair locates visible items through the Toast scope and item marker rather than a document-global selector.",
      evidence: ["tests/browser/catalog.spec.ts"],
      origin: { kind: "nagi", policy: "scoped-toast-focus-repair", policyVersion: "1" },
    },
  ],
  anatomy: [
    {
      id: "TST-ANAT-01",
      evidence: ["tests/browser/anatomy.spec.ts"],
      name: "root",
      description: "The owned renderer containing announcements and the visible region.",
      match: { by: "root" },
    },
    {
      id: "TST-ANAT-02",
      evidence: ["tests/browser/anatomy.spec.ts"],
      name: "region",
      description: "The named native manual-popover region receiving regionProps.",
      match: { by: "role", role: "region", nameFrom: "aria-label" },
      within: "root",
      contractPart: "region",
    },
    {
      id: "TST-ANAT-03",
      evidence: ["tests/browser/anatomy.spec.ts"],
      name: "item",
      description: "A repeated visible item used by focus repair.",
      match: { by: "part", scope: "toast", part: "item" },
      within: "region",
      multiple: true,
      contractPart: "notification",
    },
  ],
});

export { toastContract as nagiToastContract };

export const toastDefinition = defineComponentDefinition({
  name: "Toast",
  version: "1.0",
  status: "verified",
  contract: toastContract,
  implementation: manualPopoverToastImplementation,
});
