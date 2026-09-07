<script setup lang="ts">
import { ref } from "vue";
import { createToastManager } from "@nagi-labs/nagi-ui";

import {
  NAccordion,
  NAlert,
  NAlertDialog,
  NAvatar,
  NBadge,
  NBreadcrumb,
  NButton,
  NButtonGroup,
  NCard,
  NDialog,
  NDisclosure,
  NEmptyState,
  NKbd,
  NPagination,
  NPopover,
  NPreviewCard,
  NSeparator,
  NSkeleton,
  NSpinner,
  NStepper,
  NTable,
  NTextarea,
  NToast,
  NToggle,
  NToggleGroup,
  NTooltip,
  type PaginationItem,
  type StepperItem,
  type ToggleGroupItem,
  type ToggleGroupValue,
} from "@nagi-labs/nagi-ui/components";

const accordionItems = [
  {
    key: "shipping",
    summary: "How does shipping work?",
    content: "Orders normally ship within two business days.",
  },
  {
    key: "returns",
    summary: "Can I return an order?",
    content: "Unused items can be returned within thirty days.",
  },
  {
    key: "legacy",
    summary: "Legacy policy",
    content: "This policy is unavailable.",
    disabled: true,
  },
] as const;

const avatarImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%2316768b'/%3E%3Ccircle cx='40' cy='31' r='15' fill='white'/%3E%3Cpath d='M14 80c3-19 13-28 26-28s23 9 26 28' fill='white'/%3E%3C/svg%3E";
const avatarSrc = ref(avatarImage);
const accordionOpenKeys = ref<readonly string[]>(["shipping"]);
const multipleAccordionOpenKeys = ref<readonly string[]>(["shipping", "returns"]);
const alertDialogOpen = ref(false);
const alertDialogActions = ref(0);
const alertDialogCancels = ref(0);
const dialogOpen = ref(false);
const disclosureOpen = ref(false);
const focusableDisabledClicks = ref(0);
const pinned = ref(false);
const releaseNotes = ref("Native behavior first.");
const breadcrumbItems = [
  { key: "home", label: "Home", href: "/catalog.html" },
  { key: "components", label: "Components", href: "/catalog.html#utility-heading" },
  { key: "catalog", label: "Catalog" },
] as const;
const paginationItems: readonly PaginationItem[] = [
  { key: "previous", label: "Previous", disabled: true },
  { key: "1", label: "1", href: "/catalog.html?page=1#utility-heading" },
  { key: "2", label: "2" },
  { key: "3", label: "3" },
  { key: "next", label: "Next", href: "/catalog.html?page=3#utility-heading" },
];
const currentPage = ref("2");
const paginationSelections = ref(0);
const tableRows = [
  { id: 1, name: "Ada Lovelace", email: "ada@example.com", status: "Active" },
  { id: 2, name: "Grace Hopper", email: "grace@example.com", status: "Invited" },
] as const;
const tableColumns = [
  { key: "name", label: "Name", rowHeader: true },
  { key: "email", label: "Email" },
  { key: "status", label: "Status" },
] as const;
const stepperItems: readonly StepperItem[] = [
  { key: "details", label: "Details", description: "Package identity" },
  { key: "access", label: "Access", description: "Visibility and roles" },
  { key: "review", label: "Review", description: "Confirm before publishing" },
  {
    key: "publish",
    label: "Publish",
    description: "Unavailable in this demo",
    disabled: true,
  },
];
const currentStep = ref("details");
const alignmentItems: readonly ToggleGroupItem[] = [
  { key: "left", label: "Left" },
  { key: "center", label: "Center" },
  { key: "right", label: "Right" },
];
const formatItems: readonly ToggleGroupItem[] = [
  { key: "bold", label: "Bold" },
  { key: "italic", label: "Italic" },
  { key: "underline", label: "Underline", disabled: true },
];
const alignment = ref<ToggleGroupValue>("center");
const formats = ref<ToggleGroupValue>(["bold"]);
const toastManager = createToastManager({ duration: 0, limit: 3 });
const secondaryToastManager = createToastManager({ duration: 0, limit: 3 });
const undoneActions = ref(0);
let toastCount = 0;
let syncRevision = 0;

function showToast() {
  toastCount += 1;
  toastManager.add({
    title: "Catalog update",
    description: `Catalog notification ${toastCount}`,
  });
}

function showUndoToast() {
  toastManager.add({
    id: "catalog-undo",
    title: "Item archived",
    description: "The item can be restored.",
    tone: "warning",
    action: {
      label: "Undo",
      onClick(id) {
        undoneActions.value += 1;
        toastManager.close(id);
      },
    },
  });
}

