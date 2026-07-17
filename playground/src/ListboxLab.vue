<script setup lang="ts">
import { computed, ref } from "vue";

import Listbox, { type ListboxOption } from "../../blueprints/listbox/Listbox.vue";

const fruits: readonly ListboxOption[] = [
  { key: "apple", label: "Apple" },
  { key: "banana", label: "Banana", disabled: true },
  { key: "cherry", label: "Cherry" },
  { key: "date", label: "Date" },
];

const toppings: readonly ListboxOption[] = [
  { key: "olives", label: "Olives" },
  { key: "peppers", label: "Peppers", disabled: true },
  { key: "mushrooms", label: "Mushrooms" },
  { key: "anchovies", label: "Anchovies" },
  { key: "onions", label: "Onions" },
];

const fruit = ref<readonly string[]>([]);
const picked = ref<readonly string[]>(["mushrooms"]);
const query = ref("");

const visibleToppings = computed(() =>
  toppings.filter((topping) =>
    topping.label.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase()),
  ),
);
</script>

<template>
  <main class="listbox-lab">
    <h1 class="title">Nagi UI — Listbox</h1>
    <p class="text">
      useListbox の aria-activedescendant 方式。single は selection follows focus、multiple は
      Space / Shift+Arrow / Ctrl+A。filter しても選択はデータ側に残ります。
    </p>

    <section class="section">
      <h2 class="title">Single</h2>
      <Listbox v-model:selected="fruit" label="Fruit" :items="fruits" />
    </section>

    <section class="section">
      <h2 class="title">Multiple</h2>
      <input
        v-model="query"
        class="input"
        type="search"
        placeholder="Filter toppings"
        aria-label="Filter toppings"
      />
      <Listbox
        v-model:selected="picked"
        label="Toppings"
        mode="multiple"
        :items="visibleToppings"
      />
    </section>

    <dl class="list -state">
      <div class="item">
        <dt class="term">fruit</dt>
        <dd class="definition" data-testid="single-state">{{ fruit.join(",") || "none" }}</dd>
      </div>
      <div class="item">
        <dt class="term">toppings</dt>
        <dd class="definition" data-testid="multi-state">{{ picked.join(",") || "none" }}</dd>
      </div>
    </dl>

    <button id="after-listbox" class="button" type="button">After listbox</button>
  </main>
</template>

<style scoped>
.listbox-lab {
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
    min-inline-size: 16rem;
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

    > .input {
      inline-size: 100%;
      margin-block-end: 0.75rem;
      padding: 0.4rem 0.6rem;
      border: 1px solid #b9cbd1;
      border-radius: 0.45rem;
      font: inherit;
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
          color: #61777e;
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
