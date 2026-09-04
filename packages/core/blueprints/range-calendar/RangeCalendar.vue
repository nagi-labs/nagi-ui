<script setup lang="ts">
import { ref, type StyleValue } from "vue";

import { useRangeCalendar, type RangeCalendarValue } from "@nagi-labs/nagi-ui";
import { useRangeCalendarNativeForm } from "@nagi-labs/nagi-ui/component-controls";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    id?: string;
    class?: string;
    style?: StyleValue;
    title?: string;
    startName?: string;
    endName?: string;
    form?: string;
    locale?: string;
    timeZone?: string;
    min?: string;
    max?: string;
    unavailableDates?: readonly string[];
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    invalid?: boolean;
    validationMessage?: string;
    previousLabel?: string;
    nextLabel?: string;
    defaultVisibleMonth?: string;
  }>(),
  {
    locale: "en-US",
    timeZone: "UTC",
    unavailableDates: () => [],
    disabled: false,
    readOnly: false,
    required: false,
    invalid: false,
    validationMessage: "Choose an available date range.",
    previousLabel: "Previous month",
    nextLabel: "Next month",
  },
);

const model = defineModel<RangeCalendarValue | null>({ default: null });
const startFormControl = ref<HTMLInputElement | null>(null);
const endFormControl = ref<HTMLInputElement | null>(null);
const range = useRangeCalendar(props, model);
useRangeCalendarNativeForm({ start: startFormControl, end: endFormControl }, range);
</script>

<template>
  <div
    class="n-range-calendar"
    :class="props.class"
    :style="props.style"
    :title="props.title"
  >
    <header class="header">
      <button
        v-bind="range.previousButtonProps"
        class="button -previous"
      >
        ‹
      </button>
      <h2
        class="title"
        aria-live="polite"
      >
        {{ range.monthLabel.value }}
      </h2>
      <button
        v-bind="range.nextButtonProps"
        class="button -next"
      >
        ›
      </button>
    </header>
    <table
      v-bind="range.gridProps"
      class="table"
      :aria-describedby="range.isInvalid.value ? `${range.gridProps.id}-error` : undefined"
    >
      <thead class="thead">
        <tr class="row">
          <th
            v-for="weekday in range.weekdayLabels.value"
            :key="weekday"
            class="cell"
            scope="col"
          >
            {{ weekday }}
          </th>
        </tr>
      </thead>
      <tbody class="tbody">
        <tr
          v-for="(week, index) in range.weeks.value"
          :key="index"
          class="row"
        >
          <td
            v-for="cell in week"
            :key="cell.key"
            v-bind="range.gridCellProps(cell)"
            class="cell"
            :data-outside-month="cell.outsideMonth || undefined"
            :data-preview="cell.preview || undefined"
            :data-range-start="cell.rangeStart || undefined"
            :data-range-end="cell.rangeEnd || undefined"
          >
            <button
              v-bind="range.cellButtonProps(cell)"
              class="button -day"
            >
              {{ cell.day }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <span
      class="status"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ range.announcement.value }}
    </span>
    <span
      v-if="range.isInvalid.value"
      :id="`${range.gridProps.id}-error`"
      class="alert"
      role="alert"
      >{{ validationMessage }}</span
    >
    <input
      ref="startFormControl"
      v-bind="range.startFormValueProps"
      class="input -form-value"
    />
    <input
      ref="endFormControl"
      v-bind="range.endFormValueProps"
      class="input -form-value"
    />
  </div>
</template>

<style scoped>
.n-range-calendar {
  display: grid;
  gap: var(--nagi-space-item-gap);
  inline-size: fit-content;
  color: var(--nagi-color-text);

  > .alert {
    color: var(--nagi-color-danger);
    font-size: var(--nagi-font-size-label);
  }

  > .header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--nagi-space-item-gap);

    > .title {
      margin: 0;
      text-align: center;
      font-size: var(--nagi-font-size-label);
    }

    > .button {
      inline-size: var(--nagi-size-control);
      min-block-size: var(--nagi-size-control);
      padding: 0;
      border: var(--n-border-width-1) solid var(--nagi-color-border);
      border-radius: var(--nagi-radius-control);
      background: var(--nagi-color-surface);
      color: inherit;
      font: inherit;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: var(--nagi-color-surface-active);
      }
      &:focus-visible {
        outline: none;
        border-color: var(--nagi-color-focus-ring);
        box-shadow: var(--nagi-shadow-focus);
      }
      &:disabled {
        color: var(--nagi-color-text-disabled);
        cursor: not-allowed;
      }
    }
  }

  > .table {
    border-collapse: collapse;

    > .thead {
      > .row {
        > .cell {
          min-inline-size: var(--nagi-size-control);
          block-size: var(--nagi-size-control);
          color: var(--nagi-color-text-muted);
          font-size: var(--nagi-font-size-label);
          font-weight: 650;
        }
      }
    }

    > .tbody {
      > .row {
        > .cell {
          padding: 0;

          > .button.-day {
            inline-size: var(--nagi-size-control);
            min-block-size: var(--nagi-size-control);
            padding: 0;
            border: var(--n-border-width-1) solid transparent;
            border-radius: var(--nagi-radius-control);
            background: transparent;
            color: inherit;
            font: inherit;
            font-variant-numeric: tabular-nums;
            cursor: pointer;

            &:hover:not(:disabled) {
              background: var(--nagi-color-surface-active);
            }
            &:focus-visible {
              outline: none;
              border-color: var(--nagi-color-focus-ring);
              box-shadow: var(--nagi-shadow-focus);
            }
            &:disabled {
              color: var(--nagi-color-text-disabled);
              cursor: not-allowed;
            }
          }

          &[data-outside-month] {
            > .button.-day {
              color: var(--nagi-color-text-muted);
            }
          }
          &[data-preview] {
            > .button.-day {
              background: var(--nagi-color-surface-active);
            }
          }
          &[aria-selected="true"] {
            > .button.-day {
              border-radius: 0;
              background: var(--nagi-color-surface-accent);
              color: var(--nagi-color-text);
              box-shadow: inset 0 0 0 var(--n-border-width-1) var(--nagi-color-accent);
            }
          }
          &[data-range-start] {
            > .button.-day {
              border-start-start-radius: var(--nagi-radius-control);
              border-end-start-radius: var(--nagi-radius-control);
            }
          }
          &[data-range-end] {
            > .button.-day {
              border-start-end-radius: var(--nagi-radius-control);
              border-end-end-radius: var(--nagi-radius-control);
            }
          }
        }
      }
    }
  }

  > .status {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    clip-path: inset(50%);
    overflow: hidden;
    white-space: nowrap;
  }

  > .input.-form-value {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding: 0;
    border: 0;
    clip-path: inset(50%);
    overflow: hidden;
    white-space: nowrap;
  }
}

@media (forced-colors: active) {
  .n-range-calendar {
    > .header {
      > .button:focus-visible {
        outline: 2px solid Highlight;
        outline-offset: var(--n-border-width-2);
      }
    }

    > .table {
      > .tbody {
        > .row {
          > .cell {
            > .button.-day:focus-visible {
              outline: 2px solid Highlight;
              outline-offset: var(--n-border-width-2);
            }

            &[aria-selected="true"] {
              > .button.-day {
                outline: 2px solid CanvasText;
              }
            }
          }
        }
      }
    }
  }
}
</style>