function removeUndoAction() {
  toastManager.update("catalog-undo", { action: null });
}

function upsertToast() {
  syncRevision += 1;
  toastManager.add({
    id: "catalog-sync",
    title: "Sync status",
    description: `Revision ${syncRevision}`,
    tone: syncRevision > 1 ? "success" : "accent",
  });
}

function fillToastLimit() {
  toastManager.close();
  for (const number of [1, 2, 3, 4]) {
    toastManager.add({ id: `limited-${number}`, description: `Limited notification ${number}` });
  }
}

function showUrgentToast() {
  toastManager.add({
    id: "catalog-urgent",
    title: "Connection lost",
    description: "Changes are not being saved.",
    tone: "danger",
    priority: "assertive",
  });
}

function showTimedToast() {
  toastManager.add({
    id: "catalog-timed",
    description: "This notification pauses while focused.",
    duration: 200,
  });
}

function showSecondaryToast() {
  secondaryToastManager.add({ description: "Secondary notification" });
}

function runPromiseToast() {
  void toastManager.promise(Promise.resolve("2 records"), {
    loading: { description: "Saving records", tone: "accent" },
    success: (result) => ({
      title: "Save complete",
      description: `${result} saved`,
      tone: "success",
    }),
    error: { title: "Save failed", description: "Try again", tone: "danger" },
  });
}
</script>

