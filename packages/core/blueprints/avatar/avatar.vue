<script setup lang="ts">
import { useAvatar } from "@nagi-labs/nagi-ui/component-controls";
import { useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  src?: string;
  alt: string;
  fallback?: string;
}>();

defineSlots<{
  fallback(props: { fallback: string }): unknown;
}>();

const avatar = useAvatar(props, useAttrs());
const { fallbackText, hasImage } = avatar;
</script>

<template>
  <span
    class="n-avatar"
    v-bind="avatar.avatarProps"
  >
    <span class="unit">
      <slot
        name="fallback"
        :fallback="fallbackText"
        >{{ fallbackText }}</slot
      >
    </span>
    <img
      v-if="hasImage"
      :key="src"
      :ref="avatar.setImage"
      class="image"
      :src="src"
      alt=""
      @error="avatar.onImageError"
    />
  </span>
</template>

<style scoped>
.n-avatar {
  --local-round: 999px;

  display: inline-grid;
  overflow: hidden;
  inline-size: 2.5rem;
  block-size: 2.5rem;
  border-radius: var(--local-round);
  background: var(--nagi-color-surface-active);
  color: var(--nagi-color-text);
  vertical-align: middle;

  > .unit,
  > .image {
    grid-area: 1 / 1;
    inline-size: 100%;
    block-size: 100%;
  }

  > .unit {
    display: grid;
    place-items: center;
    font-size: var(--nagi-font-size-label);
    font-weight: 700;
    line-height: 1;
  }

  > .image {
    object-fit: cover;
    background: var(--nagi-color-surface-active);
  }
}
</style>
