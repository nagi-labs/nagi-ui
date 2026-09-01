<script setup lang="ts">
import { computed, ref, useId } from "vue";
import type { StyleValue } from "vue";

import { useRangeSlider } from "@nagi-labs/nagi-ui/component-controls";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    id?: string;
    class?: string;
    style?: StyleValue;
    title?: string;
    ariaLabel?: string;
    ariaLabelledby?: string;
    ariaDescribedby?: string;
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
const fieldsetProps = computed(() => ({
  class: props.class,
  style: props.style,
  id: props.id,
  title: props.title,
  "aria-label": props.ariaLabel,
  "aria-labelledby": props.ariaLabelledby,
  "aria-describedby": props.ariaDescribedby,
  disabled: props.disabled,
}));
const { lowerValue, upperValue, railProps } = useRangeSlider(lowerInput, upperInput, model);
const lowerInputProps = computed(() => ({
  id: props.lowerId ?? generatedLowerId,
  name: props.lowerName,
  form: props.form,
  min: props.min,
  max: props.max,
  step: props.step,
  "aria-valuemax": upperValue.value,
}));
const upperInputProps = computed(() => ({
  id: props.upperId ?? generatedUpperId,
  name: props.upperName,
  form: props.form,
  min: props.min,
  max: props.max,
  step: props.step,
  "aria-valuemin": lowerValue.value,
}));
const trackStyle = computed(() => {
  const span = props.max - props.min;
  const position = (value: number) => {
    if (span <= 0) return 0;
    return Math.min(100, Math.max(0, ((value - props.min) / span) * 100));
  };
  return {
    "--local-range-start": `${position(lowerValue.value)}%`,
    "--local-range-end": `${100 - position(upperValue.value)}%`,
  };
});
</script>

<template>
  <fieldset
    class="n-range-slider"
    v-bind="fieldsetProps"
  >
    <legend class="legend">{{ label }}</legend>
    <div class="unit">
      <div class="item -lower">
        <label
          class="label"
          :for="lowerId ?? generatedLowerId"
          >{{ lowerLabel }}</label
        >
        <output
          class="output"
          :for="lowerId ?? generatedLowerId"
          >{{ lowerValue }}</output
        >
      </div>
      <div class="item -upper">
        <label
          class="label"
          :for="upperId ?? generatedUpperId"
          >{{ upperLabel }}</label
        >
        <output
          class="output"
          :for="upperId ?? generatedUpperId"
          >{{ upperValue }}</output
        >
      </div>
      <div class="item -wide">
        <span
          class="rail"
          aria-hidden="true"
          :style="trackStyle"
          v-bind="railProps"
        ></span>
        <input
          ref="lowerInput"
          v-model.number="lowerValue"
          class="input -lower"
          type="range"
          v-bind="lowerInputProps"
        />
        <input
          ref="upperInput"
          v-model.number="upperValue"
          class="input -upper"
          type="range"
          v-bind="upperInputProps"
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

    > .item.-wide {
      position: relative;
      grid-column: 1 / -1;
      min-block-size: var(--nagi-size-control);

      > .rail {
        position: absolute;
        inset-block: 0;
        inset-inline: calc(var(--nagi-size-control) / 4);
        cursor: pointer;
        touch-action: none;

        &::before,
        &::after {
          position: absolute;
          inset-block-start: 50%;
          block-size: 2px;
          border-radius: var(--nagi-radius-control);
          content: "";
          transform: translateY(-50%);
        }

        &::before {
          inset-inline: 0;
          background: var(--nagi-color-border);
        }

        &::after {
          inset-inline: var(--local-range-start) var(--local-range-end);
          background: var(--nagi-color-accent);
        }
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
          margin-block-start: calc((var(--n-border-width-2) - var(--nagi-size-control) / 2) / 2);
          border: var(--n-border-width-2) solid var(--nagi-color-accent);
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
          border: var(--n-border-width-2) solid var(--nagi-color-accent);
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

  &:disabled > .unit > .item.-wide {
    > .rail {
      cursor: not-allowed;
    }
  }
}

@media (forced-colors: active) {
  .n-range-slider > .unit {
    > .item.-wide {
      > .rail::before {
        background: CanvasText;
      }

      > .rail::after {
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
        outline-offset: var(--n-border-width-2);
      }

      > .input:focus-visible::-moz-range-thumb {
        outline: 2px solid Highlight;
        outline-offset: var(--n-border-width-2);
      }

      > .input:focus-visible {
        outline: 2px solid Highlight;
        outline-offset: var(--n-border-width-2);
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

  .n-range-slider:disabled > .unit > .item.-wide > .rail::after {
    background: GrayText;
  }
}
</style>
