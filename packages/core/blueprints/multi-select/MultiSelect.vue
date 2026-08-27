<script lang="ts">
export interface MultiSelectOption {
  key: string;
  label: string;
  disabled?: boolean;
}
</script>

<script setup lang="ts">
import { computed, ref } from "vue";
import { mergeNagiProps, useMultiSelect } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  label: string;
  items: readonly MultiSelectOption[];
  name?: string;
  form?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  removeLabel?: string;
  emptyText?: string;
}>(), {
  placeholder: "Filter options",
  disabled: false,
  readOnly: false,
  required: false,
  removeLabel: "Remove",
  emptyText: "No options",
});

const selected = defineModel<readonly string[]>({ default: () => [] });
const formControl = ref<HTMLSelectElement | null>(null);
const inputControl = ref<HTMLInputElement | null>(null);
const select = useMultiSelect(props, { selected, formControl, inputControl });
const selectedItems = computed(() => selected.value.map((key) =>
  props.items.find((item) => item.key === key) ?? { key, label: key }));
</script>

<template>
  <div class="n-multi-select">
    <label class="label" :for="select.inputProps.id">{{ label }}</label>
    <div class="field">
      <span v-for="(item, index) in selectedItems" :key="item.key" class="unit -chip">
        <span class="text">{{ item.label }}</span>
        <button
          v-if="!disabled && !readOnly"
          class="button -remove"
          type="button"
          :aria-label="`${removeLabel} ${item.label}`"
          @click="select.remove(item.key)"
        >×</button>
      </span>
      <input
        ref="inputControl"
        v-bind="mergeNagiProps(select.inputProps, $attrs)"
        class="input"
        type="text"
      />
    </div>
    <select ref="formControl" v-bind="select.formProps" class="select -form-value">
      <option
        v-for="item in selectedItems"
        :key="item.key"
        :value="item.key"
        :selected="selected.includes(item.key)"
      >{{ item.label }}</option>
    </select>
    <div v-bind="select.popupProps" class="unit -popup" popover>
      <ul v-bind="select.listboxProps" class="list">
        <li
          v-for="item in select.visibleItems.value"
          :key="item.key"
          v-bind="select.optionProps(item)"
          class="item"
        >{{ item.label }}</li>
      </ul>
      <p v-if="select.visibleItems.value.length === 0" class="text -empty" role="status">{{ emptyText }}</p>
    </div>
  </div>
</template>

<style scoped>
.n-multi-select {
  display: inline-grid;
  gap: var(--nagi-space-item-gap);
  inline-size: min(18rem, 100%);
  min-inline-size: 0;
  color: var(--nagi-color-text);
  > .label { color: var(--nagi-color-text-muted); font-size: var(--nagi-font-size-label); font-weight: 650; }
  > .field {
    display: flex;
    flex-wrap: wrap;
    gap: var(--nagi-space-item-gap);
    align-items: center;
    min-block-size: var(--nagi-size-control);
    padding: var(--nagi-space-item-gap);
    border: var(--n-border-width-1) solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-control);
    background: var(--nagi-color-surface);
    &:focus-within { border-color: var(--nagi-color-focus-ring); box-shadow: var(--nagi-shadow-focus); }
    &:has(> .input[aria-invalid="true"]) { border-color: var(--nagi-color-danger); }
    > .unit.-chip {
      display: inline-flex; align-items: center; border-radius: var(--nagi-radius-item); background: var(--nagi-color-surface-accent);
      > .text { padding-inline: var(--nagi-space-item); }
      > .button { min-inline-size: var(--nagi-size-control); min-block-size: var(--nagi-size-control); border: 0; background: transparent; color: inherit; cursor: pointer; }
    }
    > .input { flex: 1 1 8rem; min-block-size: var(--nagi-size-control); border: 0; outline: 0; background: transparent; color: inherit; font: inherit; }
  }
  > .select.-form-value { position: absolute; inline-size: 1px; block-size: 1px; clip-path: inset(50%); overflow: hidden; }
  > .unit.-popup {
    inline-size: min(18rem, calc(100vw - 1rem)); min-inline-size: 0; max-block-size: 15rem; margin: 0; padding: var(--nagi-space-surface-inset); overflow: auto;
    border: var(--n-border-width-1) solid var(--nagi-color-border); border-radius: var(--nagi-radius-overlay); background: var(--nagi-color-surface); box-shadow: var(--nagi-shadow-overlay); color: inherit;
    > .list { margin: 0; padding: 0; list-style: none; }
    > .list > .item { min-block-size: var(--nagi-size-control); padding: var(--nagi-space-item); border-radius: var(--nagi-radius-item); cursor: pointer; }
    > .list > .item[aria-selected="true"] { background: var(--nagi-color-surface-accent); }
    > .list > .item[data-active] { outline: 2px solid var(--nagi-color-focus-ring); outline-offset: calc(-1 * var(--n-border-width-2)); }
    > .list > .item[aria-disabled="true"] { color: var(--nagi-color-text-disabled); cursor: not-allowed; }
    > .text.-empty { margin: 0; color: var(--nagi-color-text-muted); }
  }
}
@media (forced-colors: active) {
  .n-multi-select > .field:focus-within, .n-multi-select > .unit.-popup > .list > .item[data-active] { outline: 2px solid Highlight; }
}
</style>
