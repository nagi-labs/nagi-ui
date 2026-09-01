# Table

`Table` presents ordinary tabular information with native HTML semantics. It
does not sort, filter, paginate, select, edit, virtualize, or manage focus as a
grid. Pass already prepared rows and compose other Nagi UI components around
it when needed.

## Basic table

```vue
<script setup lang="ts">
import { NTable, type TableColumn } from "@nagi-labs/nagi-ui/components"

interface User {
  id: number
  name: string
  email: string
}

const rows: readonly User[] = [
  { id: 1, name: "Ada Lovelace", email: "ada@example.com" },
]

const columns: readonly TableColumn<User>[] = [
  { key: "name", label: "Name", rowHeader: true },
  { key: "email", label: "Email" },
]
</script>

<template>
  <n-table
    :rows="rows"
    :columns="columns"
    caption="Users"
    row-key="id"
  />
</template>
```

`caption` is required because it gives the native table an accessible name.
Set `caption-hidden` to visually hide it while preserving it for assistive
technology. A column with `rowHeader: true` renders body cells as
`<th scope="row">`; all column headings use `<th scope="col">`.

The component renders a horizontally scrollable wrapper around:

```text
table
  caption
  thead
    tr
      th
  tbody
    tr
      th or td
```

## Custom cells and headings

Use `cell-<key>` or `header-<key>` scoped slots. The component still owns the
native `th` or `td`, so custom content cannot erase table semantics.

```vue
<n-table :rows="rows" :columns="columns" caption="Users">
  <template #header-status="{ column }">
    <abbr title="Account status">{{ column.label }}</abbr>
  </template>

  <template #cell-status="{ row, value }">
    <n-badge :label="String(value)" :tone="row.active ? 'success' : 'neutral'" />
  </template>

  <template #empty>No users match the current filters.</template>
</n-table>
```

Cell slots receive `row`, `rowIndex`, `column`, and `value`. Header slots
receive `column`. `emptyText` provides the simple empty state; the `empty`
slot customizes it. The empty cell uses a valid `colspan` for the configured
columns.

Dynamic `cell-<key>` and `header-<key>` names do not create CSS surface names.
When application CSS styles owned slot content, wrap it in the corresponding
generic surface declared by the Nagi UI preset: `n-table-cell-content` or
`n-table-header-content`. Use a static variant to distinguish a particular
column. Caption and empty slots similarly expose `n-table-caption-content` and
`n-table-empty-content`.

```vue
<n-table :rows="rows" :columns="columns" caption="Users">
  <template #cell-company="{ row }">
    <div class="n-table-cell-content -company">
      <a class="link" :href="`/customers/${row.id}`">{{ row.company }}</a>
    </div>
  </template>
</n-table>

<style scoped>
.customers-page {
  > .n-table {
    .n-table-cell-content.-company {
      > .link {
        font-weight: 600;
      }
    }
  }
}
</style>
```

The generic surface is intentional: column keys belong to application data and
cannot be exhaustively declared by the library preset. If the slot content is
not styled by the parent surface, no wrapper is needed.

Use a column's `align` (`start`, `center`, or `end`) for ordinary alignment,
and `layout="fixed"` when native fixed table layout is useful. Widths and more
specialized presentation remain owned-source CSS concerns.

## Compose pagination

`Table` never slices or fetches data. The application owns that state and may
compose `Pagination`:

```vue
<n-table :rows="visibleRows" :columns="columns" caption="Search results" />
<n-pagination
  v-model:current-key="currentPage"
  :items="pageItems"
  label="Result pages"
/>
```

## Table or Nagi Grid?

Use `Table` for users, orders, search results, comparisons, and tens or
hundreds of read-oriented rows where native table semantics are desirable.

Use Nagi Grid when cells are interactive, users navigate or select by cell,
editing or clipboard behavior is required, ranges matter, virtualization is
important, or columns must be resized, pinned, or reordered. The absence of
those features in `Table` is an intentional product boundary, not unfinished
scope. Nagi Grid is a separate product and is not a Nagi UI dependency.

## Ownership

`vp exec nagi-ui own table` copies the same `Table.vue` source used by the
package export. The owned file remains ordinary Vue, HTML, and CSS and does
not introduce a table DSL.
