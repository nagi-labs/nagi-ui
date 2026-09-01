<script setup lang="ts">
import {
  NAlert,
  NAlertDialog,
  NAvatar,
  NBadge,
  NButton,
  NCard,
  NCarousel,
  NContextMenu,
  NDialog,
  NDropdownMenu,
  NEmptyState,
  NKbd,
  NMeter,
  NPopover,
  NPreviewCard,
  NProgress,
  NResizable,
  NSeparator,
  NSkeleton,
  NSpinner,
  NTable,
  NToast,
  NTooltip,
} from "@nagi-labs/nagi-ui/components";
import { createToastManager } from "@nagi-labs/nagi-ui";

defineProps<{ componentName: string }>();

const carouselIndex = ref(0);
const split = ref(36);
const alertDialogOpen = ref(false);
const contextOpen = ref(false);
const dialogOpen = ref(false);
const popoverOpen = ref(false);
const previewOpen = ref(false);
const tooltipOpen = ref(false);
const selectedAction = ref("No action selected");
const menuChecked = ref(true);
const menuDensity = ref("comfortable");

const carouselItems = [
  { key: "overview", label: "Overview", description: "A readable account summary." },
  { key: "activity", label: "Activity", description: "Recent customer events." },
  { key: "health", label: "Health", description: "Signals that need attention." },
];
const rows = [
  { customer: "Acme Systems", plan: "Enterprise", status: "Active" },
  { customer: "Northstar Labs", plan: "Growth", status: "Trial" },
];
const columns = [
  { key: "customer", label: "Customer", rowHeader: true },
  { key: "plan", label: "Plan" },
  { key: "status", label: "Status", align: "end" as const },
];
const emptyRows: typeof rows = [];
const contextItems = [
  { key: "open", label: "Open record", onSelect: () => undefined },
  { key: "duplicate", label: "Duplicate", onSelect: () => undefined },
  { key: "archive", label: "Archive", disabled: true, onSelect: () => undefined },
];
const dropdownItems = computed(() => [
  {
    type: "action" as const,
    key: "new",
    label: "New report",
    shortcut: "⌘N",
    onSelect: () => {
      selectedAction.value = "New report";
    },
  },
  { type: "link" as const, key: "docs", label: "Documentation", href: "#documentation" },
  { type: "separator" as const, key: "separator" },
  {
    type: "checkbox" as const,
    key: "compact",
    label: "Compact rows",
    checked: menuChecked.value,
    onCheckedChange: (value: boolean) => {
      menuChecked.value = value;
    },
  },
  {
    type: "radio-group" as const,
    key: "density",
    label: "Density",
    value: menuDensity.value,
    onValueChange: (value: string) => {
      menuDensity.value = value;
    },
    items: [
      { key: "comfortable", label: "Comfortable" },
      { key: "spacious", label: "Spacious" },
    ],
  },
  {
    type: "submenu" as const,
    key: "export",
    label: "Export",
    items: [
      {
        type: "action" as const,
        key: "csv",
        label: "CSV",
        onSelect: () => {
          selectedAction.value = "Export CSV";
        },
      },
    ],
  },
]);

const toastManager = createToastManager({ duration: 0, limit: 3 });
toastManager.add({
  title: "Workspace synchronized",
  description: "Customer data is current.",
  tone: "success",
  action: {
    label: "View",
    onClick: () => {
      selectedAction.value = "Viewed toast";
    },
  },
});
</script>

