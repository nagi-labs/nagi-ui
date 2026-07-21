<script setup lang="ts">
import { computed, ref } from "vue";

import { Tabs, type TabsItem } from "@nagi-labs/nagi-ui/components";

const automaticItems: readonly TabsItem[] = [
  { key: "overview", label: "Overview", content: "A summary of recent account activity." },
  { key: "activity", label: "Activity", content: "This tab is unavailable.", disabled: true },
  { key: "settings", label: "Settings", content: "Account preferences and defaults." },
  { key: "billing", label: "Billing", content: "Invoices and payment methods." },
];

const manualItems: readonly TabsItem[] = [
  { key: "profile", label: "Profile", content: "Public profile details." },
  { key: "security", label: "Security", content: "This tab is unavailable.", disabled: true },
  { key: "sessions", label: "Sessions", content: "Signed-in browsers and devices." },
];

const rtlItems: readonly TabsItem[] = [
  { key: "start", label: "Start", content: "Logical start in right-to-left reading order." },
  { key: "middle", label: "Middle", content: "The middle panel." },
  { key: "end", label: "End", content: "Logical end in right-to-left reading order." },
];

const dynamicSource: readonly TabsItem[] = [
  { key: "alpha", label: "Alpha", content: "The first dynamic panel." },
  { key: "beta", label: "Beta", content: "The initially selected dynamic panel." },
  { key: "gamma", label: "Gamma", content: "The next enabled dynamic panel." },
  { key: "delta", label: "Delta", content: "The final dynamic panel." },
];

const automaticSelected = ref<string | null>("overview");
const manualSelected = ref<string | null>("profile");
const rtlSelected = ref<string | null>("start");
const dynamicSelected = ref<string | null>("beta");
const removedDynamicKeys = ref<readonly string[]>([]);
const disabledDynamicKeys = ref<readonly string[]>([]);

const dynamicItems = computed<readonly TabsItem[]>(() =>
  dynamicSource
    .filter((item) => !removedDynamicKeys.value.includes(item.key))
    .map((item) => ({
      ...item,
      disabled: disabledDynamicKeys.value.includes(item.key),
    })),
);

function removeSelectedDynamicTab() {
  const key = dynamicSelected.value;
  if (key === null || removedDynamicKeys.value.includes(key)) return;
  removedDynamicKeys.value = [...removedDynamicKeys.value, key];
}

function disableSelectedDynamicTab() {
  const key = dynamicSelected.value;
  if (key === null || disabledDynamicKeys.value.includes(key)) return;
  disabledDynamicKeys.value = [...disabledDynamicKeys.value, key];
}

function resetDynamicTabs() {
  removedDynamicKeys.value = [];
  disabledDynamicKeys.value = [];
  dynamicSelected.value = "beta";
}
</script>

<template>
  <main class="tabs-lab">
    <h1 class="title">Nagi UI — Tabs</h1>
    <p class="text">
      Native buttons and sections wired with the APG roving-tabindex pattern. Automatic,
      manual, vertical, RTL, and dynamic collection behavior use the package Blueprint.
    </p>

    <section class="section -automatic">
      <h2 class="title">Automatic horizontal LTR</h2>
      <p class="text">Arrow focus activates immediately and skips disabled tabs.</p>
      <button class="button" type="button" data-testid="before-tabs">Before tabs</button>
      <Tabs
        class="tabs"
        v-model:selected="automaticSelected"
        label="Account sections"
        :items="automaticItems"
      >
        <template #panel="{ item }">
          <article class="tabs-panel">
            <p class="text">{{ item.content }}</p>
          </article>
        </template>
      </Tabs>
      <button class="button" type="button" data-testid="after-tabs">After tabs</button>
      <output class="output" data-testid="automatic-state">
        {{ automaticSelected ?? "none" }}
      </output>
    </section>

    <section class="section -manual">
      <h2 class="title">Manual vertical</h2>
      <p class="text">Arrow focus moves independently; Enter or Space activates.</p>
      <Tabs
        class="tabs"
        v-model:selected="manualSelected"
        label="Profile sections"
        :items="manualItems"
        activation-mode="manual"
        orientation="vertical"
      />
      <output class="output" data-testid="manual-state">{{ manualSelected ?? "none" }}</output>
    </section>

    <section class="section -rtl" dir="rtl">
      <h2 class="title">Automatic horizontal RTL</h2>
      <p class="text">Horizontal arrows follow logical reading direction.</p>
      <Tabs
        class="tabs"
        v-model:selected="rtlSelected"
        label="RTL sections"
        :items="rtlItems"
        dir="rtl"
      />
      <output class="output" data-testid="rtl-state">{{ rtlSelected ?? "none" }}</output>
    </section>

    <section class="section -dynamic">
      <h2 class="title">Dynamic collection</h2>
      <p class="text">Removing or disabling the selected tab repairs selection and focus.</p>
      <Tabs
        class="tabs"
        v-model:selected="dynamicSelected"
        label="Dynamic sections"
        :items="dynamicItems"
      />
      <div class="actions">
        <button class="button" type="button" @click="removeSelectedDynamicTab">
          Remove selected dynamic tab
        </button>
        <button class="button" type="button" @click="disableSelectedDynamicTab">
          Disable selected dynamic tab
        </button>
        <button class="button" type="button" @click="resetDynamicTabs">Reset dynamic tabs</button>
      </div>
      <dl class="list -state">
        <div class="item">
          <dt class="term">selected</dt>
          <dd class="definition" data-testid="dynamic-state">
            {{ dynamicSelected ?? "none" }}
          </dd>
        </div>
        <div class="item">
          <dt class="term">items</dt>
          <dd class="definition" data-testid="dynamic-items-state">
            {{ dynamicItems.map((item) => `${item.key}${item.disabled ? ":disabled" : ""}`).join(",") || "none" }}
          </dd>
        </div>
      </dl>
    </section>
  </main>
</template>

<style scoped>
.tabs-lab {
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
    max-inline-size: 48rem;
    margin-block: 0 1.5rem;
    color: #5d7279;
  }

  > .section {
    max-inline-size: 48rem;
    margin-block-end: 1rem;
    padding: 1rem;
    border: 1px solid #d6e3e7;
    border-radius: 0.75rem;
    background: #fff;

    > .title {
      margin-block: 0 0.35rem;
      font-size: 1rem;
    }

    > .text {
      margin-block: 0 0.75rem;
      color: #5d7279;
    }

    > .button {
      margin-block: 0.4rem;
      padding: 0.45rem 0.8rem;
    }

    > .output {
      display: block;
      margin-block-start: 0.75rem;
      color: #50676f;
      font-family: ui-monospace, monospace;
    }

    > .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-block-start: 0.75rem;

      > .button {
        padding: 0.45rem 0.8rem;
      }
    }

    > .list {
      &.-state {
        display: grid;
        margin-block: 0.75rem 0;
        padding: 0.75rem;
        border-radius: 0.65rem;
        background: #eaf2f4;

        > .item {
          display: grid;
          grid-template-columns: 6rem minmax(0, 1fr);

          > .term {
            color: #50676f;
          }

          > .definition {
            min-inline-size: 0;
            margin: 0;
            overflow-wrap: anywhere;
            font-family: ui-monospace, monospace;
          }
        }
      }
    }
  }
}
</style>

<style scoped>
.tabs-lab {
  > .section {
    > .tabs {
      .tabs-panel {
        padding: 0.6rem;

        > .text {
          margin: 0;
          color: #5d7279;
        }
      }
    }
  }
}
</style>
