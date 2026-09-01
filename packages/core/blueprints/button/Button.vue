<script setup lang="ts">
import { useButton } from "@nagi-labs/nagi-ui/component-controls";
import { mergeElementProps, withoutClassToken } from "@nagi-labs/nagi-ui";
import { computed, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    /** Keep the button in the tab order while suppressing activation. */
    focusableWhenDisabled?: boolean;
  }>(),
  {
    type: "button",
    disabled: false,
    focusableWhenDisabled: false,
  },
);

const attrs = useAttrs();

const button = useButton(props);

const buttonProps = computed(() =>
  mergeElementProps(
    button.buttonProps,
    { ...attrs, class: withoutClassToken(attrs.class, "n-button") },
    { type: props.type },
  ),
);

const emit = defineEmits<{
  blur: [event: FocusEvent];
  click: [event: MouseEvent];
  dblclick: [event: MouseEvent];
  focus: [event: FocusEvent];
  keydown: [event: KeyboardEvent];
  keyup: [event: KeyboardEvent];
}>();
</script>

<template>
  <button
    class="n-button"
    v-bind="buttonProps"
    data-scope="button"
    data-part="root"
    @blur="emit('blur', $event)"
    @click="emit('click', $event)"
    @dblclick="emit('dblclick', $event)"
    @focus="emit('focus', $event)"
    @keydown="emit('keydown', $event)"
    @keyup="emit('keyup', $event)"
  >
    <slot />
  </button>
</template>

<style scoped>
.n-button {
  display: inline-flex;
  gap: var(--n-space-5);
  align-items: center;
  justify-content: center;
  min-block-size: var(--_button-min-block-size, var(--nagi-size-control));
  padding: var(--_button-padding, var(--nagi-space-control));
  border: var(--n-border-width-1) solid
    var(--_button-border-color, var(--_button-tone-border, var(--nagi-color-border)));
  border-radius: var(--_button-radius, var(--nagi-radius-control));
  background: var(--_button-background, var(--nagi-color-surface));
  color: var(--_button-color, var(--_button-tone-color, var(--nagi-color-text)));
  font: inherit;
  font-size: var(--_button-font-size, 1em);
  font-weight: 650;
  cursor: pointer;

  &:hover {
    background: var(
      --_button-hover-background,
      var(--_button-tone-surface, var(--nagi-color-surface-active))
    );
  }

  &:focus-visible {
    outline: none;
    border-color: var(--nagi-color-focus-ring);
    box-shadow: var(--nagi-shadow-focus);
  }

  &:disabled,
  &[aria-disabled="true"] {
    color: var(--nagi-color-text-disabled);
    background: var(--nagi-color-surface);
    cursor: not-allowed;
  }
}

@media (forced-colors: active) {
  .n-button:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: var(--n-border-width-2);
  }
}
</style>
