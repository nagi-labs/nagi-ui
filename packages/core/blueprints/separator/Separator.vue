<script setup lang="ts">
import type { StyleValue } from "vue";

defineOptions({ inheritAttrs: false });

withDefaults(
  defineProps<{
    id?: string;
    class?: string;
    style?: StyleValue;
    title?: string;
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
    orientation?: "horizontal" | "vertical";
    /** Remove separator semantics when the line is only visual decoration. */
    decorative?: boolean;
  }>(),
  {
    orientation: "horizontal",
    decorative: false,
  },
);
</script>

<template>
  <hr
    v-if="orientation === 'horizontal' && !decorative"
    class="n-separator"
    :id="id"
    :class="$props.class"
    :style="$props.style"
    :title="title"
    :aria-label="ariaLabel"
    :aria-labelledby="ariaLabelledby"
    :aria-describedby="ariaDescribedby"
  />
  <div
    v-else
    class="n-separator"
    :id="id"
    :class="$props.class"
    :style="$props.style"
    :title="title"
    :data-orientation="orientation"
    :role="decorative ? undefined : 'separator'"
    :aria-orientation="!decorative && orientation === 'vertical' ? 'vertical' : undefined"
    :aria-label="!decorative ? ariaLabel : undefined"
    :aria-labelledby="!decorative ? ariaLabelledby : undefined"
    :aria-describedby="!decorative ? ariaDescribedby : undefined"
    :aria-hidden="decorative ? 'true' : undefined"
  ></div>
</template>

<style scoped>
.n-separator {
  display: block;
  box-sizing: border-box;
  border: 0;
  border-block-start: var(--n-border-width-1) solid var(--nagi-color-border-muted);

  &[data-orientation="vertical"] {
    inline-size: 1px;
    min-block-size: 1em;
    border-block-start: 0;
    border-inline-start: var(--n-border-width-1) solid var(--nagi-color-border-muted);
  }
}
</style>
