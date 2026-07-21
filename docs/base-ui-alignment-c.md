# Base UI alignment C — Toast infrastructure

Status: Complete (2026-07-21).

## Outcome

Alignment C turns Toast from a message-only component into an explicit
notification manager without importing Base UI's Provider, Portal, compound
parts, swipe runtime, or implicit global state.

```vue
<script setup lang="ts">
import { createToastManager } from "@nagi-labs/nagi-ui"
import { Toast } from "@nagi-labs/nagi-ui/components"

const notifications = createToastManager({ duration: 5000, limit: 3 })

function save() {
  notifications.add({
    id: "profile-save",
    title: "Saved",
    description: "Your profile is up to date.",
    tone: "success",
    action: {
      label: "Undo",
      onClick(id) {
        undoSave()
        notifications.close(id)
      },
    },
  })
}
</script>

<template>
  <button type="button" @click="save">Save</button>
  <Toast :manager="notifications" />
</template>
```

The manager is deliberately passed as an ordinary prop. There is no mandatory
provider, `provide`/`inject` graph, hidden singleton, or Teleport. Applications
may create a long-lived module export when notifications must be fired outside
a component, but that ownership remains explicit. `useToast()` is the
setup-scoped DOM binding; code outside Vue setup uses only the manager.

## Manager contract

`createToastManager()` owns queue state and timers without reading `document`:

- `add(options)` returns a string id;
- adding an existing explicit id updates it in place, preserves ordering and
  refreshes its timer; this caller-controlled upsert is the deduplication
  contract;
- `update(id, patch)` never recreates a notification that was closed;
- `close(id)` closes one item and `close()` closes all;
- `promise(source, states)` updates one item from loading to success/error and
  returns a Promise with the source resolution or rejection when the state
  formatter completes normally. Formatter exceptions reject that returned
  chain as programming errors. Each settled state replaces the loading
  presentation and restores the manager's default duration unless that state
  supplies its own duration;
- closing a pending promise notification prevents settlement from reopening it
  or overwriting a newer notification that reused its id;
- `limit` closes the oldest live notification. Nagi does not retain an inert
  animation stack or model ending states;
- `duration: 0` is persistent. Auto-dismiss pauses while the region is hovered,
  focused, or the document is hidden, then resumes from the remaining time.

One manager is rendered by one Toast Blueprint, and that manager prop remains
stable for the renderer's mounted lifetime. Multiple independent managers may
coexist; Toast regions are excluded from each other's top-layer re-promotion
logic, while plain `F6` cycles their open regions in document order. `Shift+F6`
is left to the browser.

## Content and announcement contract

Each item has at least a title or description and may add:

- `tone`: `neutral`, `accent`, `success`, `warning`, or `danger`;
- `priority`: `polite` or `assertive`;
- one fixed action `{ label, onClick }`;
- an individual duration.

Tone and announcement priority are independent. A danger-colored notification
is not automatically assertive, because urgency is a semantic decision rather
than a color decision.

The visual list remains inside a manual native popover. A separate visually
hidden announcement container stays outside that hidden popover and inserts a
keyed `role="status"` or `role="alert"` node containing only title and
description. Action and dismiss labels therefore do not become part of the
live announcement. In-place updates increment a revision key so repeated text
can be announced again.

## Keyboard and focus contract

- Creating a notification never moves focus. Ordinary updates preserve the
  current control; if an update removes that focused action, focus is repaired
  to the nearest remaining control.
- With live notifications, `F6` moves focus to the labelled notification
  region (`role="region"`, `aria-keyshortcuts="F6"`, `tabindex="-1"`).
- `Tab` follows ordinary DOM order through the newest notification's action
  and dismiss controls; focus is not trapped.
- Another `F6` advances through additional open notification regions, then
  returns focus to the external element active before entering them.
- Removing a focused item while others remain moves focus to the nearest
  remaining notification control rather than dropping it on `body`.

Native modal inertness is preserved. A Toast renderer outside an open modal
dialog may be visually re-promoted above its backdrop, but `F6` does not move
focus outside the modal, and its outside live nodes may be absent from the
accessibility tree. Any modal-time notification that must be announced or
operated by assistive technology must render its Toast Blueprint inside that
dialog. Nagi does not defeat native inertness with a portal or custom focus
runtime; axe and role queries cannot prove live announcement behavior through
an inert boundary.

## Deliberate omissions

Alignment C does not add swipe/drag dismissal, anchored notifications,
collapsed stack physics, arbitrary render/action props, JS exit orchestration,
Provider components, or a default global manager. Those features would either
inflate the stable schema or recreate the overlay runtime Nagi delegates to the
platform.

## Verification

The acceptance suite covers manager isolation, upsert/update, limit, timer
replacement and pause/resume, promise resolution/rejection, close-before-
settlement, structured SSR markup, polite/assertive announcements, F6 focus
entry/return, action focus, close-all, native dialog re-promotion and the modal
inert boundary. Opened states pass axe with no rule exclusions.

Final evidence: unit 137/137, browser + axe 59/59, TypeScript 7,
verified-bindings, theme parity, owned/consumer Nagi CSS and package tarball
contents are green.
