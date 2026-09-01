<script lang="ts">
export interface PaginationItem {
  key: string;
  label: string;
  /** Real navigation target. Router integrations should resolve their route to an href. */
  href?: string;
  disabled?: boolean;
}
</script>

<script setup lang="ts">
import type { StyleValue } from "vue";
import { usePagination } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    items: readonly PaginationItem[];
    id?: string;
    class?: string;
    style?: StyleValue;
    title?: string;
    label?: string;
  }>(),
  {
    label: "Pagination",
  },
);

const emit = defineEmits<{
  select: [item: PaginationItem];
}>();

const currentKey = defineModel<string>("currentKey", { required: true });
const pagination = usePagination<PaginationItem>(
  { onSelect: (item) => emit("select", item) },
  currentKey,
);
</script>

<template>
  <nav
    class="n-pagination"
    :class="props.class"
    :style="props.style"
    :id="props.id"
    :title="props.title"
    :aria-label="label"
  >
    <ol class="list">
      <li
        v-for="item in items"
        :key="item.key"
        class="item"
      >
        <span
          v-if="item.href && item.disabled"
          class="text"
          aria-disabled="true"
          :aria-current="pagination.isCurrent(item) ? 'page' : undefined"
        >
          {{ item.label }}
        </span>
        <a
          v-else-if="item.href"
          class="link"
          :href="item.href"
          :aria-current="pagination.isCurrent(item) ? 'page' : undefined"
          @click="pagination.selectLink(item)"
        >
          {{ item.label }}
        </a>
        <button
          v-else
          class="button"
          type="button"
          :disabled="item.disabled"
          :aria-current="pagination.isCurrent(item) ? 'page' : undefined"
          @click="pagination.selectButton(item)"
        >
          {{ item.label }}
        </button>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.n-pagination {
  color: var(--nagi-color-text);
  font: inherit;

  > .list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--nagi-space-item-gap);
    align-items: center;
    margin: 0;
    padding: 0;
    list-style: none;

    > .item {
      display: inline-flex;

      > .link,
      > .button,
      > .text {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-inline-size: var(--nagi-size-control);
        min-block-size: var(--nagi-size-control);
        padding: var(--nagi-space-control);
        border: var(--n-border-width-1) solid var(--nagi-color-border);
        border-radius: var(--nagi-radius-control);
        background: var(--nagi-color-surface);
        color: inherit;
        font: inherit;
        font-weight: 650;
        text-decoration: none;
      }

      > .link,
      > .button {
        cursor: pointer;

        &:hover {
          background: var(--nagi-color-surface-active);
        }

        &:focus-visible {
          outline: none;
          border-color: var(--nagi-color-focus-ring);
          box-shadow: var(--nagi-shadow-focus);
        }
      }

      > .button:disabled,
      > .text {
        color: var(--nagi-color-text-disabled);
        cursor: not-allowed;
      }

      > [aria-current="page"] {
        border-color: var(--nagi-color-accent);
        background: var(--nagi-color-surface-accent);
        color: var(--nagi-color-accent);
      }
    }
  }
}

@media (forced-colors: active) {
  .n-pagination > .list > .item > [aria-current="page"] {
    border-width: var(--n-border-width-2);
  }

  .n-pagination > .list > .item > .link:focus-visible,
  .n-pagination > .list > .item > .button:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: var(--n-border-width-2);
  }
}
</style>
