# Vue Vapor compatibility

Assessed: 2026-08-29.

Current position, suitable for external communication:

> Nagi UI is architecturally Vapor-friendly, but Vapor compatibility is not yet
> tested or guaranteed.

## Why the architecture is Vapor-friendly

These properties follow directly from the visible-DOM-ownership charter:

- All Blueprints use ordinary `<script setup lang="ts">` and `<template>` —
  no render functions, JSX, `h()`, `createVNode()`, `cloneVNode()`, or manual
  `render()`.
- No direct dependence on `Teleport` or `Transition`.
- No access to renderer internals (`instance.proxy`, `instance.subTree`,
  `instance.vnode`).
- Models use `defineModel()` (40 Blueprints) rather than a custom
  controlled/uncontrolled VNode protocol.
- Complex composables release timers, listeners, and animation frames through
  `onBeforeUnmount()` / `onScopeDispose()`.
- `shallowRef` is used where deep proxying would be wrong (for example
  `@internationalized/date` class instances in Calendar); ordinary `ref`
  remains correct elsewhere.

## What is not yet in place

- Blueprints are compiled as ordinary VDOM components; nothing opts into Vapor
  compilation, and the repository pins Vue 3.5 with no 3.6 verification
  environment or Vapor CI.
- `getCurrentInstance()` appears in 27 composable files (setup detection,
  `useId()` eligibility, lifecycle registration). It touches no VNode
  internals, but it is a low-level API that must be proven on the Vapor
  runtime. Where possible, separate Vue-setup `useX()` from instance-free
  `createX()`.
- Reactive props destructuring is used in only 11 Blueprints; `defineSlots()`
  in one (Avatar). Neither blocks Vapor, but both are worth standardizing
  (Table, Tabs, Accordion, Dialog/AlertDialog, Card, InputGroup, DatePicker,
  and the Menu family are the slot-typing priorities).

## Conventions worth adopting in the charter

- New Blueprints default to reactive props destructuring.
- Public slots are typed with `defineSlots()`.
- `defineModel()` is the standard model API.
- No render functions, JSX, or VNode manipulation in ordinary Blueprints; no
  dependence on the public instance proxy; DOM structure stays in conventional
  templates.
- Timers, listeners, and animation frames are released on scope disposal or
  unmount.
- `shallowRef` only for external objects where deep reactivity is unnecessary
  or harmful; `toRef()` only when a composable genuinely needs a reactive prop
  connection.

## Verification roadmap

1. **Architecture test**: statically detect `h`, `createVNode`, `cloneVNode`,
   manual `render`, `instance.proxy`, `instance.subTree`, `instance.vnode`,
   and `$el`; audit (not ban) `getCurrentInstance()` usage.
2. **Compile representative components on Vue 3.6 Vapor**: Button (simple
   native control), Input (native form + attribute forwarding), Dialog
   (lifecycle + native top layer), Tabs (composite keyboard widget), Combobox
   (high-complexity composable).
3. **Vapor-specific tests**: SFC compile, typecheck, SSR/hydration, native form
   submit/reset, attribute forwarding, keyboard navigation, focus restoration,
   browser interaction, and confirming a pure Vapor app pulls in no VDOM
   runtime.
4. **Roll out** the same test matrix to all Blueprints after the
   representative components pass.

No large-scale VNode-dependency removal or rendering rewrite appears
necessary. The work is to add a Vue 3.6 verification environment, codify the
Vue-native conventions above, prove `getCurrentInstance()` usage on the Vapor
runtime, and keep compatibility continuously verified in CI.
