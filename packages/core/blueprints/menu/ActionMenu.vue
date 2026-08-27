<script setup lang="ts">
import { useMenu } from "@nagi-labs/nagi-ui";

export interface ActionMenuItem {
  key: string;
  label: string;
  disabled?: boolean;
}

const props = defineProps<{
  label: string;
  items: readonly ActionMenuItem[];
}>();

const emit = defineEmits<{ select: [item: ActionMenuItem] }>();

const { triggerProps, menuProps, itemProps } = useMenu<ActionMenuItem>({
  items: () => props.items,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  isDisabled: (item) => item.disabled ?? false,
  onSelect: (item) => emit("select", item),
  anchor: true,
});
</script>

<template>
  <div class="n-action-menu">
    <button class="button -trigger" type="button" v-bind="triggerProps">
      {{ label }}
    </button>
    <ul class="list" popover v-bind="menuProps">
      <li v-for="item in items" :key="item.key" class="item" role="none">
        <button class="button" type="button" v-bind="itemProps(item)">
          {{ item.label }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.n-action-menu {
  display: inline-block;
  color: var(--nagi-color-text);

  > .button {
    &.-trigger {
      padding: var(--n-space-4) var(--n-space-8);
      border: var(--n-border-width-1) solid var(--nagi-color-border);
      border-radius: var(--n-radius-2);
      background: var(--nagi-color-surface);
      color: inherit;
      font: inherit;
      cursor: pointer;

      &:hover {
        background: var(--nagi-color-surface-active);
      }
    }
  }

  > .list {
    min-inline-size: 11rem;
    margin: 0;
    padding: var(--n-space-2);
    border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
    border-radius: var(--n-radius-2);
    background: var(--nagi-color-surface);
    box-shadow: var(--nagi-shadow-overlay);
    color: var(--nagi-color-text);
    list-style: none;
    opacity: 0;
    translate: 0 -0.4rem;
    transition:
      opacity 0.16s,
      translate 0.16s,
      overlay 0.16s allow-discrete,
      display 0.16s allow-discrete;

    &:popover-open {
      opacity: 1;
      translate: 0 0;

      @starting-style {
        opacity: 0;
        translate: 0 -0.4rem;
      }
    }

    > .item {
      > .button {
        inline-size: 100%;
        padding: var(--n-space-4) var(--n-space-6);
        border: 0;
        border-radius: var(--n-radius-1);
        background: transparent;
        font: inherit;
        text-align: start;
        cursor: pointer;

        &:focus {
          background: var(--nagi-color-surface-active);
          outline: 2px solid var(--nagi-color-focus-ring);
          outline-offset: calc(-1 * var(--n-border-width-2));
        }

        &[aria-disabled="true"] {
          color: var(--nagi-color-text-disabled);
          cursor: not-allowed;
        }
      }
    }
  }
}
</style>
