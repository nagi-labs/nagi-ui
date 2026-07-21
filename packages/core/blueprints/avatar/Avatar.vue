<script setup lang="ts">
import { useAvatar } from "@nagi-labs/nagi-ui";

const props = defineProps<{
  src?: string;
  alt: string;
  fallback?: string;
}>();

defineSlots<{
  fallback(props: { fallback: string }): unknown;
}>();

const { fallbackText, hasImage, image, onImageError } = useAvatar({
  src: () => props.src,
  alt: () => props.alt,
  fallback: () => props.fallback,
});
</script>

<template>
  <span
    class="n-avatar"
    :role="alt ? 'img' : undefined"
    :aria-label="alt || undefined"
    :aria-hidden="alt ? undefined : 'true'"
  >
    <span class="zone">
      <slot name="fallback" :fallback="fallbackText">{{ fallbackText }}</slot>
    </span>
    <img
      v-if="hasImage"
      :key="src"
      ref="image"
      class="image"
      :src="src"
      alt=""
      @error="onImageError"
    />
  </span>
</template>

<style scoped>
.n-avatar {
  display: inline-grid;
  overflow: hidden;
  inline-size: 2.5rem;
  block-size: 2.5rem;
  border-radius: 999px;
  background: var(--nagi-color-surface-active);
  color: var(--nagi-color-text);
  vertical-align: middle;

  > .zone,
  > .image {
    grid-area: 1 / 1;
    inline-size: 100%;
    block-size: 100%;
  }

  > .zone {
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