<template>
  <main class="n-catalog-lab">
    <header class="header">
      <p class="text -eyebrow">Package components</p>
      <h1 class="title">Package Blueprint catalog</h1>
      <p class="text">
        These examples import raw SFCs from the package. The same files are copied by
        <code class="code">nagi-ui own</code>.
      </p>
    </header>

    <section
      class="section"
      aria-labelledby="styling-heading"
    >
      <h2
        id="styling-heading"
        class="title"
      >
        Styling-only baseline
      </h2>
      <n-card
        class="n-card"
        title="Package-first surface"
        description="Theme by default; own only when the structure must change."
      >
        <template #title="{ title }">
          <span class="n-card-title">
            <span>{{ title }}</span>
            <n-badge
              label="Rich content"
              tone="accent"
            />
          </span>
        </template>
        <template #description="{ description }">
          <span class="n-card-description">
            {{ description }} <strong>Markup stays local.</strong>
          </span>
        </template>
        <div class="n-card-content">
          <p class="text">The consumer owns and styles this declared slot sub-surface.</p>
          <div
            class="list"
            aria-label="Package status badges"
          >
            <n-badge label="Neutral" />
            <n-badge
              label="Accent"
              tone="accent"
            />
            <n-badge
              label="Ready"
              tone="success"
            >
              <template #label="{ label }">
                <span class="n-badge-label">
                  <span aria-hidden="true">✓</span>
                  {{ label }}
                </span>
              </template>
            </n-badge>
            <n-badge
              label="Review"
              tone="warning"
            />
            <n-badge
              label="Blocked"
              tone="danger"
            />
          </div>
          <n-alert
            title="Catalog ready"
            tone="success"
          >
            <template #icon>
              <span
                class="n-alert-icon"
                aria-hidden="true"
                >✓</span
              >
            </template>
            <template #title="{ title }">
              <span class="n-alert-title">{{ title }} <n-badge label="Verified" /></span>
            </template>
            <p class="text">Card, Alert, and Badge complete the initial styling-only baseline.</p>
          </n-alert>
          <n-alert
            title="Destructive action"
            tone="danger"
            role="alert"
          >
            <p class="text">Use assertive semantics only for urgent, newly surfaced information.</p>
          </n-alert>
          <div
            class="list"
            aria-label="Disabled button examples"
          >
            <n-button disabled>Native disabled</n-button>
            <n-button
              disabled
              focusable-when-disabled
              @click="focusableDisabledClicks += 1"
            >
              Focusable disabled
            </n-button>
            <output id="focusable-disabled-clicks">
              activations: {{ focusableDisabledClicks }}
            </output>
          </div>
          <div
            class="list"
            aria-label="Button size examples"
          >
            <n-button
              id="button-small"
              class="small-catalog-action"
              >Small</n-button
            >
            <n-button id="button-default">Default</n-button>
            <n-button
              id="button-large"
              class="large-catalog-action"
              >Large</n-button
            >
          </div>
          <div
            class="list"
            aria-label="Composable button style axes"
          >
            <n-button
              id="button-composed"
              class="delete-catalog-action"
            >
              Danger outlined rounded
            </n-button>
          </div>
        </div>
        <template #footer>
          <div class="n-card-footer">
            <span>Package component with an owned footer surface.</span>
            <n-button class="manage-package-action">Manage package</n-button>
          </div>
        </template>
      </n-card>
    </section>

    <section
      class="section"
      aria-labelledby="primitive-heading"
    >
      <h2
        id="primitive-heading"
        class="title"
      >
        Small native primitives
      </h2>
      <div class="list -primitives">
        <n-avatar
          id="catalog-avatar"
          :src="avatarSrc"
          alt="Ada Lovelace"
        />
        <n-button
          class="avatar-action"
          @click="avatarSrc = '/missing-avatar.png'"
        >
          Break avatar image
        </n-button>
        <n-button
          class="avatar-action"
          @click="avatarSrc = avatarImage"
        >
          Restore avatar image
        </n-button>
      </div>
      <n-separator />
      <div class="list -primitives">
        <n-toggle v-model="pinned">Pin release</n-toggle>
        <output id="toggle-state">pressed: {{ pinned }}</output>
        <n-separator
          orientation="vertical"
          aria-label="Toggle status"
        />
        <span>Native pressed state</span>
      </div>
      <n-separator decorative />
    </section>

    <section
      class="section"
      aria-labelledby="utility-heading"
    >
      <h2
        id="utility-heading"
        class="title"
      >
        Utility and feedback primitives
      </h2>
      <n-breadcrumb
        label="Package path"
        :items="breadcrumbItems"
      />
      <n-pagination
        v-model:current-key="currentPage"
        label="Catalog pages"
        :items="paginationItems"
        @select="paginationSelections += 1"
      />
      <output id="pagination-state">
        current: {{ currentPage }}, selections: {{ paginationSelections }}
      </output>
      <n-table
        :rows="tableRows"
        :columns="tableColumns"
        caption="Catalog users"
        row-key="id"
      >
        <template #cell-status="{ value }">
          <n-badge
            :label="String(value)"
            :tone="value === 'Active' ? 'success' : 'neutral'"
          />
        </template>
      </n-table>

      <n-toggle-group
        v-model="alignment"
        label="Text alignment"
        :items="alignmentItems"
      />
      <output id="alignment-state">alignment: {{ alignment ?? "none" }}</output>
      <n-toggle-group
        v-model="formats"
        label="Text formats"
        mode="multiple"
        :items="formatItems"
      />
      <output id="format-state">
        formats: {{ Array.isArray(formats) ? formats.join(", ") || "none" : "none" }}
      </output>

      <div class="list -primitives">
        <span>Open search</span>
        <n-kbd label="Command" />
        <span>+</span>
        <n-kbd label="K" />
        <n-spinner label="Loading package catalog" />
        <n-spinner id="decorative-spinner" />
      </div>

      <div
        class="unit"
        role="status"
        aria-label="Loading card preview"
        aria-busy="true"
      >
        <n-skeleton id="catalog-skeleton" />
        <n-skeleton />
        <n-skeleton />
      </div>

      <n-button-group
        class="n-button-group"
        label="Editor actions"
      >
        <n-button class="n-button-group-content">Save draft</n-button>
        <n-button class="n-button-group-content publish-action">Publish</n-button>
      </n-button-group>

      <n-empty-state
        class="n-empty-state"
        title="No packages yet"
        description="Create a package to populate this workspace."
      >
        <n-button class="n-empty-state-action create-package-action">Create package</n-button>
      </n-empty-state>

      <form
        class="form"
        @submit.prevent
      >
        <n-textarea
          v-model="releaseNotes"
          label="Release notes"
          name="releaseNotes"
          :rows="3"
          placeholder="Describe this release"
        />
        <n-button type="reset">Reset release notes</n-button>
      </form>
      <output id="release-notes-value">{{ releaseNotes }}</output>
    </section>

    <section
      class="section"
      aria-labelledby="stepper-heading"
    >
      <h2
        id="stepper-heading"
        class="title"
      >
        Stepper
      </h2>
      <n-stepper
        v-model:current-key="currentStep"
        label="Package setup"
        :items="stepperItems"
      />
      <output id="stepper-state">current step: {{ currentStep }}</output>
    </section>

    <section
      id="preview-card-target"
      class="section"
      aria-labelledby="preview-card-heading"
    >
      <h2
        id="preview-card-heading"
        class="title"
      >
        Preview Card
      </h2>
      <p class="text">
        Inspect the
        <n-preview-card
          href="#preview-card-target"
          label="Nagi UI package"
          title="@nagi-labs/nagi-ui"
          description="Native-first Vue components with ownable source."
        >
          <span class="n-preview-card-content">
            <a href="#preview-card-notes">Read compatibility notes</a>
          </span>
        </n-preview-card>
        before following the link.
      </p>
    </section>

    <section
      class="section"
      aria-labelledby="popover-heading"
    >
      <h2
        id="popover-heading"
        class="title"
      >
        Popover
      </h2>
      <n-popover
        trigger-label="Open package popover"
        area="block-end"
        :offset="8"
      >
        <p class="text">Popover body belongs to the application slot.</p>
      </n-popover>
    </section>

    <section
      class="section"
      aria-labelledby="dialog-heading"
    >
      <h2
        id="dialog-heading"
        class="title"
      >
        Dialog
      </h2>
      <p class="text">model open: {{ dialogOpen }}</p>
      <n-dialog
        v-model:open="dialogOpen"
        trigger-label="Open package dialog"
        title="Package dialog"
        description="Confirm the package-level action before continuing."
      >
        <template #title="{ title }">
          <span class="n-dialog-title">
            {{ title }}
            <span aria-hidden="true">✓</span>
          </span>
        </template>
        <template #description="{ description }">
          <span class="n-dialog-description">
            <strong>{{ description }}</strong>
          </span>
        </template>
        <p class="text">The browser owns modality, focus trapping, and Escape.</p>
        <template #actions>
          <n-button
            class="n-dialog-actions confirm-dialog-action"
            @click="dialogOpen = false"
          >
            Confirm
          </n-button>
        </template>
      </n-dialog>
    </section>

    <section
      class="section"
      aria-labelledby="alert-dialog-heading"
    >
      <h2
        id="alert-dialog-heading"
        class="title"
      >
        Alert Dialog
      </h2>
      <p class="text">alert model open: {{ alertDialogOpen }}</p>
      <form
        class="form"
        @submit.prevent
      >
        <n-alert-dialog
          v-model:open="alertDialogOpen"
          trigger-label="Delete package"
          title="Delete this package?"
          description="This action permanently removes the package and cannot be undone."
          action-label="Delete package"
          action-tone="danger"
          @action="alertDialogActions += 1"
          @cancel="alertDialogCancels += 1"
        >
          <template #title="{ title }">
            <span class="n-alert-dialog-title">{{ title }}</span>
          </template>
          <template #description="{ description }">
            <span class="n-alert-dialog-description">{{ description }}</span>
          </template>
        </n-alert-dialog>
      </form>
      <output id="alert-dialog-actions">actions: {{ alertDialogActions }}</output>
      <output id="alert-dialog-cancels">cancels: {{ alertDialogCancels }}</output>
    </section>

    <section
      class="section"
      aria-labelledby="tooltip-heading"
    >
      <h2
        id="tooltip-heading"
        class="title"
      >
        Tooltip
      </h2>
      <n-tooltip
        trigger-label="More information"
        text="This hint is linked with aria-describedby."
        :open-delay="0"
        area="block-start"
        :offset="8"
      />
      <n-tooltip
        trigger-label="Unavailable information"
        text="Disabled tooltips do not open."
        disabled
        :open-delay="0"
      />
    </section>

    <section
      class="section"
      aria-labelledby="disclosure-heading"
    >
      <h2
        id="disclosure-heading"
        class="title"
      >
        Disclosure
      </h2>
      <n-disclosure
        v-model:open="disclosureOpen"
        summary="What does native mean?"
      >
        <template #summary="{ summary }">
          <span class="n-disclosure-summary">
            <span aria-hidden="true">◆</span> {{ summary }}
          </span>
        </template>
        <p class="text">The details element owns disclosure state and keyboard behavior.</p>
      </n-disclosure>
      <n-disclosure
        summary="Unavailable disclosure"
        disabled
      >
        <p class="text">Disabled disclosure content.</p>
      </n-disclosure>
    </section>

    <section
      class="section"
      aria-labelledby="accordion-heading"
    >
      <h2
        id="accordion-heading"
        class="title"
      >
        Accordion
      </h2>
      <n-accordion
        v-model:open-keys="accordionOpenKeys"
        class="n-accordion"
        :items="accordionItems"
      >
        <template #summary="{ summary }">
          <span class="n-accordion-summary">{{ summary }}</span>
        </template>
        <template #panel="{ item }">
          <p class="n-accordion-panel">{{ item.content }}</p>
        </template>
      </n-accordion>
      <output id="accordion-open-keys"> open: {{ accordionOpenKeys.join(",") || "none" }} </output>
      <n-button
        class="accordion-action"
        @click="accordionOpenKeys = ['shipping']"
      >
        Open shipping programmatically
      </n-button>
      <n-accordion
        v-model:open-keys="multipleAccordionOpenKeys"
        class="n-accordion"
        :items="accordionItems.slice(0, 2)"
        multiple
      />
      <output id="multiple-accordion-open-keys">
        open: {{ multipleAccordionOpenKeys.join(",") || "none" }}
      </output>
    </section>

    <section
      class="section"
      aria-labelledby="toast-heading"
    >
      <h2
        id="toast-heading"
        class="title"
      >
        Toast
      </h2>
      <div class="list">
        <n-button @click="showToast">Show toast</n-button>
        <n-button @click="showUndoToast">Show undo toast</n-button>
        <n-button @click="removeUndoAction">Remove undo action</n-button>
        <n-button @click="upsertToast">Upsert sync toast</n-button>
        <n-button @click="fillToastLimit">Fill toast limit</n-button>
        <n-button @click="showUrgentToast">Show urgent toast</n-button>
        <n-button @click="showTimedToast">Show timed toast</n-button>
        <n-button @click="showSecondaryToast">Show secondary toast</n-button>
        <n-button @click="runPromiseToast">Run successful promise</n-button>
        <n-button @click="toastManager.close()">Close all notifications</n-button>
      </div>
      <output id="undone-actions">undo actions: {{ undoneActions }}</output>
      <n-toast :manager="toastManager" />
      <n-toast
        :manager="secondaryToastManager"
        label="Secondary notifications"
      />
    </section>
  </main>
