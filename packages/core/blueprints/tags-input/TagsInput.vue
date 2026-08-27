<script setup lang="ts">
import { ref } from "vue";
import { mergeNagiProps, useTagsInput } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<{
  label: string;
  name?: string;
  form?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  allowDuplicates?: boolean;
  max?: number;
  addOnBlur?: boolean;
  removeLabel?: string;
}>(), {
  placeholder: "Add a tag",
  disabled: false,
  readOnly: false,
  required: false,
  allowDuplicates: false,
  addOnBlur: true,
  removeLabel: "Remove",
});

const model = defineModel<readonly string[]>({ default: () => [] });
const formControl = ref<HTMLSelectElement | null>(null);
const inputControl = ref<HTMLInputElement | null>(null);
const tags = useTagsInput(props, { value: model, formControl, inputControl });
</script>

<template>
  <div class="n-tags-input">
    <label class="label" :for="tags.inputProps.id">{{ label }}</label>
    <span class="field">
        <span v-for="(tag, index) in model" :key="`${tag}-${index}`" class="unit -tag">
          <span class="value">{{ tag }}</span>
          <button
            v-if="!disabled && !readOnly"
            class="button -remove"
            type="button"
            :aria-label="`${removeLabel} ${tag}`"
            @click="tags.remove(index)"
          >×</button>
        </span>
        <input
          ref="inputControl"
          v-bind="mergeNagiProps(tags.inputProps, $attrs)"
          class="input"
        />
    </span>
    <select ref="formControl" v-bind="tags.formProps" class="select -form-value">
      <option v-for="(tag, index) in model" :key="`${tag}-${index}`" :value="tag" selected>{{ tag }}</option>
    </select>
  </div>
</template>

<style scoped>
.n-tags-input {
  display: inline-grid;
  inline-size: min(18rem, 100%);
  min-inline-size: 0;
  color: var(--nagi-color-text);
  > .label { color: var(--nagi-color-text-muted); font-size: var(--nagi-font-size-label); font-weight: 650; }
  > .field {
    display: flex; flex-wrap: wrap; gap: var(--nagi-space-item-gap); align-items: center; min-inline-size: 0;
    min-block-size: var(--nagi-size-control); padding: var(--nagi-space-item-gap); border: var(--n-border-width-1) solid var(--nagi-color-border);
    border-radius: var(--nagi-radius-control); background: var(--nagi-color-surface);
    &:focus-within { border-color: var(--nagi-color-focus-ring); box-shadow: var(--nagi-shadow-focus); }
    &:has(> .input[aria-invalid="true"]) { border-color: var(--nagi-color-danger); }
    > .unit.-tag { display: inline-flex; align-items: center; border-radius: var(--nagi-radius-item); background: var(--nagi-color-surface-accent); }
    > .unit.-tag > .value { padding-inline: var(--nagi-space-item); }
    > .unit.-tag > .button { min-inline-size: var(--nagi-size-control); min-block-size: var(--nagi-size-control); border: 0; background: transparent; color: inherit; cursor: pointer; }
    > .input { flex: 1 1 8rem; min-block-size: var(--nagi-size-control); border: 0; outline: 0; background: transparent; color: inherit; font: inherit; }
  }
  > .select.-form-value { position: absolute; inline-size: 1px; block-size: 1px; clip-path: inset(50%); overflow: hidden; }
}
@media (forced-colors: active) { .n-tags-input > .field:focus-within { outline: 2px solid Highlight; } }
</style>
