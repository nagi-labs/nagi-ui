<script setup lang="ts">
import { ref } from "vue";

import { useCalendar } from "@nagi-labs/nagi-ui";
import { useCalendarNativeForm } from "@nagi-labs/nagi-ui/component-controls";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    label: string;
    id?: string;
    name?: string;
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
    validationMessage: "Choose an available date.",
    previousLabel: "Previous month",
    nextLabel: "Next month",
  },
);

const model = defineModel<string | null>({ default: null });
const formControl = ref<HTMLInputElement | null>(null);
const calendar = useCalendar(props, model);
useCalendarNativeForm(formControl, calendar);
</script>

<template>
  <div v-bind="$attrs" class="n-calendar">
    <header class="header">
      <button v-bind="calendar.previousButtonProps" class="button -previous">‹</button>
      <h2 class="title" aria-live="polite">{{ calendar.monthLabel.value }}</h2>
      <button v-bind="calendar.nextButtonProps" class="button -next">›</button>
    </header>
    <table
      v-bind="calendar.gridProps"
      class="table"
      :aria-describedby="calendar.isInvalid.value ? `${calendar.gridProps.id}-error` : undefined"
    >
      <thead class="rowgroup -head">
        <tr class="row">
          <th v-for="weekday in calendar.weekdayLabels.value" :key="weekday" class="cell -head" scope="col">
            {{ weekday }}
          </th>
        </tr>
      </thead>
      <tbody class="rowgroup -dates">
        <tr v-for="(week, index) in calendar.weeks.value" :key="index" class="row">
          <td
            v-for="cell in week"
            :key="cell.key"
            v-bind="calendar.gridCellProps(cell)"
            class="cell"
            :data-outside-month="cell.outsideMonth || undefined"
          >
            <button v-bind="calendar.cellButtonProps(cell)" class="button -day">{{ cell.day }}</button>
          </td>
        </tr>
      </tbody>
    </table>
    <span
      v-if="calendar.isInvalid.value"
      :id="`${calendar.gridProps.id}-error`"
      class="text -validation"
      role="alert"
    >{{ validationMessage }}</span>
    <input ref="formControl" v-bind="calendar.formValueProps" class="input -form-value" />
  </div>
</template>

<style scoped>
.n-calendar {
  display: grid;
  gap: var(--nagi-space-item-gap);
  inline-size: fit-content;
  color: var(--nagi-color-text);

  > .text.-validation {
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
      border: 1px solid var(--nagi-color-border);
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

    > .rowgroup.-head > .row > .cell.-head {
      min-inline-size: var(--nagi-size-control);
      block-size: var(--nagi-size-control);
      color: var(--nagi-color-text-muted);
      font-size: var(--nagi-font-size-label);
      font-weight: 650;
    }

    > .rowgroup.-dates > .row > .cell {
      padding: 0;

      > .button.-day {
        inline-size: var(--nagi-size-control);
        min-block-size: var(--nagi-size-control);
        padding: 0;
        border: 1px solid transparent;
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

      &[data-outside-month] > .button.-day {
        color: var(--nagi-color-text-muted);
      }

      &[aria-selected="true"] > .button.-day {
        background: var(--nagi-color-surface-accent);
        color: var(--nagi-color-text);
        box-shadow: inset 0 0 0 1px var(--nagi-color-accent);
      }
    }
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
  .n-calendar > .header > .button:focus-visible,
  .n-calendar > .table > .rowgroup.-dates > .row > .cell > .button.-day:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }

  .n-calendar > .table > .rowgroup.-dates > .row > .cell[aria-selected="true"] > .button.-day {
    outline: 2px solid CanvasText;
  }
}
</style>
