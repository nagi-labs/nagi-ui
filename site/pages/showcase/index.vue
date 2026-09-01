<script setup lang="ts">
import { NBadge, NButton, NCard, NTable } from "@nagi-labs/nagi-ui/components";
import type { TableColumn } from "@nagi-labs/nagi-ui/components";
import { customers, type Customer } from "~/data/customers";

useHead({ title: "Application showcase" });
const columns: TableColumn<Customer>[] = [
  { key: "company", label: "Customer", rowHeader: true },
  { key: "plan", label: "Plan" },
  { key: "status", label: "Health" },
  { key: "revenue", label: "MRR", align: "end" },
];
</script>

<template>
  <div class="site-showcase-page">
    <page-heading
      eyebrow="Application showcase"
      title="Good morning, Maya"
      description="A working customer operations dashboard composed from Nagi UI and ordinary semantic HTML."
    >
      <n-button>Export report</n-button
      ><span class="actions -primary">
        <n-button> Add customer </n-button>
      </span>
    </page-heading>

    <section
      class="section -metrics"
      aria-label="Key metrics"
    >
      <metric-card
        label="Monthly revenue"
        value="$86.4k"
        change="+12.8% from last month"
      />
      <metric-card
        label="Active accounts"
        value="1,284"
        change="+42 this month"
      />
      <metric-card
        label="Net retention"
        value="108.2%"
        change="+2.4 points"
      />
      <metric-card
        label="Accounts at risk"
        value="17"
        change="3 need attention"
        tone="attention"
      />
    </section>

    <section class="section -analysis">
      <n-card
        title="Recurring revenue"
        description="Trailing twelve months"
      >
        <revenue-chart />
      </n-card>
      <n-card
        title="Recent activity"
        description="Across customer workspaces"
      >
        <activity-list />
      </n-card>
    </section>

    <section class="section -accounts">
      <header class="header">
        <div class="unit">
          <h2 class="title">Priority accounts</h2>
          <p class="text">Accounts with recent growth or risk signals.</p>
        </div>
        <a
          class="link"
          :href="useSitePath('/showcase/customers')"
          >View all customers →</a
        >
      </header>
      <n-table
        class="n-table"
        :rows="customers.slice(0, 5)"
        :columns="columns"
        caption="Priority customer accounts"
        caption-hidden
        row-key="id"
      >
        <template #cell-company="{ row }">
          <div class="n-table-cell-content">
            <a
              class="link"
              :href="useSitePath(`/showcase/customers/${row.id}`)"
              >{{ row.company }}</a
            >
          </div>
        </template>
        <template #cell-status="{ value }">
          <n-badge
            :label="String(value)"
            :tone="value === 'Active' ? 'success' : value === 'Trial' ? 'accent' : 'warning'"
          />
        </template>
        <!-- prettier-ignore -->
        <template #cell-revenue="{ value }">
          ${{ Number(value).toLocaleString() }}
        </template>
      </n-table>
    </section>
  </div>
</template>

<style scoped>
.site-showcase-page {
  display: grid;
  gap: calc(2 * var(--n-space-8));
  max-inline-size: 90rem;
  inline-size: 100%;
  padding: calc(2 * var(--n-space-8));

  > .section.-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--n-space-7);
  }
  > .section.-analysis {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(20rem, 0.8fr);
    gap: var(--n-space-7);
  }
  > .section.-accounts {
    display: grid;
    gap: var(--n-space-7);

    > .n-table {
      .n-table-cell-content {
        > .link {
          color: var(--nagi-color-text);
          font-weight: 600;
          text-decoration-color: var(--nagi-color-border);

          &:hover {
            color: var(--nagi-color-accent);
            text-decoration-color: currentcolor;
          }
        }
      }
    }

    > .header {
      display: flex;
      align-items: end;
      justify-content: space-between;

      > .unit {
        > .title {
          margin: 0;
          color: var(--site-color-ink-strong);
          font-size: var(--n-font-size-5);
        }

        > .text {
          margin: var(--n-space-2) 0 0;
          color: var(--nagi-color-text-muted);
        }
      }

      > .link {
        color: var(--nagi-color-accent);
        font-weight: 600;
        text-decoration: none;
      }
    }
  }
}

@media (max-width: 72rem) {
  .site-showcase-page {
    > .section.-metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    > .section.-analysis {
      grid-template-columns: 1fr;
    }
  }
}
@media (max-width: 38rem) {
  .site-showcase-page {
    padding: var(--n-space-8);

    > .section.-metrics {
      grid-template-columns: 1fr;
    }

    > .section.-accounts {
      > .header {
        align-items: start;
        flex-direction: column;
        gap: var(--n-space-4);
      }
    }
  }
}
</style>
