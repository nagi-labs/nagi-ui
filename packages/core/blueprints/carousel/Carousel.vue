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
import type { StyleValue } from "vue";
import { useCarousel } from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    items: readonly CarouselItem[];
    id?: string;
    class?: string;
    style?: StyleValue;
    title?: string;
    label: string;
    slidesLabel?: string;
    carouselRoleDescription?: string;
    slidesRoleDescription?: string;
    slideRoleDescription?: string;
    landmark?: boolean;
    previousLabel?: string;
    nextLabel?: string;
    formatAnnouncement?: (position: number | null, count: number) => string;
    formatSlideLabel?: (item: CarouselItem, position: number, count: number) => string;
    loop?: boolean;
    disabled?: boolean;
  }>(),
  {
    landmark: false,
    carouselRoleDescription: "carousel",
    slidesRoleDescription: "slides",
    slideRoleDescription: "slide",
    previousLabel: "Previous slide",
    nextLabel: "Next slide",
    loop: false,
    disabled: false,
  },
);

const index = defineModel<number>({ default: 0 });
const carousel = useCarousel(props, index);
</script>

<template>
  <section
    v-bind="carousel.rootProps"
    data-scope="carousel"
    data-part="root"
    class="n-carousel"
    :class="props.class"
    :style="props.style"
    :title="props.title"
  >
    <div class="actions">
      <button
        v-bind="carousel.previousButtonProps"
        class="button -previous"
      >
        ‹
      </button>
      <output
        class="output -announcement"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {{ carousel.announcement.value }}
      </output>
      <button
        v-bind="carousel.nextButtonProps"
        class="button -next"
      >
        ›
      </button>
    </div>
    <div
      v-bind="carousel.viewportProps"
      data-scope="carousel"
      data-part="viewport"
      class="unit -viewport"
    >
      <div class="seg -slides">
        <article
          v-for="(item, itemIndex) in items"
          :key="item.key"
          v-bind="carousel.slideProps(item, itemIndex)"
          data-scope="carousel"
          data-part="slide"
          class="article -slide"
        >
          <img
            v-if="item.imageSrc"
            class="image"
            :src="item.imageSrc"
            :alt="item.imageAlt ?? ''"
          />
          <h2
            v-bind="carousel.slideLabelProps(itemIndex)"
            class="title"
          >
            {{ item.label }}
            <span class="text -position">, {{ carousel.slidePosition(item, itemIndex) }}</span>
          </h2>
          <p
            v-if="item.description"
            class="text -description"
          >
            {{ item.description }}
          </p>
        </article>
      </div>
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
      &:focus-visible {
        outline: none;
        box-shadow: var(--nagi-shadow-focus);
      }
      &:disabled,
      &[aria-disabled="true"] {
        color: var(--nagi-color-text-disabled);
        cursor: not-allowed;
      }
    }

    > .output.-announcement {
      color: var(--nagi-color-text-muted);
      font-size: var(--nagi-font-size-label);
    }
  }

  > .unit.-viewport {
    overflow: auto;
    scroll-snap-type: inline mandatory;
    scroll-behavior: smooth;
    scrollbar-color: var(--nagi-color-border) var(--nagi-color-surface);
    &:focus-visible {
      outline: none;
      box-shadow: var(--nagi-shadow-focus);
    }

    > .seg.-slides {
      display: flex;
      inline-size: 100%;
    }

    .article.-slide {
      box-sizing: border-box;
      flex: 0 0 100%;
      padding: var(--nagi-space-surface-inset);
      border: var(--n-border-width-1) solid var(--nagi-color-border);
      border-radius: var(--nagi-radius-item);
      background: var(--nagi-color-surface);
      scroll-snap-align: start;

      > .image {
        display: block;
        max-inline-size: 100%;
        block-size: auto;
        border-radius: var(--nagi-radius-item);
      }
      > .title {
        margin: 0;
        font-size: inherit;

        > .text.-position {
          position: absolute;
          inset: 0 auto auto 0;
          inline-size: 1px;
          block-size: 1px;
          overflow: hidden;
          clip-path: inset(50%);
          white-space: nowrap;
        }
      }
      > .text.-description {
        margin-block: var(--nagi-space-item-gap) 0;
        color: var(--nagi-color-text-muted);
      }
    }
  }

  &[data-disabled] > .unit.-viewport {
    overflow: hidden;
  }
}

@media (prefers-reduced-motion: reduce) {
  .n-carousel > .unit.-viewport {
    scroll-behavior: auto;
  }
}
@media (forced-colors: active) {
  .n-carousel > .actions > .button:focus-visible,
  .n-carousel > .unit.-viewport:focus-visible {
    outline: 2px solid Highlight;
  }
}
</style>
