<script lang="ts">
export interface MultiSelectOption {
  key: string;
  label: string;
  disabled?: boolean;
}
</script>

<script setup lang="ts">
import type { StyleValue } from "vue";
import { useMultiSelect } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    items: readonly MultiSelectOption[];
    id?: string;
    class?: string;
    style?: StyleValue;
    name?: string;
    form?: string;
    placeholder?: string;
    inputmode?: "none" | "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url";
    enterkeyhint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
    autocapitalize?: "none" | "off" | "on" | "sentences" | "words" | "characters";
    autocorrect?: "on" | "off";
    autofocus?: boolean;
    dirname?: string;
    list?: string;
    size?: number;
    spellcheck?: boolean;
    tabindex?: number;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
    ariaDetails?: string;
    ariaErrormessage?: string;
    ariaPlaceholder?: string;
    title?: string;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    removeLabel?: string;
    emptyText?: string;
  }>(),
  {
    placeholder: "Filter options",
    disabled: false,
    readOnly: false,
    required: false,
    removeLabel: "Remove",
    emptyText: "No options",
  },
);
const emit = defineEmits<{
  input: [event: Event];
  click: [event: MouseEvent];
  keydown: [event: KeyboardEvent];
  blur: [event: FocusEvent];
}>();

const selected = defineModel<readonly string[]>({ default: () => [] });
const select = useMultiSelect(props, { selected });
</script>

<template>
  <div
    class="n-multi-select"
    :class="props.class"
    :style="props.style"
  >
    <label
      class="label"
      :for="select.inputProps.id"
      >{{ label }}</label
    >
    <div class="field">
      <span
        v-for="item in select.selectedItems.value"
        :key="item.key"
        class="unit -chip"
      >
        <span class="text">{{ item.label }}</span>
        <button
          v-if="select.canRemove.value"
          v-bind="select.removeButtonProps(item)"
          class="button"
          type="button"
        >
          ×
        </button>
      </span>
      <input
        v-bind="select.inputProps"
        @input="emit('input', $event)"
        @click="emit('click', $event)"
        @keydown="emit('keydown', $event)"
        @blur="emit('blur', $event)"
        class="input"
        type="text"
        :inputmode="inputmode"
        :enterkeyhint="enterkeyhint"
        :autocapitalize="autocapitalize"
        :autocorrect="autocorrect"
        :autofocus="autofocus"
        :dirname="dirname"
        :list="list"
        :size="size"
        :spellcheck="spellcheck"
        :tabindex="tabindex"
        :aria-labelledby="ariaLabelledby"
        :aria-describedby="ariaDescribedby"
        :aria-details="ariaDetails"
        :aria-errormessage="ariaErrormessage"
        :aria-placeholder="ariaPlaceholder"
        :title="title"
      />
    </div>
    <select
      v-bind="select.formProps"
      class="select"
    >
      <option
        v-for="item in select.selectedItems.value"
        :key="item.key"
        :value="item.key"
        selected
      >
        {{ item.label }}
      </option>
    </select>
    <div
      v-bind="select.popupProps"
      class="unit -popup"
      popover
    >
      <ul
        v-bind="select.listboxProps"
        class="list"
      >
        <li
          v-for="item in select.visibleItems.value"
          :key="item.key"
          v-bind="select.optionProps(item)"
          class="item"
        >
          {{ item.label }}
        </li>
      </ul>
      <div
        v-if="select.visibleItems.value.length === 0"
        class="status"
        role="status"
      >
        {{ emptyText }}
      </div>
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
  > .label {
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 650;
  }
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
    &:focus-within {
      border-color: var(--nagi-color-focus-ring);
      box-shadow: var(--nagi-shadow-focus);
    }
    &:has(> .input[aria-invalid="true"]) {
      border-color: var(--nagi-color-danger);
    }
    > .unit.-chip {
      display: inline-flex;
      align-items: center;
      border-radius: var(--nagi-radius-item);
      background: var(--nagi-color-surface-accent);
      > .text {
        padding-inline: var(--nagi-space-item);
      }
      > .button {
        min-inline-size: var(--nagi-size-control);
        min-block-size: var(--nagi-size-control);
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
      }
    }
    > .input {
      flex: 1 1 8rem;
      min-block-size: var(--nagi-size-control);
      border: 0;
      outline: 0;
      background: transparent;
      color: inherit;
      font: inherit;
    }
  }
  > .select {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    clip-path: inset(50%);
    overflow: hidden;
  }
  > .unit.-popup {
    inline-size: min(18rem, calc(100vw - 1rem));
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
    > .list {
      margin: 0;
      padding: 0;
      list-style: none;

      > .item {
        min-block-size: var(--nagi-size-control);
        padding: var(--nagi-space-item);
        border-radius: var(--nagi-radius-item);
        cursor: pointer;

        &[aria-selected="true"] {
          background: var(--nagi-color-surface-accent);
        }

        &[data-active] {
          outline: 2px solid var(--nagi-color-focus-ring);
          outline-offset: calc(-1 * var(--n-border-width-2));
        }

        &[aria-disabled="true"] {
          color: var(--nagi-color-text-disabled);
          cursor: not-allowed;
        }
      }
    }
    > .status {
      margin: 0;
      color: var(--nagi-color-text-muted);
    }
  }
}
@media (forced-colors: active) {
  .n-multi-select {
    > .field:focus-within {
      outline: 2px solid Highlight;
    }

    > .unit.-popup {
      > .list {
        > .item[data-active] {
          outline: 2px solid Highlight;
        }
      }
    }
  }
}
</style>
