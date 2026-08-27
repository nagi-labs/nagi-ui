<script lang="ts">
export interface CarouselItem {
  key: string;
  label: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
}
</script>

<script setup lang="ts">
import { ref } from "vue";
import { useCarousel } from "@nagi-labs/nagi-ui";

const props = withDefaults(defineProps<{
  items: readonly CarouselItem[];
  label?: string;
  previousLabel?: string;
  nextLabel?: string;
  trackLabel?: string;
  formatAnnouncement?: (position: number | null, count: number) => string;
  formatSlideLabel?: (item: CarouselItem, position: number, count: number) => string;
  loop?: boolean;
  disabled?: boolean;
}>(), {
  label: "Carousel",
  previousLabel: "Previous slide",
  nextLabel: "Next slide",
  loop: false,
  disabled: false,
});

const index = defineModel<number>({ default: 0 });
const track = ref<HTMLElement | null>(null);
const carousel = useCarousel(props, index);
</script>

<template>
  <section v-bind="carousel.rootProps" class="n-carousel">
    <div class="actions">
      <button v-bind="carousel.previousButtonProps" class="button -previous">‹</button>
      <output class="output -announcement" aria-live="polite">{{ carousel.announcement.value }}</output>
      <button v-bind="carousel.nextButtonProps" class="button -next">›</button>
    </div>
    <div
      v-bind="carousel.trackProps"
      :ref="(element) => { track = element as HTMLElement | null; carousel.setTrack(element as Element | null); }"
      class="unit -viewport"
    >
      <article
        v-for="(item, itemIndex) in items"
        :key="item.key"
        v-bind="carousel.slideProps(item, itemIndex)"
        class="article -slide"
      >
        <img v-if="item.imageSrc" class="image" :src="item.imageSrc" :alt="item.imageAlt ?? ''" />
        <h2 class="title">{{ item.label }}</h2>
        <p v-if="item.description" class="text -description">{{ item.description }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.n-carousel {
  display: grid;
  gap: var(--nagi-space-item-gap);
  color: var(--nagi-color-text);

  > .actions {
    display: flex;
    gap: var(--nagi-space-item-gap);
    align-items: center;
    justify-content: space-between;

    > .button {
      min-inline-size: var(--nagi-size-control);
      min-block-size: var(--nagi-size-control);
      border: var(--n-border-width-1) solid var(--nagi-color-border);
      border-radius: var(--nagi-radius-control);
      background: var(--nagi-color-surface);
      color: inherit;
      font: inherit;
      cursor: pointer;
      &:focus-visible { outline: none; box-shadow: var(--nagi-shadow-focus); }
      &:disabled { color: var(--nagi-color-text-disabled); cursor: not-allowed; }
    }

    > .output.-announcement { color: var(--nagi-color-text-muted); font-size: var(--nagi-font-size-label); }
  }

  > .unit.-viewport {
    display: flex;
    overflow: auto;
    scroll-snap-type: inline mandatory;
    scroll-behavior: smooth;
    scrollbar-color: var(--nagi-color-border) var(--nagi-color-surface);
    &:focus-visible { outline: none; box-shadow: var(--nagi-shadow-focus); }

    > .article.-slide {
      box-sizing: border-box;
      flex: 0 0 100%;
      padding: var(--nagi-space-surface-inset);
      border: var(--n-border-width-1) solid var(--nagi-color-border);
      border-radius: var(--nagi-radius-item);
      background: var(--nagi-color-surface);
      scroll-snap-align: start;

      > .image { display: block; max-inline-size: 100%; block-size: auto; border-radius: var(--nagi-radius-item); }
      > .title { margin: 0; font-size: inherit; }
      > .text.-description { margin-block: var(--nagi-space-item-gap) 0; color: var(--nagi-color-text-muted); }
    }
  }

  &[aria-disabled="true"] > .unit.-viewport { overflow: hidden; }
}

@media (prefers-reduced-motion: reduce) { .n-carousel > .unit.-viewport { scroll-behavior: auto; } }
@media (forced-colors: active) {
  .n-carousel > .actions > .button:focus-visible,
  .n-carousel > .unit.-viewport:focus-visible { outline: 2px solid Highlight; }
}
</style>
