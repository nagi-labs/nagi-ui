<script setup lang="ts">
import {
  NAccordion,
  NBreadcrumb,
  NCalendar,
  NDateField,
  NDatePicker,
  NDateRangePicker,
  NDisclosure,
  NMenubar,
  NNavigationMenu,
  NPagination,
  NRangeCalendar,
  NSidebar,
  NSidebarLink,
  NSidebarSection,
  NStepper,
  NTabs,
  NTimeField,
  NTree,
  type AccordionItem,
  type BreadcrumbItem,
  type MenubarMenu,
  type NavigationMenuItem,
  type PaginationItem,
  type StepperItem,
  type TabsItem,
  type TreeNode,
} from "@nagi-labs/nagi-ui/components";
import type { RangeCalendarValue } from "@nagi-labs/nagi-ui";

defineProps<{ componentName: string }>();

const date = ref<string | null>("2026-08-18");
const time = ref<string | null>("14:30:15");
const range = ref<RangeCalendarValue | null>({ start: "2026-08-11", end: "2026-08-18" });
const datePickerOpen = ref(false);
const rangePickerOpen = ref(false);

const accordionItems: readonly AccordionItem[] = [
  {
    key: "semantics",
    summary: "Native semantics",
    content: "Each item is a native details element.",
  },
  { key: "ownership", summary: "Source ownership", content: "The Blueprint remains ordinary Vue." },
  { key: "disabled", summary: "Unavailable section", disabled: true },
];
const accordionOpen = ref<readonly string[]>(["semantics"]);
const breadcrumbItems: readonly BreadcrumbItem[] = [
  { key: "home", label: "Home", href: "#home" },
  { key: "customers", label: "Customers", href: "#customers" },
  { key: "acme", label: "Acme Systems" },
];
const disclosureOpen = ref(true);
const menus: readonly MenubarMenu[] = [
  {
    key: "file",
    label: "File",
    items: [
      { key: "new", label: "New report" },
      { key: "docs", label: "Documentation", href: "#docs" },
      { key: "archive", label: "Archive", disabled: true },
    ],
  },
  { key: "edit", label: "Edit", items: [{ key: "rename", label: "Rename" }] },
];
const menubarOpen = ref(false);
const selectedCommand = ref("No command selected");
const navigationItems: readonly NavigationMenuItem[] = [
  {
    key: "products",
    label: "Products",
    children: [
      {
        key: "analytics",
        label: "Analytics",
        description: "Usage and retention",
        href: "#analytics",
      },
      { key: "billing", label: "Billing", description: "Invoices and plans", href: "#billing" },
    ],
  },
  { key: "docs", label: "Docs", href: "#docs" },
];
const navigationOpen = ref(false);
const pages: readonly PaginationItem[] = [
  { key: "1", label: "1", href: "#page-1" },
  { key: "2", label: "2" },
  { key: "3", label: "3" },
  { key: "4", label: "4", disabled: true },
];
const currentPage = ref("2");
const lastPageAction = ref("Page 2 is current");
const steps: readonly StepperItem[] = [
  { key: "workspace", label: "Workspace", description: "Name and region" },
  { key: "team", label: "Team", description: "Invite collaborators" },
  { key: "billing", label: "Billing", description: "Available after approval", disabled: true },
];
const currentStep = ref("team");
const tabs: readonly TabsItem[] = [
  { key: "overview", label: "Overview" },
  { key: "activity", label: "Activity" },
  { key: "billing", label: "Billing", disabled: true },
];
const selectedTab = ref<string | null>("overview");
const treeNodes: readonly TreeNode[] = [
  {
    key: "src",
    label: "src",
    children: [
      { key: "app", label: "app.vue" },
      {
        key: "components",
        label: "components",
        children: [{ key: "button", label: "Button.vue" }],
      },
    ],
  },
  { key: "tests", label: "tests", hasChildren: true, loading: true },
  { key: "archive", label: "archive", disabled: true },
];
const selectedTreeNode = ref<string | null>("app");
const expandedTreeNodes = ref<readonly string[]>(["src", "components"]);
</script>

