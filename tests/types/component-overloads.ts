import { useDialog, useDisclosure, usePopover, useToggle, useTooltip } from "@nagi-labs/nagi-ui";
import { ref } from "vue";

const open = ref(false);
const pressed = ref(false);

// Existing low-level full-options and default forms stay public.
usePopover();
usePopover({ open, anchor: true });
useTooltip();
useTooltip({ open, openDelay: 0 });
useDialog();
useDialog({ open, modal: false });
useDisclosure();
useDisclosure({ open, name: "faq" });
useToggle();
useToggle({ pressed, disabled: false });

// Shipped SFCs use props + model. Common changes are named props.
usePopover({ area: "block-end", offset: 4 }, open);
useTooltip(
  { openDelay: 150, closeDelay: 0, disabled: false, area: "block-start", offset: 4 },
  open,
);
useDialog({ modal: true, closedby: "any" }, open);
useDisclosure({ name: "faq", disabled: false }, open);
useToggle({ disabled: false }, pressed);

// Component overloads deliberately have no third options path.
// @ts-expect-error use complete one-argument options for algorithm changes
usePopover({ area: "block-end", offset: 4 }, open, { id: "actions" });
useTooltip(
  { openDelay: 150, closeDelay: 0, disabled: false, area: "block-start", offset: 4 },
  open,
  // @ts-expect-error use complete one-argument options for algorithm changes
  { openDelay: 0 },
);
// @ts-expect-error use complete one-argument options for algorithm changes
useDialog({ modal: true, closedby: "any" }, open, { closedby: "none" });
// @ts-expect-error use complete one-argument options for algorithm changes
useDisclosure({ disabled: false }, open, { id: "faq" });
// Toggle's fixed third argument is native attrs, not an algorithm-options path.
useToggle({ disabled: false }, pressed, { "data-testid": "toggle" });
// @ts-expect-error component overload still has no algorithm-options argument
useToggle({ disabled: false }, pressed, {}, { disabled: true });
