<script lang="ts">
export interface AutocompleteOption {
  key: string;
  label: string;
  disabled?: boolean;
}
</script>

<script setup lang="ts">
import { ref } from "vue";
import { mergeNagiProps, useAutocomplete } from "@nagi-labs/nagi-ui";
import { useNativeValueReset } from "@nagi-labs/nagi-ui/component-controls";

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{
  label: string;
  items: readonly AutocompleteOption[];
  placeholder?: string;
  autocomplete?: string;
  name?: string;
  form?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  emptyText?: string;
}>(), {
  autocomplete: "off",
  disabled: false,
  readOnly: false,
  required: false,
  emptyText: "No suggestions",
});

const model = defineModel<string>({ default: "" });
const input = ref<HTMLInputElement | null>(null);
const behavior = useAutocomplete(props, model);
useNativeValueReset(input, model);
</script>

<template>
  <div class="n-autocomplete">
    <label class="label" :for="behavior.inputId">{{ label }}</label>
    <input
      ref="input"
      v-bind="mergeNagiProps(behavior.inputProps, $attrs)"
      class="input"
      type="text"
      :name="name"
      :form="form"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
    />
    <div v-bind="behavior.popupProps" class="unit -popup" popover>
      <ul v-bind="behavior.listboxProps" class="list">
        <li
          v-for="item in behavior.visibleItems.value"
          :key="item.key"
          v-bind="behavior.optionProps(item)"
          class="item"
        >{{ item.label }}</li>
      </ul>
      <p v-if="behavior.visibleItems.value.length === 0" class="text -empty" role="status">{{ emptyText }}</p>
    </div>
  </div>
</template>

<style scoped>
.n-autocomplete {
  display: inline-grid;
  gap: var(--nagi-space-item-gap);
  inline-size: min(16rem, 100%);
  min-inline-size: 0;
  color: var(--nagi-color-text);

  > .label { color: var(--nagi-color-text-muted); font-size: var(--nagi-font-size-label); font-weight: 650; }
  > .input {
    box-sizing: border-box;
    min-block-size: var(--nagi-size-control);
    padding: var(--nagi-space-control);
    border: var(--n-border-width-1) solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-control);
    outline: none;
    background: var(--nagi-color-surface);
    color: inherit;
    font: inherit;
    &:focus-visible, &[aria-expanded="true"] { border-color: var(--nagi-color-focus-ring); box-shadow: var(--nagi-shadow-focus); }
    &:disabled, &:read-only { color: var(--nagi-color-text-disabled); background: var(--nagi-color-surface-accent); }
  }
  > .unit.-popup {
    inline-size: min(16rem, calc(100vw - 1rem));
    min-inline-size: 0;
    max-block-size: 15rem;
    margin: 0;
    padding: var(--nagi-space-surface-inset);
    overflow: auto;
    border: var(--n-border-width-1) solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-overlay);
    background: var(--nagi-color-surface);
    box-shadow: var(--nagi-shadow-overlay);
    color: inherit;
    > .list { margin: 0; padding: 0; list-style: none; }
    > .list > .item {
      min-block-size: var(--nagi-size-control);
      padding: var(--nagi-space-item);
      border-radius: var(--nagi-radius-item);
      cursor: pointer;
      &[aria-selected="true"] { background: var(--nagi-color-surface-active); outline: 2px solid var(--nagi-color-focus-ring); }
      &[aria-disabled="true"] { color: var(--nagi-color-text-disabled); cursor: not-allowed; }
    }
    > .text.-empty { margin: 0; padding: var(--nagi-space-item); color: var(--nagi-color-text-muted); }
  }
}
@media (forced-colors: active) { .n-autocomplete > .input:focus-visible { outline: 2px solid Highlight; } }
</style>
