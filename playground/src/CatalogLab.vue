<script setup lang="ts">
import { ref } from "vue";
import { createToastManager } from "@nagi-labs/nagi-ui";

import {
  Accordion,
  Alert,
  AlertDialog,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  ButtonGroup,
  Card,
  Dialog,
  Disclosure,
  EmptyState,
  Kbd,
  Popover,
  Separator,
  Skeleton,
  Spinner,
  Textarea,
  Toast,
  Toggle,
  Tooltip,
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

    <section class="section" aria-labelledby="styling-heading">
      <h2 id="styling-heading" class="title">Styling-only baseline</h2>
      <Card
        class="n-card"
        title="Package-first surface"
        description="Theme by default; own only when the structure must change."
      >
        <template #title="{ title }">
          <span class="n-card-title">
            <span>{{ title }}</span>
            <Badge label="Rich content" tone="accent" />
          </span>
        </template>
        <template #description="{ description }">
          <span class="n-card-description">
            {{ description }} <strong>Markup stays local.</strong>
          </span>
        </template>
        <div class="n-card-content">
          <p class="text">The consumer owns and styles this declared slot sub-surface.</p>
          <div class="list" aria-label="Package status badges">
            <Badge label="Neutral" />
            <Badge label="Accent" tone="accent" />
            <Badge label="Ready" tone="success">
              <template #label="{ label }">
                <span class="n-badge-label"><span aria-hidden="true">✓</span> {{ label }}</span>
              </template>
            </Badge>
            <Badge label="Review" tone="warning" />
            <Badge label="Blocked" tone="danger" />
          </div>
          <Alert title="Catalog ready" tone="success">
            <template #icon><span class="n-alert-icon" aria-hidden="true">✓</span></template>
            <template #title="{ title }">
              <span class="n-alert-title">{{ title }} <Badge label="Verified" /></span>
            </template>
            <p class="text">Card, Alert, and Badge complete the initial styling-only baseline.</p>
          </Alert>
          <Alert title="Destructive action" tone="danger" role="alert">
            <p class="text">Use assertive semantics only for urgent, newly surfaced information.</p>
          </Alert>
          <div class="list" aria-label="Disabled button examples">
            <Button disabled>Native disabled</Button>
            <Button
              disabled
              focusable-when-disabled
              @click="focusableDisabledClicks += 1"
            >
              Focusable disabled
            </Button>
            <output data-testid="focusable-disabled-clicks">
              activations: {{ focusableDisabledClicks }}
            </output>
          </div>
          <div class="list" aria-label="Button size examples">
            <Button data-testid="button-small" size="small">Small</Button>
            <Button data-testid="button-default">Default</Button>
            <Button data-testid="button-large" size="large">Large</Button>
          </div>
        </div>
        <template #footer>
          <div class="n-card-footer">
            <span>Package component with an owned footer surface.</span>
            <Button size="small" variant="accent">Manage package</Button>
          </div>
        </template>
      </Card>
    </section>

    <section class="section" aria-labelledby="primitive-heading">
      <h2 id="primitive-heading" class="title">Small native primitives</h2>
      <div class="list -primitives">
        <Avatar
          data-testid="catalog-avatar"
          :src="avatarSrc"
          alt="Ada Lovelace"
        />
        <Button size="small" @click="avatarSrc = '/missing-avatar.png'">
          Break avatar image
        </Button>
        <Button size="small" @click="avatarSrc = avatarImage">
          Restore avatar image
        </Button>
      </div>
      <Separator />
      <div class="list -primitives">
        <Toggle v-model="pinned">Pin release</Toggle>
        <output data-testid="toggle-state">pressed: {{ pinned }}</output>
        <Separator orientation="vertical" aria-label="Toggle status" />
        <span>Native pressed state</span>
      </div>
      <Separator decorative />
    </section>

    <section class="section" aria-labelledby="utility-heading">
      <h2 id="utility-heading" class="title">Utility and feedback primitives</h2>
      <Breadcrumb label="Package path" :items="breadcrumbItems" />

      <div class="list -primitives">
        <span>Open search</span>
        <Kbd label="Command" />
        <span>+</span>
        <Kbd label="K" />
        <Spinner label="Loading package catalog" />
        <Spinner data-testid="decorative-spinner" />
      </div>

      <div
        class="unit"
        role="status"
        aria-label="Loading card preview"
        aria-busy="true"
      >
        <Skeleton data-testid="catalog-skeleton" />
        <Skeleton />
        <Skeleton />
      </div>

      <ButtonGroup class="n-button-group" label="Editor actions">
        <Button class="n-button-group-content">Save draft</Button>
        <Button class="n-button-group-content" variant="accent">Publish</Button>
      </ButtonGroup>

      <EmptyState
        class="n-empty-state"
        title="No packages yet"
        description="Create a package to populate this workspace."
      >
        <Button class="n-empty-state-action" variant="accent">Create package</Button>
      </EmptyState>

      <form class="form" @submit.prevent>
        <Textarea
          v-model="releaseNotes"
          label="Release notes"
          name="releaseNotes"
          :rows="3"
          placeholder="Describe this release"
        />
        <Button type="reset">Reset release notes</Button>
      </form>
      <output data-testid="release-notes-value">{{ releaseNotes }}</output>
    </section>

    <section class="section" aria-labelledby="popover-heading">
      <h2 id="popover-heading" class="title">Popover</h2>
      <Popover trigger-label="Open package popover" area="block-end" :offset="8">
        <p class="text">Popover body belongs to the application slot.</p>
      </Popover>
    </section>

    <section class="section" aria-labelledby="dialog-heading">
      <h2 id="dialog-heading" class="title">Dialog</h2>
      <p class="text">model open: {{ dialogOpen }}</p>
      <Dialog
        v-model:open="dialogOpen"
        trigger-label="Open package dialog"
        title="Package dialog"
        description="Confirm the package-level action before continuing."
      >
        <template #title="{ title }">
          <span class="n-dialog-title">{{ title }} <span aria-hidden="true">✓</span></span>
        </template>
        <template #description="{ description }">
          <span class="n-dialog-description"><strong>{{ description }}</strong></span>
        </template>
        <p class="text">The browser owns modality, focus trapping, and Escape.</p>
        <template #actions>
          <Button
            class="n-dialog-actions"
            variant="accent"
            @click="dialogOpen = false"
          >
            Confirm
          </Button>
        </template>
      </Dialog>
    </section>

    <section class="section" aria-labelledby="alert-dialog-heading">
      <h2 id="alert-dialog-heading" class="title">Alert Dialog</h2>
      <p class="text">alert model open: {{ alertDialogOpen }}</p>
      <form class="form" @submit.prevent>
        <AlertDialog
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
        </AlertDialog>
      </form>
      <output data-testid="alert-dialog-actions">actions: {{ alertDialogActions }}</output>
      <output data-testid="alert-dialog-cancels">cancels: {{ alertDialogCancels }}</output>
    </section>

    <section class="section" aria-labelledby="tooltip-heading">
      <h2 id="tooltip-heading" class="title">Tooltip</h2>
      <Tooltip
        trigger-label="More information"
        text="This hint is linked with aria-describedby."
        :open-delay="0"
        area="block-start"
        :offset="8"
      />
      <Tooltip
        trigger-label="Unavailable information"
        text="Disabled tooltips do not open."
        disabled
        :open-delay="0"
      />
    </section>

    <section class="section" aria-labelledby="disclosure-heading">
      <h2 id="disclosure-heading" class="title">Disclosure</h2>
      <Disclosure v-model:open="disclosureOpen" summary="What does native mean?">
        <template #summary="{ summary }">
          <span class="n-disclosure-summary">
            <span aria-hidden="true">◆</span> {{ summary }}
          </span>
        </template>
        <p class="text">The details element owns disclosure state and keyboard behavior.</p>
      </Disclosure>
      <Disclosure summary="Unavailable disclosure" disabled>
        <p class="text">Disabled disclosure content.</p>
      </Disclosure>
    </section>

    <section class="section" aria-labelledby="accordion-heading">
      <h2 id="accordion-heading" class="title">Accordion</h2>
      <Accordion
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
      </Accordion>
      <output data-testid="accordion-open-keys">
        open: {{ accordionOpenKeys.join(",") || "none" }}
      </output>
      <Button size="small" @click="accordionOpenKeys = ['shipping']">
        Open shipping programmatically
      </Button>
      <Accordion
        v-model:open-keys="multipleAccordionOpenKeys"
        class="n-accordion"
        :items="accordionItems.slice(0, 2)"
        multiple
      />
      <output data-testid="multiple-accordion-open-keys">
        open: {{ multipleAccordionOpenKeys.join(",") || "none" }}
      </output>
    </section>

    <section class="section" aria-labelledby="toast-heading">
      <h2 id="toast-heading" class="title">Toast</h2>
      <div class="list">
        <Button @click="showToast">Show toast</Button>
        <Button @click="showUndoToast">Show undo toast</Button>
        <Button @click="removeUndoAction">Remove undo action</Button>
        <Button @click="upsertToast">Upsert sync toast</Button>
        <Button @click="fillToastLimit">Fill toast limit</Button>
        <Button @click="showUrgentToast">Show urgent toast</Button>
        <Button @click="showTimedToast">Show timed toast</Button>
        <Button @click="showSecondaryToast">Show secondary toast</Button>
        <Button @click="runPromiseToast">Run successful promise</Button>
        <Button @click="toastManager.close()">Close all notifications</Button>
      </div>
      <output data-testid="undone-actions">undo actions: {{ undoneActions }}</output>
      <Toast :manager="toastManager" />
      <Toast :manager="secondaryToastManager" label="Secondary notifications" />
    </section>
  </main>
</template>

<style scoped>
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
