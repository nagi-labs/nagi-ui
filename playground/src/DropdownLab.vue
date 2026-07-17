<script setup lang="ts">
import { ref } from "vue";

import DropdownMenu, { type DropdownSort } from "../../blueprints/menu/DropdownMenu.vue";

const lastAction = ref("none");
const showToolbar = ref(true);
const sortBy = ref<DropdownSort>("name");
</script>

<template>
  <main class="dropdown-lab">
    <h1 class="title">Nagi UI — complete Dropdown</h1>
    <p class="text">
      Action、checkbox、radio、submenu を、同じ native DOM + 属性注入モデルで構成しています。
    </p>

    <section class="section">
      <h2 class="title">LTR</h2>
      <DropdownMenu
        v-model:show-toolbar="showToolbar"
        v-model:sort-by="sortBy"
        label="File actions"
        @action="lastAction = $event"
      />
    </section>

    <section class="section" dir="rtl">
      <h2 class="title">RTL</h2>
      <DropdownMenu
        v-model:show-toolbar="showToolbar"
        v-model:sort-by="sortBy"
        label="RTL actions"
        dir="rtl"
        @action="lastAction = $event"
      />
    </section>

    <dl class="list -state">
      <div class="item">
        <dt class="term">show toolbar</dt>
        <dd class="definition" data-testid="toolbar-state">{{ showToolbar }}</dd>
      </div>
      <div class="item">
        <dt class="term">sort by</dt>
        <dd class="definition" data-testid="sort-state">{{ sortBy }}</dd>
      </div>
      <div class="item">
        <dt class="term">last action</dt>
        <dd class="definition" data-testid="action-state">{{ lastAction }}</dd>
      </div>
    </dl>

    <button id="after-dropdown" class="button" type="button">After dropdown</button>
  </main>
</template>

<style scoped>
.dropdown-lab {
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
