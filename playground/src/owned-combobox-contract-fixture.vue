<script setup lang="ts">
import { useId } from "vue";

import { useCombobox } from "@nagi-labs/nagi-ui";

interface ComboboxFixtureItem {
  key: string;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    label: string;
    items: readonly ComboboxFixtureItem[];
    disabled?: boolean;
    readOnly?: boolean;
  }>(),
  {
    disabled: false,
    readOnly: false,
  },
);

const inputValue = defineModel<string>({ default: "" });
const selected = defineModel<string | null>("selected", { default: null });
const combobox = useCombobox({
  items: () => props.items,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  isDisabled: (item) => item.disabled ?? false,
  inputValue,
  selected,
  disabled: () => props.disabled,
  readOnly: () => props.readOnly,
  openWhenEmpty: true,
});
const labelId = useId();
</script>

<template>
  <div
    data-scope="combobox"
    data-part="root"
    class="owned-combobox"
  >
    <label
      :id="labelId"
      :for="combobox.inputId"
    >
      {{ label }}
    </label>
    <div class="owned-control-wrapper">
      <input
        data-scope="combobox"
        data-part="input"
        type="text"
        :aria-labelledby="labelId"
        v-bind="combobox.inputProps"
      />
    </div>
    <div
      data-scope="combobox"
      data-part="popup"
      popover
      v-bind="combobox.popupProps"
    >
      <div class="owned-popup-wrapper">
        <ul
          data-scope="combobox"
          data-part="listbox"
          :aria-labelledby="labelId"
          v-bind="combobox.listboxProps"
        >
          <li
            v-for="item in combobox.visibleItems.value"
            :key="item.key"
            data-scope="combobox"
            data-part="option"
            v-bind="combobox.optionProps(item)"
          >
            {{ item.label }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
