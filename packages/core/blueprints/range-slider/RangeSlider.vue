<script setup lang="ts">
import { computed, ref, useId } from "vue";

import { useRangeSlider } from "@nagi-labs/nagi-ui/component-controls";

const props = withDefaults(
  defineProps<{
    label: string;
    lowerLabel?: string;
    upperLabel?: string;
    lowerId?: string;
    upperId?: string;
    lowerName?: string;
    upperName?: string;
    form?: string;
    min?: number;
    max?: number;
    step?: number | "any";
    disabled?: boolean;
  }>(),
  {
    lowerLabel: "Minimum",
    upperLabel: "Maximum",
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
  },
);

const model = defineModel<readonly [number, number]>({
  default: () => [0, 100],
});
const lowerInput = ref<HTMLInputElement | null>(null);
const upperInput = ref<HTMLInputElement | null>(null);
const generatedLowerId = useId();
const generatedUpperId = useId();
const { lowerValue, upperValue, railProps } = useRangeSlider(
  lowerInput,
  upperInput,
  model,
);
const lowerMax = computed(() => Math.max(props.min, Math.min(props.max, upperValue.value)));
const upperMin = computed(() => Math.min(props.max, Math.max(props.min, lowerValue.value)));
const trackStyle = computed(() => {
  const span = props.max - props.min;
  const position = (value: number) => {
    if (span <= 0) return 0;
    return Math.min(100, Math.max(0, ((value - props.min) / span) * 100));
  };
  return {
    "--range-start": `${position(lowerValue.value)}%`,
    "--range-end": `${100 - position(upperValue.value)}%`,
  };
});
</script>

<template>
  <fieldset class="n-range-slider" :disabled="disabled">
    <legend class="legend">{{ label }}</legend>
    <div class="unit">
      <div class="item -lower">
        <label class="label" :for="lowerId ?? generatedLowerId">{{ lowerLabel }}</label>
        <output class="output" :for="lowerId ?? generatedLowerId">{{ lowerValue }}</output>
      </div>
      <div class="item -upper">
        <label class="label" :for="upperId ?? generatedUpperId">{{ upperLabel }}</label>
        <output class="output" :for="upperId ?? generatedUpperId">{{ upperValue }}</output>
      </div>
      <div class="item -rail" :style="trackStyle" v-bind="railProps">
        <input
          :id="lowerId ?? generatedLowerId"
          ref="lowerInput"
          v-model.number="lowerValue"
          class="input -lower"
          type="range"
          :name="lowerName"
          :form="form"
          :min="min"
          :max="lowerMax"
          :step="step"
        />
        <input
          :id="upperId ?? generatedUpperId"
          ref="upperInput"
          v-model.number="upperValue"
          class="input -upper"
          type="range"
          :name="upperName"
          :form="form"
          :min="upperMin"
          :max="max"
          :step="step"
        />
      </div>
    </div>
  </fieldset>
</template>

