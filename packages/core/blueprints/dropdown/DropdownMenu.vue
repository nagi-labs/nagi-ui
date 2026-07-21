<script setup lang="ts">
import { usePopover } from "@nagi-labs/nagi-ui"

defineProps<{
  label: string
  items: { key: string; label: string }[]
}>()

const emit = defineEmits<{ select: [key: string] }>()

const { hide, triggerProps, popoverProps } = usePopover({ anchor: true })

function pick(key: string) {
  emit("select", key)
  hide()
}
</script>

<template>
  <div class="n-dropdown-menu">
    <button class="button -trigger" type="button" v-bind="triggerProps">{{ label }}</button>
    <div class="zone" popover v-bind="popoverProps">
      <ul class="list">
        <li v-for="item in items" :key="item.key" class="item">
          <button class="button" @click="pick(item.key)">{{ item.label }}</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.n-dropdown-menu {
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

  > .zone {
    min-inline-size: 10rem;
    padding: 0.3rem;
    border: 1px solid #d2e2e7;
    border-radius: 0.5rem;
    background: #fff;
    box-shadow: 0 10px 28px rgb(22 48 60 / 0.16);
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

    > .list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;

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

          &:hover {
            background: #e8f1f4;
          }
        }
      }
    }
  }
}
</style>
