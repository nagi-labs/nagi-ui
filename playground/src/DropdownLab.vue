<script setup lang="ts">
import { computed, ref } from "vue";

import { Button, DropdownMenu, type DropdownMenuNode } from "@nagi-labs/nagi-ui/components";
import DropdownFixture, { type DropdownSort } from "./DropdownFixture.vue";

const lastAction = ref("none");
const showToolbar = ref(true);
const showAdvanced = ref(false);
const verbose = ref(false);
const sortBy = ref<DropdownSort>("name");
const routerNavigations = ref(0);
const linkPrefetches = ref(0);

const items = computed<readonly DropdownMenuNode[]>(() => [
  {
    type: "group",
    key: "file",
    label: "File",
    items: [
      {
        type: "action",
        key: "duplicate",
        label: "Duplicate",
        shortcut: "⌘D",
        onSelect: () => (lastAction.value = "duplicate"),
      },
      {
        type: "action",
        key: "archive",
        label: "Archive",
        shortcut: "⇧⌘A",
        disabled: true,
        onSelect: () => (lastAction.value = "archive"),
      },
    ],
  },
  { type: "separator", key: "file-separator" },
  {
    type: "group",
    key: "view",
    label: "View",
    items: [
      {
        type: "checkbox",
        key: "show-toolbar",
        label: "Show toolbar",
        checked: showToolbar.value,
        onCheckedChange: (checked) => (showToolbar.value = checked),
      },
      {
        type: "checkbox",
        key: "show-advanced",
        label: "Show advanced",
        checked: showAdvanced.value,
        onCheckedChange: (checked) => (showAdvanced.value = checked),
      },
      {
        type: "radio-group",
        key: "sort",
        value: sortBy.value,
        onValueChange: (value) => (sortBy.value = value as DropdownSort),
        items: [
          { key: "name", label: "Sort by name" },
          { key: "modified", label: "Sort by modified date" },
        ],
      },
    ],
  },
  { type: "separator", key: "view-separator" },
  {
    type: "submenu",
    key: "share",
    label: "Share",
    items: [
      {
        type: "action",
        key: "copy-link",
        label: "Copy link",
        shortcut: "⌘L",
        onSelect: () => (lastAction.value = "copy-link"),
      },
      {
        type: "link",
        key: "documentation",
        label: "Documentation",
        href: "#documentation",
      },
      {
        type: "link",
        key: "router-adapter",
        label: "Router adapter",
        href: "#router-adapter",
        navigate: () => {
          routerNavigations.value += 1;
          if (typeof window !== "undefined") window.history.pushState({}, "", "#router-adapter");
        },
        prefetch: () => {
          linkPrefetches.value += 1;
        },
      },
    ],
  },
  ...(showAdvanced.value
    ? ([
        {
          type: "submenu",
          key: "advanced",
          label: "Advanced",
          items: [
            {
              type: "checkbox",
              key: "verbose",
              label: "Verbose logging",
              checked: verbose.value,
              onCheckedChange: (checked) => (verbose.value = checked),
            },
            {
              type: "action",
              key: "reset",
              label: "Reset settings",
              onSelect: () => (lastAction.value = "reset"),
            },
          ],
        },
      ] satisfies readonly DropdownMenuNode[])
    : []),
  { type: "separator", key: "danger-separator" },
  {
    type: "action",
    key: "delete",
    label: "Delete",
    shortcut: "⌫",
    variant: "danger",
    onSelect: () => (lastAction.value = "delete"),
  },
]);
</script>

