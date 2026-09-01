function sfc(components: string, setup: string, template: string, style = ""): string {
  const vue = setup ? `\n${setup}` : "";
  const css = style ? `\n\n<style scoped>\n${style}\n</style>` : "";
  return `<script setup lang="ts">\nimport { ${components} } from "@nagi-labs/nagi-ui/components";${vue}\n</scr${"ipt"}>\n\n<template>\n${template}\n</template>${css}`;
}

export const displayOverlayExamples: Readonly<Record<string, string>> = {
  Avatar: sfc(
    "NAvatar",
    "",
    `  <div class="person">\n    <n-avatar src="/maya.jpg" alt="Maya Chen" fallback="MC" />\n    <span><strong>Maya Chen</strong><small>Workspace owner</small></span>\n  </div>`,
  ),
  Badge: sfc(
    "NBadge",
    "",
    `  <ul>\n    <li>Acme Systems <n-badge label="Active" tone="success" /></li>\n    <li>Northstar Labs <n-badge label="Trial" tone="accent" /></li>\n    <li>Orbit Commerce <n-badge label="Payment overdue" tone="danger" /></li>\n  </ul>`,
  ),
  Card: sfc(
    "NBadge, NCard",
    "",
    `  <n-card title="Acme Systems" description="Enterprise account">\n    Renewal is scheduled for October 18.\n    <template #footer>\n      <n-badge label="Active" tone="success" />\n    </template>\n  </n-card>`,
  ),
  Carousel: sfc(
    "NCarousel",
    `import { ref } from "vue";\nconst index = ref(0);\nconst items = [\n  { key: "overview", label: "Overview", description: "A readable account summary." },\n  { key: "activity", label: "Activity", description: "Recent customer events." },\n  { key: "health", label: "Health", description: "Signals that need attention." },\n];`,
    `  <n-carousel v-model="index" :items="items" label="Account highlights" loop />\n  <output>Slide {{ index + 1 }} of {{ items.length }}</output>`,
  ),
  EmptyState: sfc(
    "NButton, NEmptyState",
    "",
    `  <main class="app-empty-state-example">\n    <n-empty-state class="n-empty-state" title="No reports yet" description="Create the first scheduled report.">\n      <span class="actions -primary">\n        <n-button class="n-button">Create report</n-button>\n      </span>\n    </n-empty-state>\n  </main>`,
    `.app-empty-state-example > .n-empty-state .actions.-primary > .n-button {\n  --button-tone: accent;\n  --button-appearance: solid;\n}`,
  ),
  Kbd: sfc(
    "NKbd",
    "",
    `  <p>Open the command palette with <n-kbd label="Command" /> + <n-kbd label="K" />.</p>`,
  ),
  Meter: sfc(
    "NMeter",
    "",
    `  <section>\n    <header><strong>Workspace storage</strong><span>68 GB of 100 GB</span></header>\n    <n-meter label="Workspace storage used" :value="68" :min="0" :max="100" :low="25" :high="80" :optimum="40" />\n  </section>`,
  ),
  Progress: sfc(
    "NProgress",
    "",
    `  <section>\n    <header><strong>Importing customer records</strong><span>680 of 1,000</span></header>\n    <n-progress label="Customer import progress" :value="68" :max="100" />\n  </section>`,
  ),
  Separator: sfc(
    "NButton, NSeparator",
    "",
    `  <article>\n    <section><h2>Account</h2><p>Acme Systems · Enterprise</p></section>\n    <n-separator aria-label="Billing details" />\n    <section><h2>Billing</h2><p>Renews October 18</p></section>\n    <footer>\n      <n-button>Archive</n-button>\n      <n-separator orientation="vertical" aria-label="Danger actions" />\n      <n-button>Delete</n-button>\n    </footer>\n  </article>`,
  ),
  Skeleton: sfc(
    "NSkeleton",
    "",
    `  <article aria-label="Loading account summary">\n    <n-skeleton class="heading" />\n    <n-skeleton />\n    <n-skeleton class="short-line" />\n  </article>`,
  ),
  Spinner: sfc(
    "NSpinner",
    "",
    `  <div>\n    <n-spinner label="Saving workspace settings" />\n    <span aria-hidden="true">Saving workspace settings…</span>\n  </div>`,
  ),
  Table: sfc(
    "NBadge, NTable",
    `const rows = [\n  { customer: "Acme Systems", plan: "Enterprise", status: "Active" },\n  { customer: "Northstar Labs", plan: "Growth", status: "Trial" },\n];\nconst columns = [\n  { key: "customer", label: "Customer", rowHeader: true },\n  { key: "plan", label: "Plan" },\n  { key: "status", label: "Status", align: "end" as const },\n];`,
    `  <n-table :rows="rows" :columns="columns" caption="Customer accounts">\n    <template #cell-status="{ value }">\n      <n-badge :label="String(value)" tone="success" />\n    </template>\n  </n-table>\n  <n-table :rows="[]" :columns="columns" caption="Archived accounts" caption-hidden empty-text="No archived accounts" />`,
  ),
  Alert: sfc(
    "NAlert",
    "",
    `  <n-alert title="Workspace synchronized" tone="success">\n    <template #icon>\n      ✓\n    </template>\n    Customer records are current.\n  </n-alert>\n  <n-alert title="Payment failed" tone="danger" role="alert">Update the billing method.</n-alert>`,
  ),
  Toast: sfc(
    "NButton, NToast",
    `import { createToastManager } from "@nagi-labs/nagi-ui";\nconst manager = createToastManager({ duration: 0, limit: 3 });\nmanager.add({ title: "Workspace synchronized", description: "Customer data is current.", tone: "success", action: { label: "View", onClick: () => undefined } });`,
    `  <n-toast :manager="manager" label="Demo notifications" />\n  <n-button @click="manager.add({ title: 'Export ready', tone: 'accent', duration: 0 })">Add toast</n-button>`,
  ),
  AlertDialog: sfc(
    "NAlertDialog",
    `import { ref } from "vue";\nconst open = ref(false);\nconst result = ref("No action selected");`,
    `  <n-alert-dialog v-model:open="open" trigger-label="Delete workspace" title="Delete workspace?" description="This action cannot be undone." action-label="Delete" action-tone="danger" @action="result = 'Deleted'" @cancel="result = 'Cancelled'" />\n  <output>Open: {{ open }} · {{ result }}</output>`,
  ),
  ContextMenu: sfc(
    "NContextMenu",
    `import { ref } from "vue";\nconst open = ref(false);\nconst selected = ref("No action selected");\nconst items = [\n  { key: "open", label: "Open record", onSelect: () => undefined },\n  { key: "duplicate", label: "Duplicate", onSelect: () => undefined },\n  { key: "archive", label: "Archive", disabled: true, onSelect: () => undefined },\n];`,
    `  <n-context-menu v-model:open="open" :items="items" label="Record actions" @select="selected = $event.label">\n    Right-click or long-press this record\n  </n-context-menu>\n  <output>Open: {{ open }} · {{ selected }}</output>`,
  ),
  Dialog: sfc(
    "NButton, NDialog",
    `import { ref } from "vue";\nconst open = ref(false);`,
    `  <main class="app-dialog-example">\n    <n-dialog\n      class="n-dialog"\n      v-model:open="open"\n      trigger-label="Invite teammate"\n      title="Invite teammate"\n      description="Add someone to this workspace."\n    >\n      Invitation settings.\n      <template #actions>\n        <span class="actions -primary">\n          <n-button class="n-button">Send invite</n-button>\n        </span>\n      </template>\n    </n-dialog>\n    <output>Open: {{ open }}</output>\n  </main>`,
    `.app-dialog-example > .n-dialog .actions.-primary > .n-button {\n  --button-tone: accent;\n  --button-appearance: solid;\n}`,
  ),
  DropdownMenu: sfc(
    "NDropdownMenu",
    `import { computed, ref } from "vue";\nconst checked = ref(true);\nconst density = ref("comfortable");\nconst selected = ref("No action selected");\nconst items = computed(() => [\n  { type: "action" as const, key: "new", label: "New report", onSelect: () => { selected.value = "New report"; } },\n  { type: "link" as const, key: "docs", label: "Documentation", href: "#documentation" },\n  { type: "separator" as const, key: "separator" },\n  { type: "checkbox" as const, key: "compact", label: "Compact rows", checked: checked.value, onCheckedChange: (value: boolean) => { checked.value = value; } },\n  { type: "radio-group" as const, key: "density", label: "Density", value: density.value, onValueChange: (value: string) => { density.value = value; }, items: [{ key: "comfortable", label: "Comfortable" }, { key: "spacious", label: "Spacious" }] },\n  { type: "submenu" as const, key: "export", label: "Export", items: [{ type: "action" as const, key: "csv", label: "CSV", onSelect: () => { selected.value = "Export CSV"; } }] },\n]);`,
    `  <n-dropdown-menu label="Report actions" :items="items" />\n  <output>{{ selected }} · density: {{ density }}</output>`,
  ),
  Popover: sfc(
    "NPopover",
    `import { ref } from "vue";\nconst open = ref(false);`,
    `  <n-popover v-model:open="open" trigger-label="Account details" area="block-end">\n    Plan: Enterprise<br />Renewal: October 18\n  </n-popover>\n  <output>Open: {{ open }}</output>`,
  ),
  PreviewCard: sfc(
    "NBadge, NPreviewCard",
    `import { ref } from "vue";\nconst open = ref(false);`,
    `  <n-preview-card v-model:open="open" href="#account" label="Preview Acme Systems" title="Acme Systems" description="Enterprise · Active">\n    <n-badge label="Healthy" tone="success" />\n  </n-preview-card>\n  <output>Open: {{ open }}</output>`,
  ),
  Resizable: sfc(
    "NResizable",
    `import { ref } from "vue";\nconst split = ref(36);`,
    `  <n-resizable v-model="split" label="Navigation and content">\n    <template #first>\n      Navigation\n    </template>\n    <template #second>\n      Customer content\n    </template>\n  </n-resizable>\n  <output>First panel: {{ Math.round(split) }}%</output>`,
  ),
  Tooltip: sfc(
    "NTooltip",
    `import { ref } from "vue";\nconst open = ref(false);`,
    `  <n-tooltip v-model:open="open" trigger-label="Account health information" text="Calculated from product usage and support activity." area="block-start" />\n  <output>Open: {{ open }}</output>`,
  ),
};