<style scoped>
.n-range-slider {
  min-inline-size: 0;
  padding: 0;
  border: 0;
  color: var(--nagi-color-text);
  font: inherit;

  > .legend {
    margin-block-end: var(--nagi-space-item-gap);
    color: var(--nagi-color-text-muted);
    font-size: var(--nagi-font-size-label);
    font-weight: 650;
  }

  > .unit {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--nagi-space-item-gap);

    > .item {
      display: flex;
      gap: var(--nagi-space-item-gap);
      align-items: center;

      &.-upper {
        justify-content: flex-end;
        text-align: end;
      }

      > .label {
        color: var(--nagi-color-text-muted);
        font-size: var(--nagi-font-size-label);
        font-weight: 650;
      }

      > .output {
        min-inline-size: 3ch;
        color: var(--nagi-color-text);
        font-variant-numeric: tabular-nums;
        text-align: end;
      }
    }

    > .item.-rail {
      position: relative;
      grid-column: 1 / -1;
      min-block-size: var(--nagi-size-control);
      cursor: pointer;
      touch-action: none;

      &::before {
        position: absolute;
        inset-block-start: 50%;
        inset-inline: 0;
        block-size: 2px;
        border-radius: var(--nagi-radius-control);
        background: var(--nagi-color-border);
        content: "";
        transform: translateY(-50%);
      }

      &::after {
        position: absolute;
        z-index: 1;
        inset-block-start: 50%;
        inset-inline: var(--range-start) var(--range-end);
        block-size: 2px;
        border-radius: var(--nagi-radius-control);
        background: var(--nagi-color-accent);
        content: "";
        transform: translateY(-50%);
      }

      > .input {
        position: absolute;
        z-index: 1;
        inset: 0;
        inline-size: 100%;
        min-block-size: var(--nagi-size-control);
        margin: 0;
        padding: 0;
        background: transparent;
        accent-color: var(--nagi-color-accent);
        cursor: pointer;
        pointer-events: none;
        appearance: none;

        &.-upper {
          z-index: 2;
        }

        &::-webkit-slider-runnable-track {
          block-size: 2px;
          background: transparent;
        }

        &::-moz-range-track {
          block-size: 2px;
          background: transparent;
        }

        &::-webkit-slider-thumb {
          box-sizing: border-box;
          inline-size: calc(var(--nagi-size-control) / 2);
          block-size: calc(var(--nagi-size-control) / 2);
          margin-block-start: calc((2px - var(--nagi-size-control) / 2) / 2);
          border: 2px solid var(--nagi-color-accent);
          border-radius: 50%;
          background: var(--nagi-color-surface);
          cursor: grab;
          pointer-events: none;
          appearance: none;
        }

        &::-moz-range-thumb {
          box-sizing: border-box;
          inline-size: calc(var(--nagi-size-control) / 2);
          block-size: calc(var(--nagi-size-control) / 2);
          border: 2px solid var(--nagi-color-accent);
          border-radius: 50%;
          background: var(--nagi-color-surface);
          cursor: grab;
          pointer-events: none;
        }

        &:focus-visible {
          z-index: 3;
          outline: none;
        }

        &:focus-visible::-webkit-slider-thumb {
          box-shadow: var(--nagi-shadow-focus);
        }

        &:focus-visible::-moz-range-thumb {
          box-shadow: var(--nagi-shadow-focus);
        }

        &:disabled {
          cursor: not-allowed;
        }

        &:disabled::-webkit-slider-thumb {
          border-color: var(--nagi-color-text-disabled);
          background: var(--nagi-color-surface);
          cursor: not-allowed;
        }

        &:disabled::-moz-range-thumb {
          border-color: var(--nagi-color-text-disabled);
          background: var(--nagi-color-surface);
          cursor: not-allowed;
        }
      }
    }
  }

  &:disabled > .unit > .item > :is(.label, .output) {
    color: var(--nagi-color-text-disabled);
  }

  &:disabled > .unit > .item.-rail {
    cursor: not-allowed;
  }
}

@media (forced-colors: active) {
  .n-range-slider > .unit {
    > .item.-rail {
      &::before {
        background: CanvasText;
      }

      &::after {
        background: Highlight;
      }

      > .input::-webkit-slider-thumb {
        border-color: Highlight;
        background: Canvas;
      }

      > .input::-moz-range-thumb {
        border-color: Highlight;
        background: Canvas;
      }

      > .input:focus-visible::-webkit-slider-thumb {
        outline: 2px solid Highlight;
        outline-offset: 2px;
      }

      > .input:focus-visible::-moz-range-thumb {
        outline: 2px solid Highlight;
        outline-offset: 2px;
      }

      > .input:focus-visible {
        outline: 2px solid Highlight;
        outline-offset: 2px;
      }

      > .input:disabled::-webkit-slider-thumb {
        border-color: GrayText;
      }

      > .input:disabled::-moz-range-thumb {
        border-color: GrayText;
      }
    }
  }

  .n-range-slider:disabled > .unit > .item > :is(.label, .output) {
    color: GrayText;
  }

  .n-range-slider:disabled > .unit > .item.-rail::after {
    background: GrayText;
  }
}
</style>
