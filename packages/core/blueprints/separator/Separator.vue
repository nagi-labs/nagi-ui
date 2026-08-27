<script setup lang="ts">
defineOptions({ inheritAttrs: false });

withDefaults(
  defineProps<{
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
    v-bind="$attrs"
    class="n-separator"
  />
  <div
    v-else
    v-bind="$attrs"
    class="n-separator"
    :data-orientation="orientation"
    :role="decorative ? undefined : 'separator'"
    :aria-orientation="!decorative && orientation === 'vertical' ? 'vertical' : undefined"
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
