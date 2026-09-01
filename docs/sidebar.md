# Sidebar

Use Sidebar for persistent, read-and-navigate application or documentation
navigation. It deliberately preserves ordinary complementary and navigation
landmarks instead of adopting menu, tree, or disclosure behavior.

```vue
<script setup lang="ts">
import {
  NSidebar,
  NSidebarLink,
  NSidebarSection,
} from "@nagi-labs/nagi-ui/components"
</script>

<template>
  <n-sidebar label="Workspace navigation">
    <n-sidebar-section label="Workspace">
      <n-sidebar-link href="/dashboard" current>Dashboard</n-sidebar-link>
      <n-sidebar-link href="/customers">Customers</n-sidebar-link>
    </n-sidebar-section>
  </n-sidebar>
</template>
```

`SidebarLink` renders a real anchor. Router integrations should provide a real
`href` and may provide `navigate` to intercept an unmodified primary click for
client-side routing. Modified clicks, non-self targets, downloads, and
JavaScript-free navigation stay native.
Set `current` only for the page represented by the current URL; it emits
`aria-current="page"`.

Sidebar owns spacing, surface, current-link presentation, and the visible
section-heading relationship. The application still owns placement, width,
responsive drawer behavior, authorization, and route matching.

Do not use Sidebar for expandable submenus or composite keyboard navigation.
Use NavigationMenu for popup site navigation and Tree for a hierarchical
interactive collection. A plain list of persistent destinations should remain
a Sidebar.
