<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";

const props = defineProps<{
  src?: string;
  alt: string;
  fallback?: string;
}>();

defineSlots<{
  fallback(props: { fallback: string }): unknown;
}>();

const image = ref<HTMLImageElement | null>(null);
const failed = ref(false);

const fallbackText = computed(() => {
  if (props.fallback !== undefined) return props.fallback;

  const words = props.alt.trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return "?";

  const first = Array.from(words[0] ?? "")[0] ?? "";
  const last = Array.from(words.at(-1) ?? "")[0] ?? "";
  return (words.length === 1 ? first : `${first}${last}`).toUpperCase();
});

const hasImage = computed(() => Boolean(props.src) && !failed.value);

function markFailed(event: Event) {
  const target = event.currentTarget;
  if (!(target instanceof HTMLImageElement)) return;
  if (target.getAttribute("src") !== props.src) return;
  failed.value = true;
}

function detectMissedError() {
  const target = image.value;
  if (target?.complete && target.naturalWidth === 0) failed.value = true;
}

watch(
  () => props.src,
  () => {
    failed.value = false;
    void nextTick(detectMissedError);
  },
  { flush: "sync" },
);

onMounted(detectMissedError);
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
      @error="markFailed"
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
