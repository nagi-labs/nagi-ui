<script setup lang="ts">
import {
  NBadge,
  NButton,
  NDropdownMenu,
  NEmptyState,
  NInput,
  NPagination,
  NSelect,
  NTable,
} from "@nagi-labs/nagi-ui/components";
import type { TableColumn } from "@nagi-labs/nagi-ui/components";
import { customers, type Customer, type CustomerStatus } from "~/data/customers";

const search = ref("");
const status = ref("all");
const sort = ref<"company" | "revenue">("company");
const page = ref("1");
const loading = ref(false);
const columns: TableColumn<Customer>[] = [
  { key: "company", label: "Customer", rowHeader: true },
  { key: "status", label: "Status" },
  { key: "plan", label: "Plan" },
  { key: "seats", label: "Seats", align: "end" },
  { key: "revenue", label: "MRR", align: "end" },
  { key: "lastActive", label: "Last active" },
];
const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "Active" },
  { label: "Trial", value: "Trial" },
  { label: "At risk", value: "At risk" },
];
const pageItems = ["1", "2", "3"].map((key) => ({ key, label: key }));

const filtered = computed(() =>
  customers
    .filter((customer) =>
      `${customer.company} ${customer.name}`.toLowerCase().includes(search.value.toLowerCase()),
    )
    .filter((customer) => status.value === "all" || customer.status === status.value)
    .toSorted((left, right) =>
      sort.value === "revenue"
        ? right.revenue - left.revenue
        : left.company.localeCompare(right.company),
    ),
);

function tone(value: CustomerStatus) {
  return value === "Active" ? "success" : value === "Trial" ? "accent" : "warning";
}

function refresh() {
  loading.value = true;
  window.setTimeout(() => {
    loading.value = false;
  }, 700);
}
</script>

<template>
  <section
    class="site-customer-directory"
    :aria-busy="loading"
  >
    <header class="header">
      <div class="unit">
        <n-input
          v-model="search"
          label="Search customers"
          type="search"
          placeholder="Company or owner"
        />
        <n-select
          v-model="status"
          label="Status"
          :options="statusOptions"
        />
      </div>
      <div class="actions -compact">
        <n-button @click="sort = sort === 'company' ? 'revenue' : 'company'">
          Sort: {{ sort }}
        </n-button>
        <n-button @click="refresh">
          {{ loading ? "Refreshing…" : "Refresh" }}
        </n-button>
      </div>
    </header>

    <div
      v-if="loading"
      class="status"
      role="status"
    >
      Refreshing customer records…
    </div>
    <n-table
      v-if="filtered.length"
      class="n-table"
      :rows="filtered"
      :columns="columns"
      caption="Customer accounts"
      caption-hidden
      row-key="id"
    >
      <template #cell-company="{ row }">
        <div class="n-table-cell-content -company">
          <a
            class="link"
            :href="useSitePath(`/showcase/customers/${row.id}`)"
            >{{ row.company }}</a
          >
          <small class="note">{{ row.name }}</small>
        </div>
      </template>
      <template #cell-status="{ value }">
        <n-badge
          :label="String(value)"
          :tone="tone(value as CustomerStatus)"
        />
      </template>
      <!-- prettier-ignore -->
      <template #cell-revenue="{ value }">
        ${{ Number(value).toLocaleString() }}
      </template>
      <template #cell-lastActive="{ row }">
        <div class="n-table-cell-content -activity">
          <span class="value">{{ row.lastActive }}</span>
          <n-dropdown-menu
            class="n-dropdown-menu"
            label="Actions"
            :items="[
              {
                key: 'open',
                label: 'Open customer',
                href: useSitePath(`/showcase/customers/${row.id}`),
              },
              { key: 'note', label: 'Add note', onSelect: () => undefined },
            ]"
          />
        </div>
      </template>
    </n-table>
    <n-empty-state
      v-else
      title="No matching customers"
      description="Try a different search or clear the status filter."
    >
      <n-button
        @click="
          search = '';
          status = 'all';
        "
      >
        Clear filters
      </n-button>
    </n-empty-state>

    <footer class="footer">
      <p class="text">Showing {{ filtered.length }} of {{ customers.length }} customers</p>
      <n-pagination
        v-model:current-key="page"
        :items="pageItems"
        label="Customer pages"
      />
    </footer>
  </section>
</template>

<style scoped>
.site-customer-directory {
  display: grid;
  gap: var(--n-space-7);

  > .header {
    display: flex;
    gap: var(--n-space-7);
    align-items: end;
    justify-content: space-between;

    > .unit {
      display: grid;
      grid-template-columns: minmax(14rem, 1fr) minmax(10rem, 0.45fr);
      gap: var(--n-space-5);
      inline-size: min(38rem, 100%);
    }

    > .actions {
      display: flex;
      gap: var(--n-space-4);
    }
  }
  > .status {
    padding: var(--n-space-4) var(--n-space-6);
    border-radius: var(--n-radius-2);
    background: var(--nagi-color-surface-accent);
    color: var(--nagi-color-accent);
  }
  > .n-table {
    .n-table-cell-content {
      &.-company {
        > .link {
          display: block;
          color: var(--nagi-color-text);
          font-weight: 600;
          text-decoration: none;

          &:hover {
            color: var(--nagi-color-accent);
          }
        }

        > .note {
          display: block;
          color: var(--nagi-color-text-muted);
          font-size: var(--n-font-size-2);
        }
      }

      &.-activity {
        > .value {
          display: inline-block;
          min-inline-size: 6rem;
        }

        > .n-dropdown-menu {
          margin-inline-start: var(--n-space-4);
        }
      }
    }
  }
  > .footer {
    display: flex;
    gap: var(--n-space-7);
    align-items: center;
    justify-content: space-between;

    > .text {
      margin: 0;
      color: var(--nagi-color-text-muted);
      font-size: var(--n-font-size-3);
    }
  }
}

@media (max-width: 48rem) {
  .site-customer-directory {
    > .header {
      align-items: stretch;
      flex-direction: column;

      > .unit {
        grid-template-columns: 1fr;
      }
    }
    > .footer {
      align-items: start;
      flex-direction: column;
    }
  }
}
</style>
