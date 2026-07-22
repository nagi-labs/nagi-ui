<script lang="ts">
export interface StepperItem {
  key: string;
  label: string;
  description?: string;
  disabled?: boolean;
}
</script>

<script setup lang="ts">
defineProps<{
  label: string;
  items: readonly StepperItem[];
}>();

const currentKey = defineModel<string>("currentKey", { required: true });
</script>

<template>
  <nav class="n-stepper" :aria-label="label">
    <ol class="list">
      <li v-for="(item, index) in items" :key="item.key" class="item">
        <button
          class="button"
          type="button"
          :aria-current="item.key === currentKey ? 'step' : undefined"
          :disabled="item.disabled"
          @click="currentKey = item.key"
        >
          <span class="icon" aria-hidden="true">{{ index + 1 }}</span>
          <span class="unit">
            <span class="title">{{ item.label }}</span>
            <span v-if="item.description" class="text">
              {{ item.description }}
            </span>
          </span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.n-stepper {
  color: var(--nagi-color-text);
  font: inherit;

  > .list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--nagi-space-item-gap);
    margin: 0;
    padding: 0;
    list-style: none;

    > .item {
      display: flex;
      flex: 1 1 12rem;
      min-inline-size: 0;

      > .button {
        display: grid;
        grid-template-columns: 2rem minmax(0, 1fr);
        gap: var(--nagi-space-item-gap);
        align-items: start;
        inline-size: 100%;
        min-block-size: var(--nagi-size-control);
        padding: var(--nagi-space-control);
        border: 1px solid var(--nagi-color-border);
        border-radius: var(--nagi-radius-control);
        background: var(--nagi-color-surface);
        color: inherit;
        font: inherit;
        text-align: start;
        cursor: pointer;

        &:hover:not(:disabled) {
          background: var(--nagi-color-surface-active);
        }

        &:focus-visible {
          outline: none;
          border-color: var(--nagi-color-focus-ring);
          box-shadow: var(--nagi-shadow-focus);
        }

        &[aria-current="step"] {
          > .icon {
            border-width: 2px;
            border-color: var(--nagi-color-accent);
            background: var(--nagi-color-surface-accent);
            color: var(--nagi-color-accent);
          }

          > .unit > .title {
            color: var(--nagi-color-accent);
          }
        }

        &:disabled {
          color: var(--nagi-color-text-disabled);
          cursor: not-allowed;

          > .icon {
            border-color: var(--nagi-color-text-disabled);
            background: var(--nagi-color-surface);
            color: var(--nagi-color-text-disabled);
          }

          > .unit > :is(.title, .text) {
            color: var(--nagi-color-text-disabled);
          }
        }

        > .icon {
          display: inline-grid;
          place-items: center;
          box-sizing: border-box;
          inline-size: 2rem;
          block-size: 2rem;
          border: 1px solid var(--nagi-color-border-muted);
          border-radius: 999px;
          font-weight: 700;
          line-height: 1;
        }

        > .unit {
          display: grid;
          gap: 0.2rem;
          min-inline-size: 0;

          > .title {
            font-weight: 650;
          }

          > .text {
            color: var(--nagi-color-text-muted);
            font-size: var(--nagi-font-size-label);
            line-height: 1.35;
          }
        }
      }
    }
  }
}

@media (forced-colors: active) {
  .n-stepper > .list > .item > .button[aria-current="step"] > .icon {
    border-width: 3px;
  }

  .n-stepper > .list > .item > .button:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
</style>