<template>
  <div class="site-display-overlay-preview">
    <template v-if="componentName === 'Avatar'">
      <div class="unit -identity">
        <n-avatar
          src="/missing-avatar.png"
          alt="Maya Chen"
          fallback="MC"
        />
        <span class="seg -person">
          <strong class="strong">Maya Chen</strong>
          <small class="note">Workspace owner</small>
        </span>
      </div>
    </template>
    <template v-else-if="componentName === 'Badge'">
      <ul class="list -accounts">
        <li class="item">
          <span class="text">Acme Systems</span>
          <n-badge
            label="Active"
            tone="success"
          />
        </li>
        <li class="item">
          <span class="text">Northstar Labs</span>
          <n-badge
            label="Trial"
            tone="accent"
          />
        </li>
        <li class="item">
          <span class="text">Orbit Commerce</span>
          <n-badge
            label="Payment overdue"
            tone="danger"
          />
        </li>
      </ul>
    </template>
    <template v-else-if="componentName === 'Card'">
      <n-card
        class="n-card"
        title="Acme Systems"
        description="Enterprise account"
      >
        Renewal is scheduled for October 18.
        <template #footer>
          <n-badge
            label="Active"
            tone="success"
          />
        </template>
      </n-card>
    </template>
    <template v-else-if="componentName === 'Carousel'">
      <n-carousel
        v-model="carouselIndex"
        class="n-carousel"
        :items="carouselItems"
        label="Account highlights"
        loop
      />
      <output class="output">Slide {{ carouselIndex + 1 }} of {{ carouselItems.length }}</output>
    </template>
    <template v-else-if="componentName === 'EmptyState'">
      <n-empty-state
        class="n-empty-state"
        title="No reports yet"
        description="Create the first scheduled report."
        ><span class="actions -primary"><n-button>Create report</n-button></span></n-empty-state
      >
    </template>
    <p
      v-else-if="componentName === 'Kbd'"
      class="text -shortcut"
    >
      Open the command palette with <n-kbd label="Command" /> + <n-kbd label="K" />.
    </p>
    <template v-else-if="componentName === 'Meter'">
      <div class="unit -metric">
        <span class="seg -metric-heading">
          <strong class="strong">Workspace storage</strong>
          <span class="text">68 GB of 100 GB</span>
        </span>
        <n-meter
          label="Workspace storage used"
          :value="68"
          :min="0"
          :max="100"
          :low="25"
          :high="80"
          :optimum="40"
        />
      </div>
    </template>
    <template v-else-if="componentName === 'Progress'">
      <div class="unit -metric">
        <span class="seg -metric-heading">
          <strong class="strong">Importing customer records</strong>
          <span class="text">680 of 1,000</span>
        </span>
        <n-progress
          label="Customer import progress"
          :value="68"
          :max="100"
        />
      </div>
    </template>
    <template v-else-if="componentName === 'Separator'">
      <article class="article -account-summary">
        <section class="section">
          <h3 class="title">Account</h3>
          <p class="text">Acme Systems · Enterprise</p>
        </section>
        <n-separator
          class="n-separator"
          aria-label="Billing details"
        />
        <section class="section">
          <h3 class="title">Billing</h3>
          <p class="text">Renews October 18</p>
        </section>
        <div class="actions -record">
          <n-button>Archive</n-button>
          <n-separator
            class="n-separator"
            orientation="vertical"
            aria-label="Danger actions"
          />
          <span class="actions -destructive"><n-button>Delete</n-button></span>
        </div>
      </article>
    </template>
    <template v-else-if="componentName === 'Skeleton'">
      <article
        class="article -loading-card"
        aria-label="Loading account summary"
      >
        <n-skeleton class="n-skeleton -heading" />
        <n-skeleton class="n-skeleton -line" />
        <n-skeleton class="n-skeleton -line -short" />
      </article>
    </template>
    <template v-else-if="componentName === 'Spinner'">
      <div class="unit -saving">
        <n-spinner label="Saving workspace settings" />
        <span
          class="text"
          aria-hidden="true"
          >Saving workspace settings…</span
        >
      </div>
    </template>
    <template v-else-if="componentName === 'Table'">
      <n-table
        class="n-table"
        :rows="rows"
        :columns="columns"
        caption="Customer accounts"
      >
        <template #cell-status="{ value }">
          <n-badge
            :label="String(value)"
            tone="success"
          />
        </template>
      </n-table>
      <n-table
        class="n-table"
        :rows="emptyRows"
        :columns="columns"
        caption="Archived accounts"
        caption-hidden
        empty-text="No archived accounts"
      />
    </template>
    <template v-else-if="componentName === 'Alert'">
      <n-alert
        class="n-alert"
        title="Workspace synchronized"
        tone="success"
      >
        <!-- prettier-ignore -->
        <template #icon>
          ✓
        </template>
        Customer records are current.
      </n-alert>
      <n-alert
        class="n-alert"
        title="Payment failed"
        tone="danger"
        role="alert"
        >Update the billing method.</n-alert
      >
    </template>
    <template v-else-if="componentName === 'Toast'">
      <n-toast
        class="n-toast"
        :manager="toastManager"
        label="Demo notifications"
      />
      <n-button @click="toastManager.add({ title: 'Export ready', tone: 'accent', duration: 0 })"
        >Add toast</n-button
      >
    </template>
    <template v-else-if="componentName === 'AlertDialog'">
      <n-alert-dialog
        v-model:open="alertDialogOpen"
        trigger-label="Delete workspace"
        title="Delete workspace?"
        description="This action cannot be undone."
        action-label="Delete"
        action-tone="danger"
        @action="selectedAction = 'Deleted'"
        @cancel="selectedAction = 'Cancelled'"
      />
      <output class="output">Open: {{ alertDialogOpen }} · {{ selectedAction }}</output>
    </template>
    <template v-else-if="componentName === 'ContextMenu'">
      <n-context-menu
        v-model:open="contextOpen"
        :items="contextItems"
        label="Record actions"
        @select="selectedAction = $event.label"
        >Right-click or long-press this record</n-context-menu
      >
      <output class="output">Open: {{ contextOpen }} · {{ selectedAction }}</output>
    </template>
    <template v-else-if="componentName === 'Dialog'">
      <n-dialog
        v-model:open="dialogOpen"
        trigger-label="Invite teammate"
        title="Invite teammate"
        description="Add someone to this workspace."
      >
        Invitation settings.
        <template #actions>
          <span class="actions -primary">
            <n-button>Send invite</n-button>
          </span>
        </template>
      </n-dialog>
      <output class="output">Open: {{ dialogOpen }}</output>
    </template>
    <template v-else-if="componentName === 'DropdownMenu'">
      <n-dropdown-menu
        label="Report actions"
        :items="dropdownItems"
      />
      <output class="output">{{ selectedAction }} · density: {{ menuDensity }}</output>
    </template>
    <template v-else-if="componentName === 'Popover'">
      <n-popover
        v-model:open="popoverOpen"
        trigger-label="Account details"
        area="block-end"
        >Plan: Enterprise<br />Renewal: October 18</n-popover
      >
      <output class="output">Open: {{ popoverOpen }}</output>
    </template>
    <template v-else-if="componentName === 'PreviewCard'">
      <n-preview-card
        v-model:open="previewOpen"
        href="#account"
        label="Preview Acme Systems"
        title="Acme Systems"
        description="Enterprise · Active"
        ><n-badge
          label="Healthy"
          tone="success"
      /></n-preview-card>
      <output class="output">Open: {{ previewOpen }}</output>
    </template>
    <template v-else-if="componentName === 'Resizable'">
      <n-resizable
        v-model="split"
        class="n-resizable"
        label="Navigation and content"
      >
        <!-- prettier-ignore -->
        <template #first>
          Navigation
        </template>
        <!-- prettier-ignore -->
        <template #second>
          Customer content
        </template>
      </n-resizable>
      <output class="output">First panel: {{ Math.round(split) }}%</output>
    </template>
    <template v-else-if="componentName === 'Tooltip'">
      <n-tooltip
        v-model:open="tooltipOpen"
        trigger-label="Account health information"
        text="Calculated from product usage and support activity."
        area="block-start"
      />
      <output class="output">Open: {{ tooltipOpen }}</output>
    </template>
  </div>
