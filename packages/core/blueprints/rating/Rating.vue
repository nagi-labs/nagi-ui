<script lang="ts">
export interface RatingItem {
  value: number;
  label: string;
}
</script>

<script setup lang="ts">
import { ref } from "vue";

import { useNativeRadioGroupReset } from "@nagi-labs/nagi-ui";

const props = withDefaults(
  defineProps<{
    label: string;
    items: readonly RatingItem[];
    name: string;
    form?: string;
    disabled?: boolean;
    required?: boolean;
  }>(),
  {
    disabled: false,
    required: false,
  },
);

const model = defineModel<number | null>({ default: null });
const inputs = ref<HTMLInputElement[]>([]);

useNativeRadioGroupReset(inputs, model);
</script>

<template>
  <fieldset class="n-rating" :disabled="disabled">
    <legend class="legend">{{ label }}</legend>
    <div class="unit">
      <label v-for="item in items" :key="item.value" class="label">
        <input
          ref="inputs"
          v-model="model"
          class="input"
          type="radio"
          :name="name"
          :value="item.value"
          :form="form"
          :required="required"
        />
        <span class="icon" aria-hidden="true">★</span>
        <span class="text">{{ item.label }}</span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.n-rating {
  min-inline-size: 0;
  padding: 0;
  border: 0;
  color: var(--nagi-color-text);
  font: inherit;

  > .legend {
    margin-block-end: var(--nagi-space-item-gap);
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 650;
  }

  > .unit {
    display: inline-flex;
    gap: var(--nagi-space-item-gap);

    > .label {
      position: relative;
      display: inline-grid;
      cursor: pointer;

      &:has(~ .label > .input:checked),
      &:has(> .input:checked) {
        > .icon {
          color: var(--nagi-color-accent);
        }
      }

      &:has(> .input:focus-visible) {
        border-radius: var(--nagi-radius-item);
        outline: none;
        box-shadow: var(--nagi-shadow-focus);
      }

      &:has(> .input:disabled) {
        color: var(--nagi-color-text-disabled);
        cursor: not-allowed;

        > .icon {
          color: var(--nagi-color-text-disabled);
        }
      }

      > .input {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }

      > .icon {
        color: var(--nagi-color-text-muted);
        font-size: 1.4em;
        line-height: 1;
      }

      > .text {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
    }
  }
}

@media (forced-colors: active) {
  .n-rating > .unit > .label {
    display: inline-flex;
    gap: var(--nagi-space-item-gap);
    align-items: center;

    > .input {
      position: static;
      inline-size: 1rem;
      block-size: 1rem;
      overflow: visible;
      clip-path: none;
    }

    > .icon {
      display: none;
    }
  }
}
</style>
