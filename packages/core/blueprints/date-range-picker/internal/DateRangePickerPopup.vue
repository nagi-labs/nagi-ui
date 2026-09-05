<script setup lang="ts">
import { useDateRangePickerContext } from "./date-range-picker-context.ts";

defineOptions({ inheritAttrs: false });

const picker = useDateRangePickerContext();
</script>

<template>
  <div
    v-bind="picker.popover.popoverProps"
    class="n-date-range-picker-popup"
    role="dialog"
    popover
    :aria-label="picker.calendarLabel.value"
  >
    <header class="header">
      <button
        v-bind="picker.calendar.previousButtonProps"
        class="button -previous"
      >
        ‹
      </button>
      <h2
        class="title"
        aria-live="polite"
      >
        {{ picker.calendar.monthLabel.value }}
      </h2>
      <button
        v-bind="picker.calendar.nextButtonProps"
        class="button -next"
      >
        ›
      </button>
    </header>
    <table
      v-bind="picker.calendar.gridProps"
      class="table"
      :aria-describedby="picker.error.describedBy.value"
    >
      <thead class="thead">
        <tr class="row">
          <th
            v-for="weekday in picker.calendar.weekdayLabels.value"
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
          v-for="(week, index) in picker.calendar.weeks.value"
          :key="index"
          class="row"
        >
          <td
            v-for="cell in week"
            :key="cell.key"
            v-bind="picker.calendar.gridCellProps(cell)"
            class="cell"
            :data-outside-month="cell.outsideMonth || undefined"
            :data-preview="cell.preview || undefined"
            :data-range-start="cell.rangeStart || undefined"
            :data-range-end="cell.rangeEnd || undefined"
          >
            <button
              v-bind="picker.calendar.cellButtonProps(cell)"
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
      {{ picker.calendar.announcement.value }}
    </span>
  </div>
</template>

<style scoped>
.n-date-range-picker-popup {
  margin: 0;
  padding: var(--nagi-space-control);
  border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
  border-radius: var(--nagi-radius-overlay);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);
  box-shadow: var(--nagi-shadow-overlay);

  > .status {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    clip-path: inset(50%);
    overflow: hidden;
    white-space: nowrap;
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
}

@media (forced-colors: active) {
  .n-date-range-picker-popup {
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
