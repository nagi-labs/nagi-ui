# Base UI alignment D1 — Tabs

Status: Implemented (2026-07-21).

Tabs is the first Alignment D vertical slice. It is intentionally independent
from Menu, Listbox and Disclosure: a tab set has its own roving-focus and
panel-selection contract, and Nagi does not inflate another composable with a
`mode="tabs"` branch.

The behavioral reference points are the current
[Base UI Tabs](https://base-ui.com/react/components/tabs) contract and the
[WAI-ARIA APG Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
Nagi translates their practical guarantees into native buttons, standard ARIA
attributes and caller-visible markup rather than a Root/List/Tab/Panel component
family.

## Shipped core contract

`useTabs<Item, Key>()` owns:

- controlled or uncontrolled selection with one enabled selected tab;
- a separate roving-focus key for manual activation;
- manual and automatic activation;
- horizontal and vertical keyboard navigation;
- RTL reversal for horizontal ArrowLeft/ArrowRight;
- disabled skipping, optional focus looping, Home and End;
- deterministic selection fallback after removal or disabling;
- DOM-focus repair when the focused tab is removed or disabled;
- stable tab/panel ids and bidirectional `aria-controls` /
  `aria-labelledby` relationships.

The returned `tablistProps`, `tabProps(item)` and `panelProps(item)` are spread
onto caller-owned elements. `tabProps` owns a real `type="button"`; disabled
state is the native `disabled` attribute, selection is `aria-selected`, and
panel visibility is native `hidden`. No `data-state` aliases are emitted.

The core defaults to manual activation. Automatic activation is appropriate
only when panels are already present and switch without noticeable latency.

Invalid controlled values are canonicalized into the controlled ref instead of
showing a fallback that disagrees with application state. The fallback is the
next enabled item at the removed/disabled index, then the preceding enabled
item, then `null` when no enabled tab remains.

## Package Blueprint

The package and ownership source are the same
`blueprints/tabs/Tabs.vue` file. Its API is deliberately small:

```vue
<script setup lang="ts">
import { ref } from "vue"
import { Tabs, type TabsItem } from "@nagi-labs/nagi-ui/components"

const selected = ref<string | null>("account")
const items: readonly TabsItem[] = [
  { key: "account", label: "Account", content: "Account preferences" },
  { key: "security", label: "Security" },
]
</script>

<template>
  <Tabs v-model:selected="selected" :items="items" label="Settings">
    <template #panel="{ item }">
      <div class="tabs-panel">
        <AccountSettings v-if="item.key === 'account'" />
        <SecuritySettings v-else />
      </div>
    </template>
  </Tabs>
</template>
```

- `items` is a flat Blueprint-local schema: `key`, `label`, optional
  `disabled`, and optional plain-text `content`.
- The component owns every tab button and tabpanel wrapper, including all
  behavior props and ARIA wiring.
- The single `panel` slot receives only the caller's original `item`. It never
  exposes `tabProps`, `panelProps`, selected state or activation functions.
- Without the slot, `item.content` is rendered as the plain-text fallback.
- Every panel stays mounted and inactive wrappers use `hidden`; this preserves
  local state and makes the Blueprint's default automatic activation instant.

This is a CHARTER §3.5 content slot, not behavior wiring. It avoids the usual
Tabs ownership cliff for rich application content without publishing compound
parts or a VNode/render-function schema.

## Verified integration

Tabs extends both Nagi verification layers:

- `eslint-plugin-nagi-ui/verified-bindings` fixes the valid targets and protects
  ids, roles, keyboard attributes and relationships from direct overrides.
- `verifyNagiDom()` checks the standard IDREF targets in the rendered graph.
  Roving-tabstop count, reciprocal panel identity and `hidden` visibility are
  asserted by the Tabs browser contract rather than globally imposed on every
  `role="tablist"` in an application. This avoids false positives when Nagi is
  mixed with another valid Tabs implementation that uses `aria-disabled` or a
  different panel-hiding technique.

The Nagi CSS preset declares `.tabs` as the package boundary and `panel` as the
single `.tabs-panel` consumer sub-surface. The Blueprint uses only existing
semantic theme tokens; no Tabs-specific token language was added.

## Deliberate omissions

- no Root/List/Tab/Panel component family or provide/inject registration;
- no `render`, `asChild`, link-shaped tabs, Portal or provider;
- no animated Indicator geometry, ResizeObserver or activation-direction data;
- no lazy/unmounted panel mode in the automatic Blueprint;
- no Delete, Shift+F10 or closable-document-tab behavior;
- no typeahead, event-cancellation framework or JS transition runtime.

Applications needing asynchronous/lazy panels should use manual activation or
own the Blueprint. Closable editor tabs are a separate product interaction, not
a prop added to this content-navigation primitive.

## SSR and hydration boundary

SSR includes the complete roles, ids, relationships, initial selected state and
`hidden` panels. Unlike Popover, Tabs has no native activation primitive, so
keyboard/click switching begins after hydration; no zero-JS interaction claim
is made.

## Verification

Final evidence: unit 155/155, browser + axe 69/69, TypeScript 7, SSR,
verified-bindings, runtime IDREF verification, theme parity,
owned-source and package-consumer Nagi CSS checks, and the packed npm tarball.

The browser run found one integration-only bug that a plain `Ref` unit fixture
did not expose: a Vue `defineModel` proxy can emit its fallback before the
parent prop is readable as the new value. Re-reading the model during dynamic
focus repair briefly chose the first tab, whose automatic focus then overwrote
the correct selection. `useTabs` now carries the fallback calculated from the
item snapshot through focus repair, and a delayed-model unit regression fixes
that distinction.

The package Blueprint also keeps a synchronously writable local selection
bridge around Vue's controlled model proxy. Canonicalization remains owned by
`useTabs`, so SSR uses the same next-enabled, then previous-enabled fallback as
direct core consumers instead of rendering an all-hidden frame until
hydration. In forced-colors mode, selected state remains a thicker border while
keyboard focus uses a separate system-color outline.
