export const dateNavigationExamples: Record<string, string> = {
  Calendar: `<script setup lang="ts">
import { ref } from "vue"
import { NCalendar } from "@nagi-labs/nagi-ui/components"
const value = ref<string | null>("2026-08-18")
</script>
<template>
  <n-calendar v-model="value" label="Billing date" min="2026-08-01" max="2026-09-30" :unavailable-dates="['2026-08-21']" />
  <p>Selected: {{ value }}</p>
</template>`,

  DateField: `<script setup lang="ts">
import { ref } from "vue"
import { NDateField } from "@nagi-labs/nagi-ui/components"
const value = ref<string | null>("2026-08-18")
</script>
<template>
  <n-date-field v-model="value" label="Start date" min="2026-08-01" max="2026-09-30" />
  <n-date-field label="Invalid date" invalid validation-message="Enter a date in the reporting period." />
  <p>Value: {{ value }}</p>
</template>`,

  DatePicker: `<script setup lang="ts">
import { ref } from "vue"
import { NDatePicker } from "@nagi-labs/nagi-ui/components"
const value = ref<string | null>("2026-08-18")
const open = ref(false)
</script>
<template>
  <n-date-picker v-model="value" v-model:open="open" label="Start date" min="2026-08-01" max="2026-09-30" />
  <p>Selected: {{ value }} · {{ open ? "Open" : "Closed" }}</p>
</template>`,

  DateRangePicker: `<script setup lang="ts">
import { ref } from "vue"
import type { RangeCalendarValue } from "@nagi-labs/nagi-ui"
import { NDateRangePicker } from "@nagi-labs/nagi-ui/components"
const value = ref<RangeCalendarValue | null>({ start: "2026-08-11", end: "2026-08-18" })
const open = ref(false)
</script>
<template>
  <n-date-range-picker v-model="value" v-model:open="open" label="Reporting period" min="2026-08-01" max="2026-09-30" />
  <p>Range: {{ value?.start }} – {{ value?.end }} · {{ open ? "Open" : "Closed" }}</p>
</template>`,

  RangeCalendar: `<script setup lang="ts">
import { ref } from "vue"
import type { RangeCalendarValue } from "@nagi-labs/nagi-ui"
import { NRangeCalendar } from "@nagi-labs/nagi-ui/components"
const value = ref<RangeCalendarValue | null>({ start: "2026-08-11", end: "2026-08-18" })
</script>
<template>
  <n-range-calendar v-model="value" label="Reporting period" min="2026-08-01" max="2026-09-30" :unavailable-dates="['2026-08-21']" />
  <p>Range: {{ value?.start }} – {{ value?.end }}</p>
</template>`,

  TimeField: `<script setup lang="ts">
import { ref } from "vue"
import { NTimeField } from "@nagi-labs/nagi-ui/components"
const value = ref<string | null>("14:30:15")
</script>
<template>
  <n-time-field v-model="value" label="Meeting time" granularity="second" :hour-cycle="24" />
  <n-time-field label="Read-only time" model-value="09:00" read-only />
  <p>Value: {{ value }}</p>
</template>`,

  Accordion: `<script setup lang="ts">
import { ref } from "vue"
import { NAccordion, type AccordionItem } from "@nagi-labs/nagi-ui/components"
const items: readonly AccordionItem[] = [
  { key: "semantics", summary: "Native semantics", content: "Each item is a native details element." },
  { key: "ownership", summary: "Source ownership", content: "The Blueprint remains ordinary Vue." },
  { key: "disabled", summary: "Unavailable section", disabled: true },
]
const openKeys = ref<readonly string[]>(["semantics"])
</script>
<template>
  <n-accordion v-model:open-keys="openKeys" :items="items" multiple>
    <template #summary="{ item }">
      <strong>{{ item.summary }}</strong>
    </template>
    <template #panel="{ item }">
      <p>{{ item.content }}</p>
    </template>
  </n-accordion>
</template>`,

  Breadcrumb: `<script setup lang="ts">
import { NBreadcrumb, type BreadcrumbItem } from "@nagi-labs/nagi-ui/components"
const items: readonly BreadcrumbItem[] = [
  { key: "home", label: "Home", href: "#home" },
  { key: "customers", label: "Customers", href: "#customers" },
  { key: "acme", label: "Acme Systems" },
]
</script>
<template><n-breadcrumb :items="items" separator="→" /></template>`,

  Disclosure: `<script setup lang="ts">
import { ref } from "vue"
import { NDisclosure } from "@nagi-labs/nagi-ui/components"
const open = ref(true)
</script>
<template>
  <n-disclosure v-model:open="open" summary="Implementation details">
    <template #summary="{ summary }">
      <strong>{{ summary }}</strong>
    </template>
    <p>The content remains ordinary HTML inside native details.</p>
  </n-disclosure>
</template>`,

  Menubar: `<script setup lang="ts">
import { ref } from "vue"
import { NMenubar, type MenubarAction, type MenubarMenu } from "@nagi-labs/nagi-ui/components"
const menus: readonly MenubarMenu[] = [
  { key: "file", label: "File", items: [
    { key: "new", label: "New report" },
    { key: "docs", label: "Documentation", href: "#docs" },
    { key: "archive", label: "Archive", disabled: true },
  ] },
  { key: "edit", label: "Edit", items: [{ key: "rename", label: "Rename" }] },
]
const open = ref(false)
const selectedCommand = ref("No command selected")
function onSelect(item: MenubarAction) { selectedCommand.value = item.label }
</script>
<template>
  <n-menubar v-model:open="open" :items="menus" @select="onSelect" />
  <p>{{ selectedCommand }}</p>
</template>`,

  NavigationMenu: `<script setup lang="ts">
import { ref } from "vue"
import { NNavigationMenu, type NavigationMenuItem } from "@nagi-labs/nagi-ui/components"
const items: readonly NavigationMenuItem[] = [
  { key: "products", label: "Products", children: [
    { key: "analytics", label: "Analytics", description: "Usage and retention", href: "#analytics" },
    { key: "billing", label: "Billing", description: "Invoices and plans", href: "#billing" },
  ] },
  { key: "docs", label: "Docs", href: "#docs" },
]
const open = ref(false)
</script>
<template><n-navigation-menu v-model:open="open" :items="items" :close-delay="200" /></template>`,

  Pagination: `<script setup lang="ts">
import { ref } from "vue"
import { NPagination, type PaginationItem } from "@nagi-labs/nagi-ui/components"
const pages: readonly PaginationItem[] = [
  { key: "1", label: "1", href: "#page-1" },
  { key: "2", label: "2" },
  { key: "3", label: "3" },
  { key: "4", label: "4", disabled: true },
]
const currentPage = ref("2")
const lastAction = ref("Page 2 is current")
function onSelect(item: PaginationItem) { lastAction.value = \`Selected page \${item.label}\` }
</script>
<template>
  <n-pagination v-model:current-key="currentPage" label="Results pages" :items="pages" @select="onSelect" />
  <p>{{ lastAction }} · current: {{ currentPage }}</p>
</template>`,

  Sidebar: `<script setup lang="ts">
import { NSidebar, NSidebarLink, NSidebarSection } from "@nagi-labs/nagi-ui/components"
</script>
<template>
  <n-sidebar label="Workspace navigation">
    <n-sidebar-section label="Workspace">
      <n-sidebar-link href="#dashboard" current>Dashboard</n-sidebar-link>
      <n-sidebar-link href="#customers">Customers</n-sidebar-link>
    </n-sidebar-section>
    <template #footer>
      Signed in as Maya
    </template>
  </n-sidebar>
</template>`,

  SidebarLink: `<script setup lang="ts">
import { NSidebarLink } from "@nagi-labs/nagi-ui/components"
</script>
<template>
  <n-sidebar-link href="#dashboard">Dashboard</n-sidebar-link>
  <n-sidebar-link href="#customers" current>Customers</n-sidebar-link>
</template>`,

  SidebarSection: `<script setup lang="ts">
import { NSidebarLink, NSidebarSection } from "@nagi-labs/nagi-ui/components"
</script>
<template>
  <n-sidebar-section label="Workspace" heading-id="workspace-heading">
    <n-sidebar-link href="#dashboard">Dashboard</n-sidebar-link>
    <n-sidebar-link href="#customers">Customers</n-sidebar-link>
  </n-sidebar-section>
</template>`,

  Stepper: `<script setup lang="ts">
import { ref } from "vue"
import { NStepper, type StepperItem } from "@nagi-labs/nagi-ui/components"
const steps: readonly StepperItem[] = [
  { key: "workspace", label: "Workspace", description: "Name and region" },
  { key: "team", label: "Team", description: "Invite collaborators" },
  { key: "billing", label: "Billing", description: "Available after approval", disabled: true },
]
const currentStep = ref("team")
</script>
<template>
  <n-stepper v-model:current-key="currentStep" label="Workspace setup" :items="steps" />
  <p>Current step: {{ currentStep }}</p>
</template>`,

  Tabs: `<script setup lang="ts">
import { ref } from "vue"
import { NTabs, type TabsItem } from "@nagi-labs/nagi-ui/components"
const tabs: readonly TabsItem[] = [
  { key: "overview", label: "Overview" },
  { key: "activity", label: "Activity" },
  { key: "billing", label: "Billing", disabled: true },
]
const selected = ref<string | null>("overview")
</script>
<template>
  <n-tabs v-model:selected="selected" label="Account sections" :items="tabs" activation-mode="manual">
    <template #panel="{ item }">
      <p>Custom panel for {{ item.label }}.</p>
    </template>
  </n-tabs>
</template>`,

  Tree: `<script setup lang="ts">
import { ref } from "vue"
import { NTree, type TreeNode } from "@nagi-labs/nagi-ui/components"
const nodes: readonly TreeNode[] = [
  { key: "src", label: "src", children: [
    { key: "app", label: "app.vue" },
    { key: "components", label: "components", children: [{ key: "button", label: "Button.vue" }] },
  ] },
  { key: "tests", label: "tests", hasChildren: true, loading: true },
  { key: "archive", label: "archive", disabled: true },
]
const selected = ref<string | null>("app")
const expanded = ref<readonly string[]>(["src", "components"])
</script>
<template>
  <n-tree v-model="selected" v-model:expanded="expanded" label="Project files" :items="nodes" />
  <p>Selected: {{ selected }}</p>
</template>`,
};
