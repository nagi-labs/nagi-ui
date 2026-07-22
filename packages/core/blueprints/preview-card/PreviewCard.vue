<script setup lang="ts">
import {
  mergeNagiProps,
  usePreviewCard,
  type AnchorArea,
} from "@nagi-labs/nagi-ui";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    href: string;
    label: string;
    title: string;
    description?: string;
    openDelay?: number;
    closeDelay?: number;
    disabled?: boolean;
    area?: AnchorArea;
    offset?: number;
  }>(),
  {
    openDelay: 600,
    closeDelay: 300,
    disabled: false,
    area: "block-end",
    offset: 8,
  },
);

const open = defineModel<boolean>("open", { default: false });
const preview = usePreviewCard(props, open);

defineExpose({ show: preview.show, hide: preview.hide });
</script>

<template>
  <span class="n-preview-card">
    <a
      class="link"
      :href="href"
      v-bind="mergeNagiProps(preview.triggerProps, $attrs)"
    >
      {{ label }}
    </a>
    <span class="unit" popover v-bind="preview.previewProps">
      <span class="item -metadata">
        <span class="title">{{ title }}</span>
        <span v-if="description" class="text">{{ description }}</span>
      </span>
      <span v-if="$slots.default" class="item -extra">
        <slot />
      </span>
    </span>
  </span>
</template>

<style scoped>
.n-preview-card {
  display: inline-block;
  color: var(--nagi-color-text);

  > .link {
    color: var(--nagi-color-accent);
    text-decoration: underline;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.16em;

    &:focus-visible {
      outline: none;
      border-radius: var(--nagi-radius-item);
      box-shadow: var(--nagi-shadow-focus);
    }
  }

  > .unit {
    inline-size: min(20rem, calc(100vi - 2rem));
    margin: 0;
    padding: 1rem;
    border: 1px solid var(--nagi-color-border-muted);
    border-radius: var(--nagi-radius-overlay);
    background: var(--nagi-color-surface);
    color: var(--nagi-color-text);
    box-shadow: var(--nagi-shadow-overlay);
    opacity: 0;
    translate: 0 -0.35rem;
    transition:
      opacity 0.16s,
      translate 0.16s,
      overlay 0.16s allow-discrete,
      display 0.16s allow-discrete;

    > .item.-metadata,
    > .item.-metadata > .title,
    > .item.-metadata > .text,
    > .item.-extra {
      display: block;
    }

    > .item.-metadata > .title {
      font-weight: 700;
    }

    > .item.-metadata > .text {
      margin-block-start: 0.35rem;
      color: var(--nagi-color-text-muted);
      font-size: var(--nagi-font-size-label);
    }

    > .item.-extra {
      margin-block-start: 0.75rem;
    }

    &:popover-open {
      display: block;
      opacity: 1;
      translate: 0 0;

      @starting-style {
        opacity: 0;
        translate: 0 -0.35rem;
      }
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .n-preview-card > .unit {
    translate: 0;
    transition-duration: 0s;
  }
}

@media (forced-colors: active) {
  .n-preview-card > .link:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
    box-shadow: none;
  }

  .n-preview-card > .unit {
    border-color: CanvasText;
    box-shadow: none;
  }
}
</style>