</template>

<style scoped>
.site-display-overlay-preview {
  display: flex;
  flex-wrap: wrap;
  gap: var(--n-space-6);
  align-items: center;
  inline-size: 100%;

  > .n-card,
  > .n-table,
  > .n-carousel,
  > .n-resizable,
  > .n-empty-state,
  > .n-alert,
  > .n-toast {
    inline-size: 100%;
  }

  > .output {
    color: var(--nagi-color-text-muted);
    font-size: var(--n-font-size-3);
  }

  > .unit.-identity,
  > .unit.-saving {
    display: flex;
    gap: var(--n-space-5);
    align-items: center;

    > .seg.-person {
      display: grid;

      > .note {
        color: var(--nagi-color-text-muted);
      }
    }
  }

  > .list.-accounts {
    display: grid;
    gap: var(--n-space-4);
    min-inline-size: min(100%, 24rem);
    padding: 0;
    margin: 0;
    list-style: none;

    > .item {
      display: flex;
      gap: var(--n-space-6);
      align-items: center;
      justify-content: space-between;
    }
  }

  > .text.-shortcut {
    margin: 0;
  }

  > .unit.-metric {
    display: grid;
    gap: var(--n-space-4);
    inline-size: min(100%, 28rem);

    > .seg.-metric-heading {
      display: flex;
      gap: var(--n-space-6);
      justify-content: space-between;

      > .text {
        color: var(--nagi-color-text-muted);
      }
    }
  }

  > .article.-account-summary,
  > .article.-loading-card {
    display: grid;
    gap: var(--n-space-6);
    inline-size: min(100%, 30rem);
    padding: var(--n-space-7);
    border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
    border-radius: var(--nagi-radius-control);
    background: var(--nagi-color-surface);
  }

  > .article.-account-summary {
    > .section {
      display: grid;
      gap: var(--n-space-2);

      > .title,
      > .text {
        margin: 0;
      }

      > .text {
        color: var(--nagi-color-text-muted);
      }
    }

    > .actions.-record {
      display: flex;
      gap: var(--n-space-4);
      align-items: stretch;

      > .n-separator {
        align-self: stretch;
      }
    }
  }

  > .article.-loading-card {
    > .n-skeleton.-heading {
      inline-size: 45%;
      block-size: var(--n-space-7);
    }

    > .n-skeleton.-line.-short {
      inline-size: 68%;
    }
  }
}
</style>
