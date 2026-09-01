<script lang="ts">
export type TableColumnAlign = "start" | "center" | "end";

export interface TableColumn<Row extends object = Record<string, unknown>> {
  key: Extract<keyof Row, string>;
  label: string;
  align?: TableColumnAlign;
  /** Render this column's body cells as native row headings. */
  rowHeader?: boolean;
}
</script>

<script setup lang="ts" generic="Row extends object">
import { computed, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    rows: readonly Row[];
    columns: readonly TableColumn<Row>[];
    /** A native table caption and accessible name. */
    caption: string;
    /** Keep the caption available to assistive technology without displaying it. */
    captionHidden?: boolean;
    emptyText?: string;
    layout?: "auto" | "fixed";
    rowKey?: Extract<keyof Row, string>;
  }>(),
  {
    captionHidden: false,
    emptyText: "No data",
    layout: "auto",
  },
);
const attrs = useAttrs();

const emptyColspan = computed(() => Math.max(1, props.columns.length));

function rowIdentity(row: Row, index: number): PropertyKey {
  if (!props.rowKey) return index;
  const value = row[props.rowKey];
  return typeof value === "string" || typeof value === "number" || typeof value === "symbol"
    ? value
    : index;
}

function headerSlotName(column: TableColumn<Row>) {
  return `header-${String(column.key)}`;
}

function cellSlotName(column: TableColumn<Row>) {
  return `cell-${String(column.key)}`;
}
</script>

<template>
  <div
    class="n-table"
    v-bind="attrs"
  >
    <table
      class="table"
      :data-layout="layout"
    >
      <caption
        class="caption"
        :data-hidden="captionHidden || undefined"
      >
        <slot
          name="caption"
          :caption="caption"
          >{{ caption }}</slot
        >
      </caption>
      <thead class="thead">
        <tr class="row">
          <th
            v-for="column in columns"
            :key="column.key"
            class="cell"
            scope="col"
            :data-align="column.align ?? 'start'"
          >
            <slot
              :name="headerSlotName(column)"
              :column="column"
            >
              {{ column.label }}
            </slot>
          </th>
        </tr>
      </thead>
      <tbody class="tbody">
        <tr
          v-for="(row, rowIndex) in rows"
          :key="rowIdentity(row, rowIndex)"
          class="row"
        >
          <template
            v-for="column in columns"
            :key="column.key"
          >
            <th
              v-if="column.rowHeader"
              class="cell"
              scope="row"
              :data-align="column.align ?? 'start'"
            >
              <slot
                :name="cellSlotName(column)"
                :row="row"
                :row-index="rowIndex"
                :column="column"
                :value="row[column.key]"
              >
                {{ row[column.key] }}
              </slot>
            </th>
            <td
              v-else
              class="cell"
              :data-align="column.align ?? 'start'"
            >
              <slot
                :name="cellSlotName(column)"
                :row="row"
                :row-index="rowIndex"
                :column="column"
                :value="row[column.key]"
              >
                {{ row[column.key] }}
              </slot>
            </td>
          </template>
        </tr>
        <tr
          v-if="rows.length === 0"
          class="row -empty"
        >
          <td
            class="cell"
            :colspan="emptyColspan"
          >
            <slot
              name="empty"
              :columns="columns"
            >
              {{ emptyText }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.n-table {
  max-inline-size: 100%;
  overflow-x: auto;
  border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
  border-radius: var(--nagi-radius-control);
  background: var(--nagi-color-surface);
  color: var(--nagi-color-text);
  font-size: var(--n-font-size-3);

  > .table {
    inline-size: 100%;
    border-collapse: collapse;
    font: inherit;

    &[data-layout="fixed"] {
      table-layout: fixed;
    }

    > .caption {
      padding: var(--n-space-5) var(--n-space-7);
      color: var(--nagi-color-text-muted);
      font-size: var(--n-font-size-3);
      font-weight: 650;
      text-align: start;

      &[data-hidden="true"] {
        position: absolute;
        inline-size: 1px;
        block-size: 1px;
        padding: 0;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
    }

    > .thead,
    > .tbody {
      > .row {
        > .cell {
          padding: var(--n-space-5) var(--n-space-7);
          border-block-end: var(--n-border-width-1) solid var(--nagi-color-border-muted);
          text-align: start;
          vertical-align: top;

          &[data-align="center"] {
            text-align: center;
          }

          &[data-align="end"] {
            text-align: end;
          }
        }
      }
    }

    > .thead > .row > .cell {
      background: var(--nagi-color-surface-accent);
      font-weight: 700;
    }

    > .tbody {
      > .row:last-child > .cell {
        border-block-end: 0;
      }

      > .row > .cell[scope="row"] {
        font-weight: 650;
      }

      > .row.-empty > .cell {
        color: var(--nagi-color-text-muted);
        text-align: center;
      }
    }
  }
}
</style>