<template>
  <main class="n-dropdown-lab">
    <h1 class="title">Nagi UI — complete Dropdown</h1>
    <p class="text">
      The schema-driven Blueprint (items as data) appears beside the explicit-DOM fixture.
      Both use the same useMenu and useSubmenu behavior.
    </p>

    <section class="section">
      <h2 class="title">LTR</h2>
      <DropdownMenu label="File actions" :items="items" />
    </section>

    <section class="section" dir="rtl">
      <h2 class="title">RTL</h2>
      <DropdownMenu label="RTL actions" :items="items" dir="rtl" />
    </section>

    <section class="section -themed">
      <h2 class="title">Themed</h2>
      <DropdownMenu label="Themed actions" :items="items" />
    </section>

    <section class="section">
      <h2 class="title">Buttons</h2>
      <div class="row -buttons">
        <Button>Cancel</Button>
        <Button variant="accent">Save</Button>
        <Button variant="danger">Delete</Button>
        <Button disabled>Disabled</Button>
      </div>
    </section>

    <section class="section">
      <h2 class="title">Explicit DOM fixture</h2>
      <DropdownFixture
        v-model:show-toolbar="showToolbar"
        v-model:sort-by="sortBy"
        label="Fixture actions"
        @action="lastAction = $event"
      />
    </section>

    <section class="section">
      <h2 class="title">Controlled submenu close</h2>
      <DropdownFixture label="Locked submenu actions" reject-submenu-close />
    </section>

    <dl id="documentation" class="list -state">
      <div class="item">
        <dt class="term">show toolbar</dt>
        <dd class="definition" data-testid="toolbar-state">{{ showToolbar }}</dd>
      </div>
      <div class="item">
        <dt class="term">sort by</dt>
        <dd class="definition" data-testid="sort-state">{{ sortBy }}</dd>
      </div>
      <div class="item">
        <dt class="term">verbose</dt>
        <dd class="definition" data-testid="verbose-state">{{ verbose }}</dd>
      </div>
      <div class="item">
        <dt class="term">last action</dt>
        <dd class="definition" data-testid="action-state">{{ lastAction }}</dd>
      </div>
      <div class="item">
        <dt class="term">router navigations</dt>
        <dd class="definition" data-testid="router-navigation-state">{{ routerNavigations }}</dd>
      </div>
      <div class="item">
        <dt class="term">link prefetches</dt>
        <dd class="definition" data-testid="link-prefetch-state">{{ linkPrefetches }}</dd>
      </div>
    </dl>

    <button id="after-dropdown" class="button" type="button">After dropdown</button>
  </main>
</template>

<style scoped>
.n-dropdown-lab {
  min-block-size: 100vh;
  padding: 2rem;
  background: #f6fafb;
  color: #17323b;
  font-family: ui-sans-serif, system-ui, sans-serif;

  > .title {
    margin-block: 0 0.5rem;
    font-size: 1.6rem;
  }

  > .text {
    max-inline-size: 44rem;
    margin-block: 0 1.5rem;
    color: #5d7279;
  }

  > .section {
    display: inline-block;
    min-inline-size: 15rem;
    margin-inline-end: 1rem;
    padding: 1rem;
    border: 1px solid #d6e3e7;
    border-radius: 0.75rem;
    background: #fff;
    vertical-align: top;

    > .title {
      margin-block: 0 0.75rem;
      font-size: 0.85rem;
    }

    > .row {
      &.-buttons {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
    }

    /* Brand change through semantic tokens only — no ownership, no component
       edit. Popovers stay in place in the DOM (no Teleport), so the custom
       properties inherit into the open menu tree as well. The space/size
       overrides double as the compact-density demonstration. */
    &.-themed {
      --nagi-color-accent: #6d28d9;
      --nagi-color-border: #c4b5fd;
      --nagi-color-focus-ring: #8b5cf6;
      --nagi-color-surface-active: #ede9fe;
      --nagi-color-text-muted: #475569;
      --nagi-radius-item: 0.8rem;
      --nagi-size-control: 1.7rem;
      --nagi-space-item: 0.2rem 0.45rem;
      --nagi-space-surface-inset: 0.25rem;
    }
  }

  > .list {
    &.-state {
      display: grid;
      max-inline-size: 31rem;
      margin-block: 1.5rem;
      padding: 0.85rem 1rem;
      border-radius: 0.65rem;
      background: #eaf2f4;

      > .item {
        display: grid;
        grid-template-columns: 9rem 1fr;

        > .term {
          color: #50676f;
        }

        > .definition {
          margin: 0;
          font-family: ui-monospace, monospace;
        }
      }
    }
  }

  > .button {
    padding: 0.45rem 0.8rem;
  }
}
</style>
