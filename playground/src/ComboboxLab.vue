<script setup lang="ts">
import { ref } from "vue";

import { Combobox, type ComboboxOption } from "@nagi-labs/nagi-ui/components";

const frameworks: readonly ComboboxOption[] = [
  { key: "vue", label: "Vue" },
  { key: "react", label: "React", disabled: true },
  { key: "svelte", label: "Svelte" },
  { key: "solid", label: "Solid" },
  { key: "angular", label: "Angular" },
  { key: "preact", label: "Preact" },
];

const inputValue = ref("Vue");
const selected = ref<string | null>("vue");
</script>

<template>
  <main class="combobox-lab">
    <h1 class="title">Nagi UI — Combobox</h1>
    <p class="text">
      DOM focus は input に残り、候補だけを aria-activedescendant で移動します。入力で候補を
      filter しても、Enter / click で次を確定するまでは以前の選択を失いません。
    </p>

    <section class="section">
      <h2 class="title">Framework</h2>
      <Combobox
        v-model="inputValue"
        v-model:selected="selected"
        label="Framework"
        placeholder="Type to filter"
        :items="frameworks"
      />
    </section>

    <dl class="list -state">
      <div class="item">
        <dt class="term">input</dt>
        <dd class="definition" data-testid="input-state">{{ inputValue || "empty" }}</dd>
      </div>
      <div class="item">
        <dt class="term">selected</dt>
        <dd class="definition" data-testid="selected-state">{{ selected ?? "none" }}</dd>
      </div>
    </dl>

    <button id="after-combobox" class="button" type="button">After combobox</button>
  </main>
</template>

<style scoped>
.combobox-lab {
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
    inline-size: 20rem;
    padding: 1rem;
    border: 1px solid #d6e3e7;
    border-radius: 0.75rem;
    background: #fff;

    > .title {
      margin-block: 0 0.75rem;
      font-size: 0.85rem;
    }
  }

  > .list {
    &.-state {
      display: grid;
      max-inline-size: 20rem;
      margin-block: 1.5rem;
      padding: 0.85rem 1rem;
      border-radius: 0.65rem;
      background: #eaf2f4;

      > .item {
        display: grid;
        grid-template-columns: 7rem 1fr;

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
