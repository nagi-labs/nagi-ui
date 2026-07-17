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
  <div class="action-menu">
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
.action-menu {
  display: inline-block;

  > .button {
    &.-trigger {
      padding: 0.45rem 0.9rem;
      border: 1px solid #c6d6dc;
      border-radius: 0.45rem;
      background: #fff;
      font: inherit;
      cursor: pointer;

      &:hover {
        background: #f0f6f8;
      }
    }
  }

  > .list {
    min-inline-size: 11rem;
    margin: 0;
    padding: 0.3rem;
    border: 1px solid #d2e2e7;
    border-radius: 0.5rem;
    background: #fff;
    box-shadow: 0 10px 28px rgb(22 48 60 / 0.16);
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
        padding: 0.4rem 0.7rem;
        border: 0;
        border-radius: 0.35rem;
        background: transparent;
        font: inherit;
        text-align: start;
        cursor: pointer;

        &[data-active] {
          background: #e8f1f4;
          outline: 2px solid #7bb6c5;
          outline-offset: -2px;
        }

        &[aria-disabled="true"] {
          color: #829198;
          cursor: not-allowed;
        }
      }
    }
  }
}
</style>
