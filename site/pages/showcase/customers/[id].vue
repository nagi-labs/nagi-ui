<script setup lang="ts">
import {
  NBadge,
  NButton,
  NCard,
  NDialog,
  NInput,
  NSelect,
  NTabs,
  NTextarea,
} from "@nagi-labs/nagi-ui/components";
import { activities, customers } from "~/data/customers";

const route = useRoute();
const customer = computed(
  () => customers.find((item) => item.id === route.params.id) ?? customers[0],
);
const selected = ref("overview");
const owner = ref(customer.value.name);
const notes = ref("Strategic account. Review product adoption with the operations team next week.");
const tabs = [
  { key: "overview", label: "Overview" },
  { key: "activity", label: "Activity" },
  { key: "billing", label: "Billing" },
];
useHead({ title: () => customer.value.company });
</script>

<template>
  <div class="site-customers-page">
    <page-heading
      eyebrow="Customer detail"
      :title="customer.company"
      :description="`${customer.plan} plan · ${customer.seats} seats · Owner ${customer.name}`"
    >
      <span class="actions -primary">
        <n-dialog
          trigger-label="Add note"
          title="Add customer note"
          description="Notes are local fixture state in this static showcase."
        >
          <n-textarea
            v-model="notes"
            label="Note"
            :rows="5"
          />
          <template #actions>
            <n-button> Save note </n-button>
          </template>
        </n-dialog>
      </span>
      <span class="actions -primary"><n-button> Contact customer </n-button></span>
    </page-heading>

    <section
      class="section -metrics"
      aria-label="Account summary"
    >
      <metric-card
        label="Account health"
        value="92 / 100"
        change="Healthy product adoption"
      />
      <metric-card
        label="Monthly revenue"
        :value="`$${customer.revenue.toLocaleString()}`"
        change="Next renewal in 74 days"
      />
      <metric-card
        label="Workspace usage"
        :value="String(customer.seats)"
        change="84% of purchased seats active"
      />
    </section>

    <n-tabs
      v-model:selected="selected"
      class="n-tabs"
      label="Customer information"
      :items="tabs"
    >
      <template #panel="{ item }">
        <div class="n-tabs-panel">
          <section
            v-if="item.key === 'overview'"
            class="section -overview"
          >
            <div class="unit">
              <h2 class="title">Account profile</h2>
              <n-input
                v-model="owner"
                label="Customer owner"
              /><n-select
                label="Plan"
                :model-value="customer.plan"
                :options="[
                  { label: 'Enterprise', value: 'Enterprise' },
                  { label: 'Growth', value: 'Growth' },
                ]"
              /><n-button>Save profile</n-button>
            </div>
            <dl class="list">
              <dt class="term">Company</dt>
              <dd class="definition">
                {{ customer.company }}
              </dd>
              <dt class="term">Primary contact</dt>
              <dd class="definition">
                {{ customer.name }}
              </dd>
              <dt class="term">Last active</dt>
              <dd class="definition">
                {{ customer.lastActive }}
              </dd>
              <dt class="term">Region</dt>
              <dd class="definition">North America</dd>
            </dl>
          </section>
          <ol
            v-else-if="item.key === 'activity'"
            class="list -activity"
          >
            <li
              v-for="activity in activities"
              :key="activity.title"
              class="item"
            >
              <strong class="strong">{{ activity.title }}</strong
              ><small class="note">{{ activity.detail }} · {{ activity.time }}</small>
            </li>
          </ol>
          <section
            v-else
            class="section -billing"
          >
            <h2 class="title">Billing profile</h2>
            <span class="text">
              Annual contract · Net 30 · Next invoice ${{
                (customer.revenue * 12).toLocaleString()
              }}
            </span>
            <n-button>View invoices</n-button>
          </section>
        </div>
      </template>
    </n-tabs>
  </div>
</template>

<style scoped>
.site-customers-page {
  display: grid;
  gap: calc(2 * var(--n-space-8));
  max-inline-size: 90rem;
  inline-size: 100%;
  padding: calc(2 * var(--n-space-8));

  > .section.-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--n-space-7);
  }
  > .n-tabs {
    .n-tabs-panel {
      > .section.-overview {
        display: grid;
        grid-template-columns: minmax(18rem, 0.7fr) minmax(18rem, 1fr);
        gap: calc(2 * var(--n-space-8));
        padding: var(--n-space-8);

        > .unit {
          display: grid;
          gap: var(--n-space-6);

          > .title {
            margin: 0;
            font-size: var(--n-font-size-5);
          }
        }

        > .list {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          align-content: start;
          column-gap: var(--n-space-6);
          margin: 0;

          > .term,
          > .definition {
            padding-block: var(--n-space-5);
            border-block-end: var(--n-border-width-1) solid var(--nagi-color-border-muted);
          }

          > .term {
            color: var(--nagi-color-text-muted);
          }

          > .definition {
            margin: 0;
            font-weight: 500;
          }
        }
      }

      > .list.-activity {
        display: grid;
        gap: 0;
        margin: 0;
        padding: var(--n-space-5);
        list-style: none;

        > .item {
          display: grid;
          gap: var(--n-space-2);
          padding: var(--n-space-6);
          border-block-end: var(--n-border-width-1) solid var(--nagi-color-border-muted);

          > .note {
            color: var(--nagi-color-text-muted);
          }
        }
      }

      > .section.-billing {
        padding: var(--n-space-8);

        > .title {
          margin: 0;
          font-size: var(--n-font-size-5);
        }

        > .text {
          color: var(--nagi-color-text-muted);
        }
      }
    }
  }
}
@media (max-width: 58rem) {
  .site-customers-page {
    > .section.-metrics {
      grid-template-columns: 1fr;
    }
    > .n-tabs {
      .n-tabs-panel {
        > .section.-overview {
          grid-template-columns: 1fr;
        }
      }
    }
  }
}
@media (max-width: 38rem) {
  .site-customers-page {
    padding: var(--n-space-8);
  }
}
</style>
