# Expanded overlay state-machine redesign

Status: Implemented, independently approved, and shipped (2026-07-23). This
document supersedes the incremental overlay behavior from the original
expanded-catalog candidate.

## Why this redesign exists

ContextMenu, Menubar, and NavigationMenu all use native Popover, but they do
not share the same interaction state:

- ContextMenu has an invocation origin: pointer coordinates or a focused
  element.
- Menubar has horizontal trigger focus plus one popup owner and delegates the
  popup's vertical behavior to Menu.
- NavigationMenu has ordinary links plus an optional disclosure owner. Hover,
  focus, and activation are different causes for the same panel.

The first implementation mixed these facts with the controlled `open` model
and repaired individual event-order failures with flags. The redesign keeps
four channels separate.

| Channel | Owner | Rule |
| --- | --- | --- |
| requested visibility | interaction | A request may be rejected; it never proves that the surface opened. |
| actual visibility | controlled model + native Popover mirror | `open` is the only Vue source of truth. UA state is reconciled by `usePopover`. |
| pending invocation intent | component state machine | Coordinates, requested owner, and cause may exist while closed, but are not rendered as committed state. |
| committed session | component state machine | Origin/owner/cause are committed only after `open === true` and retained until `open === false`. |

## Shared invariants

1. A rejected model write cannot clear user input, move physical scroll,
   change the committed overlay owner, or move DOM focus.
2. Opening commits pending intent only after the controlled model confirms
   `true`. External open with no pending intent uses a documented deterministic
   fallback.
3. Closing clears session state and restores focus only after the controlled
   model confirms `false`. A rejected close leaves the open surface fully
   operable.
4. Dynamic removal repairs the committed owner and DOM focus from one item
   snapshot. It does not independently patch several keys.
5. Native Popover owns top-layer visibility and light dismiss. `usePopover`
   alone mirrors UA transitions and reapplies a rejected controlled value.
   A popup may intercept Escape only when it must record a restore owner before
   asking the same model to close.
6. Positioning uses CSS Anchor Positioning with the existing Floating UI
   fallback. Context coordinates use a virtual anchor with the same
   flip/shift/auto-update policy; raw fixed `left/top` is not a separate
   positioning system.
7. Menu links remain real anchors and own actual DOM focus. Enter is a trusted
   event on that rendered anchor; core stops only nested-menu propagation and
   never cancels, redispatches, clones, or manually navigates it. The browser
   therefore owns modifier behavior, application interception, analytics,
   `href`, `target`, `rel`, and `download`.
8. Model settlement is one fixed mechanism. Components do not each invent a
   different `nextTick()` rollback protocol.

## ContextMenu

### Public contract

- Pointer and keyboard context-menu events establish an invocation origin.
- External `open=true` has no coordinates, so it anchors to the registered
  context region and restores focus to the focused descendant, falling back to
  the region itself.
- Every new open session recomputes its origin. Coordinates never survive a
  closed session.
- The external/focused-element fallback follows that element while open;
  pointer-origin coordinates remain the fixed invocation point.

### States

| State | Meaning | Allowed transitions |
| --- | --- | --- |
| `closed` | no session or press | context event → `opening`; touch down → `pressing`; external true → `open` with fallback |
| `pressing` | one touch pointer and one timer | move/cancel/up before threshold → `closed`; threshold → `opening-longpress` |
| `opening` | pending origin, open requested | confirmed true → `open`; rejected write → `closed` |
| `opening-longpress` | recognized touch plus pending origin | confirmed true → `open-awaiting-release`; rejected write/cancel → `closed` |
| `open-awaiting-release` | menu visible while original touch remains down | pointerup → `open` and suppress exactly its derived click; confirmed/external false → `closed` and release cannot reopen |
| `open` | committed origin and restore target | confirmed false → `closed`; another context event → a new committed session |

Timers and click suppression belong to this single state, and unmount cancels
the state once. Popup events are outside the context-event region.

## Menubar

### State

- `focusedMenuKey`: roving top-level focus; meaningful while open or closed.
- `pendingMenuKey`: owner requested by click/key/pointer switching while a
  closed popup is opening.
- `openMenuKey`: committed owner; non-null only while `open === true`.
- `restoreMenuKey`: set only for a close path that requires trigger focus.

### Transitions

| Event | Closed | Open |
| --- | --- | --- |
| trigger focus | update focused key | update focused key only |
| Enter/Space/ArrowDown/ArrowUp | request open for focused key and boundary | keep owner; move within Menu as applicable |
| horizontal arrow | move trigger focus | switch committed owner and re-anchor; popup Menu selects its boundary |
| pointer move over enabled trigger | focus policy only | switch committed owner and re-anchor |
| Escape | no-op | request close with restore key |
| Tab | native focus traversal | request close without restoration |
| owner removal | repair focused DOM target | choose one surviving owner and re-anchor, or request close |
| external open | choose focused/first enabled owner | no change |

Popup vertical movement, typeahead, action activation, Tab, and submenu rules
remain delegated to `useMenu`; Menubar does not duplicate that state machine.

## NavigationMenu

NavigationMenu is disclosure navigation, never a Menu. Direct links remain
ordinary anchors.

### Session

- `pendingItemKey`: requested panel while closed.
- `openItemKey`: committed panel owner while open.
- `cause`: `hover | focus | activation | external` for the committed owner.
- `pointerPreviewKey` and `focusPreviewKey`: independent transient owners. An
  exit reconciles to the still-present owner instead of closing the other
  interaction channel.
- one close intent/timer owned by the session, canceled by re-entry.

### Activation rule

Pointer hover or focus may preview a panel. The first click/tap on that same
preview promotes the cause to `activation` and keeps it open. A later
click/tap on an activation-owned panel requests close. This rule avoids both
the pointerenter/focus-before-click race and a permanently non-toggleable
button. Touch pointerenter is ignored.

Pointer exit does not close a focus-owned preview, focus exit does not close a
pointer-owned preview, and neither exit closes an activation/external-owned
panel. Escape inside panel content requests close with trigger restoration.
Panel links remain real anchors, accept the setup adapter's `navigate` and
`prefetch` callbacks, and close an unmodified activation after its native or
router action is chosen.

External open chooses the first panel item. Dynamic removal chooses one
surviving panel or closes. Positioning always follows the committed owner.

## Controlled model settlement

The implementation exposes one fixed scalar/identity model-write helper
from `model-sync.ts`. It performs a write, waits for Vue's model echo, and
reports whether the requested identity became authoritative. Component state
machines may then commit or discard pending intent. Collection components use
the same rule with a component-specific equality function beside their model
semantics; DOM rollback remains a fixed mechanism, not renderer policy.

Native Popover is the exception because it mirrors an actual UA state. Its
bidirectional synchronization stays entirely inside `usePopover` per
CHARTER §4.4. Hydrated Menubar and NavigationMenu triggers prevent the invoker
default and let `usePopover` apply only the model-confirmed transition; their
standard invoker attributes remain useful to SSR and progressive enhancement.

## Shipped gate

- transition-table unit tests, including every rejected open/close edge;
- real-browser pointer, keyboard, touch, light-dismiss, external-open, dynamic
  removal, link interception, target, and focus restoration paths;
- anchor movement, viewport collision, resize, scroll, RTL, and unmount;
- final-DOM assertions and axe in every open state;
- public component schema and negative type tests;
- a new independent read-only audit against this document and the Charter.

All gates passed on 2026-07-23. The fourth independent audit reported
`APPROVE Shipped` with no Blocking, High, or Medium findings.