</template>

<style scoped>
.n-button.small-catalog-action,
.n-button.avatar-action,
.n-button.accordion-action {
  --button-size: small;
}

.n-button.large-catalog-action {
  --button-size: large;
}

.n-button.manage-package-action {
  --button-tone: accent;
  --button-size: small;
}

.n-button.delete-catalog-action {
  --button-tone: danger;
  --button-appearance: outlined;
  --button-shape: rounded;
}

.n-button.publish-action,
.n-button.create-package-action,
.n-button.confirm-dialog-action {
  --button-tone: accent;
  --button-appearance: solid;
}

.n-catalog-lab {
  display: grid;
  gap: 1rem;
  max-inline-size: 62rem;
  padding: 2rem;
  color: var(--nagi-color-text, #17323b);
  font-family: ui-sans-serif, system-ui, sans-serif;

  > .header {
    > .title {
      margin-block: 0.35rem 0;
      font-size: 1.65rem;
    }

    > .text {
      max-inline-size: 44rem;
      color: var(--nagi-color-text-muted, #50676f);

      &.-eyebrow {
        margin: 0;
        color: var(--nagi-color-accent, #16768b);
        font-size: var(--nagi-font-size-label, 0.72rem);
        font-weight: 750;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      > .code {
        font-family: ui-monospace, monospace;
      }
    }
  }

  > .section {
    padding: 1rem;
    border: 1px solid var(--nagi-color-border-muted, #c8d8dd);
    border-radius: var(--nagi-radius-overlay, 0.65rem);
    background: var(--nagi-color-surface, #fff);

    > .title {
      margin-block: 0 0.75rem;
      font-size: 1.05rem;
    }

    > .text {
      color: var(--nagi-color-text-muted, #50676f);
    }

    > .list {
      display: flex;
      gap: 0.65rem;
      align-items: center;

      &.-primitives {
        min-block-size: 3rem;
      }
    }

    > .unit[aria-busy="true"] {
      display: grid;
      gap: 0.45rem;
      margin-block: 1rem;
    }

    > .n-button-group {
      margin-block-end: 1rem;

      .n-button-group-content {
        min-inline-size: 7rem;
      }
    }

    > .n-empty-state {
      margin-block-end: 1rem;

      .n-empty-state-action {
        min-inline-size: 9rem;
      }
    }

    > .form {
      display: grid;
      gap: 0.65rem;
      max-inline-size: 32rem;
    }

    > .n-card {
      .n-card-content {
        display: grid;
        gap: 0.75rem;

        > .text {
          margin: 0;
          color: var(--nagi-color-text-muted, #50676f);
        }

        > .list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          align-items: center;
        }
      }

      .n-card-title {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
      }

      .n-card-description {
        display: inline;
      }

      .n-card-footer {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
        justify-content: space-between;
      }
    }

    > .n-accordion {
      .n-accordion-panel {
        margin: 0;
      }
    }
  }
}
</style>
