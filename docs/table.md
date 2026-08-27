# Table

`Table` presents ordinary tabular information with native HTML semantics. It
does not sort, filter, paginate, select, edit, virtualize, or manage focus as a
grid. Pass already prepared rows and compose other Nagi UI components around
it when needed.

## Basic table

```vue
<script setup lang="ts">
import { Table, type TableColumn } from "@nagi-labs/nagi-ui/components"

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
  <Table
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
<Table :rows="rows" :columns="columns" caption="Users">
  <template #header-status="{ column }">
    <abbr title="Account status">{{ column.label }}</abbr>
  </template>

  <template #cell-status="{ row, value }">
    <Badge :label="String(value)" :tone="row.active ? 'success' : 'neutral'" />
  </template>

  <template #empty>No users match the current filters.</template>
</Table>
```

Cell slots receive `row`, `rowIndex`, `column`, and `value`. Header slots
receive `column`. `emptyText` provides the simple empty state; the `empty`
slot customizes it. The empty cell uses a valid `colspan` for the configured
columns.

Use a column's `align` (`start`, `center`, or `end`) for ordinary alignment,
and `layout="fixed"` when native fixed table layout is useful. Widths and more
specialized presentation remain owned-source CSS concerns.

## Compose pagination

`Table` never slices or fetches data. The application owns that state and may
compose `Pagination`:

```vue
<Table :rows="visibleRows" :columns="columns" caption="Search results" />
<Pagination
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