<template>
  <div class="site-date-navigation-preview">
    <div
      v-if="componentName === 'Calendar'"
      class="unit -calendar"
    >
      <n-calendar
        v-model="date"
        label="Billing date"
        min="2026-08-01"
        max="2026-09-30"
        :unavailable-dates="['2026-08-21']"
      />
      <p class="text">
        Selected: <strong class="strong">{{ date }}</strong>
      </p>
    </div>
    <div
      v-else-if="componentName === 'DateField'"
      class="unit -controls"
    >
      <n-date-field
        v-model="date"
        label="Start date"
        min="2026-08-01"
        max="2026-09-30"
      />
      <n-date-field
        label="Invalid date"
        invalid
        validation-message="Enter a date in the reporting period."
      />
      <p class="text">
        Value: <strong class="strong">{{ date }}</strong>
      </p>
    </div>
    <div
      v-else-if="componentName === 'TimeField'"
      class="unit -controls"
    >
      <n-time-field
        v-model="time"
        label="Meeting time"
        granularity="second"
        :hour-cycle="24"
      />
      <n-time-field
        label="Read-only time"
        model-value="09:00"
        read-only
      />
      <p class="text">
        Value: <strong class="strong">{{ time }}</strong>
      </p>
    </div>
    <div
      v-else-if="componentName === 'DatePicker'"
      class="unit -controls"
    >
      <n-date-picker
        v-model="date"
        v-model:open="datePickerOpen"
        label="Start date"
        min="2026-08-01"
        max="2026-09-30"
      />
      <p class="text">
        Selected: <strong class="strong">{{ date }}</strong> ·
        {{ datePickerOpen ? "Open" : "Closed" }}
      </p>
    </div>
    <div
      v-else-if="componentName === 'DateRangePicker'"
      class="unit -controls"
    >
      <n-date-range-picker
        v-model="range"
        v-model:open="rangePickerOpen"
        label="Reporting period"
        min="2026-08-01"
        max="2026-09-30"
      />
      <p class="text">
        Range: <strong class="strong">{{ range?.start }} – {{ range?.end }}</strong> ·
        {{ rangePickerOpen ? "Open" : "Closed" }}
      </p>
    </div>
    <div
      v-else-if="componentName === 'RangeCalendar'"
      class="unit -calendar"
    >
      <n-range-calendar
        v-model="range"
        label="Reporting period"
        min="2026-08-01"
        max="2026-09-30"
        :unavailable-dates="['2026-08-21']"
      />
      <p class="text">
        Range: <strong class="strong">{{ range?.start }} – {{ range?.end }}</strong>
      </p>
    </div>
    <div
      v-else-if="componentName === 'Accordion'"
      class="unit -wide"
    >
      <n-accordion
        v-model:open-keys="accordionOpen"
        :items="accordionItems"
        multiple
      >
        <template #summary="{ item }">
          <strong class="strong">{{ item.summary }}</strong>
        </template>
        <template #panel="{ item }">
          <p class="text">{{ item.content }}</p>
        </template>
      </n-accordion>
    </div>
    <n-breadcrumb
      v-else-if="componentName === 'Breadcrumb'"
      :items="breadcrumbItems"
      separator="→"
    />
    <div
      v-else-if="componentName === 'Disclosure'"
      class="unit -wide"
    >
      <n-disclosure
        v-model:open="disclosureOpen"
        summary="Implementation details"
      >
        <template #summary="{ summary }">
          <strong class="strong">{{ summary }}</strong>
        </template>
        <p class="text">The content remains ordinary HTML inside native details.</p>
      </n-disclosure>
    </div>
    <div
      v-else-if="componentName === 'Menubar'"
      class="unit -wide"
    >
      <n-menubar
        v-model:open="menubarOpen"
        :items="menus"
        @select="selectedCommand = $event.label"
      />
      <p class="text">{{ selectedCommand }}</p>
    </div>
    <n-navigation-menu
      v-else-if="componentName === 'NavigationMenu'"
      v-model:open="navigationOpen"
      :items="navigationItems"
      :close-delay="200"
    />
    <div
      v-else-if="componentName === 'Pagination'"
      class="unit"
    >
      <n-pagination
        v-model:current-key="currentPage"
        label="Results pages"
        :items="pages"
        @select="lastPageAction = `Selected page ${$event.label}`"
      />
      <p class="text">
        {{ lastPageAction }} · current: <strong class="strong">{{ currentPage }}</strong>
      </p>
    </div>
    <div
      v-else-if="componentName === 'Sidebar'"
      class="unit -sidebar"
    >
      <n-sidebar label="Workspace navigation">
        <n-sidebar-section label="Workspace"
          ><n-sidebar-link
            href="#dashboard"
            current
            >Dashboard</n-sidebar-link
          ><n-sidebar-link href="#customers">Customers</n-sidebar-link></n-sidebar-section
        >
        <template #footer>
          <span class="text">Signed in as Maya</span>
        </template>
      </n-sidebar>
    </div>
    <div
      v-else-if="componentName === 'SidebarLink'"
      class="unit -sidebar-links"
    >
      <n-sidebar-link href="#dashboard">Dashboard</n-sidebar-link>
      <n-sidebar-link
        href="#customers"
        current
        >Customers</n-sidebar-link
      >
    </div>
    <div
      v-else-if="componentName === 'SidebarSection'"
      class="unit -sidebar-links"
    >
      <n-sidebar-section
        label="Workspace"
        heading-id="workspace-heading"
      >
        <n-sidebar-link href="#dashboard">Dashboard</n-sidebar-link
        ><n-sidebar-link href="#customers">Customers</n-sidebar-link>
      </n-sidebar-section>
    </div>
    <div
      v-else-if="componentName === 'Stepper'"
      class="unit -wide"
    >
      <n-stepper
        v-model:current-key="currentStep"
        label="Workspace setup"
        :items="steps"
      />
      <p class="text">
        Current step: <strong class="strong">{{ currentStep }}</strong>
      </p>
    </div>
    <div
      v-else-if="componentName === 'Tabs'"
      class="unit -wide"
    >
      <n-tabs
        v-model:selected="selectedTab"
        label="Account sections"
        :items="tabs"
        activation-mode="manual"
      >
        <template #panel="{ item }">
          <p class="text">
            Custom panel for <strong class="strong">{{ item.label }}</strong
            >.
          </p>
        </template>
      </n-tabs>
    </div>
    <div
      v-else-if="componentName === 'Tree'"
      class="unit -tree"
    >
      <n-tree
        v-model="selectedTreeNode"
        v-model:expanded="expandedTreeNodes"
        label="Project files"
        :items="treeNodes"
      />
      <p class="text">
        Selected: <strong class="strong">{{ selectedTreeNode }}</strong>
      </p>
    </div>
  </div>
</template>

<style scoped>
.site-date-navigation-preview {
  display: grid;
  gap: var(--n-space-7);
  justify-items: center;
  inline-size: 100%;

  > .unit {
    display: grid;
    gap: var(--n-space-5);
    justify-items: start;

    &.-wide {
      inline-size: min(100%, 46rem);
    }
    &.-sidebar {
      inline-size: min(100%, 18rem);
    }
    &.-sidebar-links {
      inline-size: min(100%, 16rem);
    }
    &.-tree {
      inline-size: min(100%, 24rem);
    }

    > .text {
      margin: 0;
      color: var(--nagi-color-text-muted);
      font-size: var(--nagi-font-size-label);

      > .strong {
        color: var(--nagi-color-text);
      }
    }
  }
}
</style>
