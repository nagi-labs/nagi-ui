<script setup lang="ts">
import { ref } from "vue";
import { VisAxis, VisLine, VisXYContainer } from "@unovis/vue";

import { NButton, NCard } from "@nagi-labs/nagi-ui/components";

interface WeeklyActivity {
  week: string;
  current: number;
  previous: number;
}

const data: readonly WeeklyActivity[] = [
  { week: "Jun 15", current: 118, previous: 106 },
  { week: "Jun 22", current: 132, previous: 121 },
  { week: "Jun 29", current: 127, previous: 134 },
  { week: "Jul 6", current: 151, previous: 139 },
  { week: "Jul 13", current: 168, previous: 148 },
  { week: "Jul 20", current: 184, previous: 156 },
];
const dark = ref(false);
const x = (_datum: WeeklyActivity, index: number) => index;
const current = (datum: WeeklyActivity) => datum.current;
const previous = (datum: WeeklyActivity) => datum.previous;
const colors = ["var(--vis-color0)", "var(--vis-color1)"];
const lineDashArray = (_data: WeeklyActivity[], seriesIndex: number) =>
  seriesIndex === 0 ? [] : [7, 4];
const formatWeek = (value: number | Date) =>
  typeof value === "number" ? (data[Math.round(value)]?.week ?? "") : "";
const formatUsers = (value: number | Date) =>
  typeof value === "number" ? String(Math.round(value)) : "";
</script>

<template>
  <main class="n-chart-lab">
    <header class="header">
      <p class="text -eyebrow">Integration recipe</p>
      <h1 class="title">Nagi UI + Unovis</h1>
      <p class="text">
        Card owns the surrounding anatomy. Unovis owns the chart, while Nagi theme
        tokens bridge through public CSS custom properties.
      </p>
    </header>

    <n-button
      class="n-button"
      id="chart-theme-toggle"
      :aria-pressed="dark"
      @click="dark = !dark"
    >
      {{ dark ? "Use light chart theme" : "Use dark chart theme" }}
    </n-button>

    <section class="section" :class="{ '-dark': dark }" aria-labelledby="chart-heading">
      <h2 id="chart-heading" class="title">Recommended composition</h2>
      <n-card
        class="n-card"
        title="Weekly active users"
        description="Current and previous six-week periods"
      >
        <figure class="n-card-content" data-nagi-unovis>
          <div class="unit -chart">
            <VisXYContainer
              class="unovis-xy-container"
              :data="data"
              :height="300"
              aria-label="Weekly active users: current period rises from 118 to 184; previous period rises from 106 to 156"
            >
              <VisLine
                class="unovis-line"
                :x="x"
                :y="[current, previous]"
                :color="colors"
                :line-dash-array="lineDashArray"
                :line-width="3"
              />
              <VisAxis
                class="unovis-axis"
                type="x"
                label="Week"
                :tick-format="formatWeek"
                :tick-values="data.map((_datum, index) => index)"
              />
              <VisAxis
                class="unovis-axis"
                type="y"
                label="Active users"
                :tick-format="formatUsers"
              />
            </VisXYContainer>
          </div>

          <ul class="list" aria-label="Chart series">
            <li class="item">
              <span class="icon -current" aria-hidden="true"></span>
              Current period
            </li>
            <li class="item">
              <span class="icon -previous" aria-hidden="true"></span>
              Previous period, dashed
            </li>
          </ul>

          <figcaption class="figcaption">
            Current activity ends 28 users above the previous period. The table keeps
            every value available without relying on color or pointer interaction.
          </figcaption>

          <table class="table">
            <caption class="caption">Weekly active-user values</caption>
            <thead class="rowgroup -head">
              <tr class="row">
                <th class="cell -head" scope="col">Week</th>
                <th class="cell -head" scope="col">Current</th>
                <th class="cell -head" scope="col">Previous</th>
              </tr>
            </thead>
            <tbody class="rowgroup">
              <tr v-for="item in data" :key="item.week" class="row">
                <th class="cell -head" scope="row">{{ item.week }}</th>
                <td class="cell">{{ item.current }}</td>
                <td class="cell">{{ item.previous }}</td>
              </tr>
            </tbody>
          </table>
        </figure>
      </n-card>
    </section>
  </main>
</template>

<style scoped>
.n-chart-lab {
  display: grid;
  gap: 1rem;
  max-inline-size: 64rem;
  padding: 2rem;
  color: var(--nagi-color-text);
  font-family: ui-sans-serif, system-ui, sans-serif;

  > .header {
    > .title {
      margin-block: 0.35rem 0;
      font-size: 1.65rem;
    }

    > .text {
      max-inline-size: 48rem;
      color: var(--nagi-color-text-muted);

      &.-eyebrow {
        margin: 0;
        color: var(--nagi-color-accent);
        font-size: var(--nagi-font-size-label);
        font-weight: 750;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
    }
  }

  > .n-button {
    justify-self: start;
  }

  > .section {
    display: grid;
    gap: 0.75rem;

    > .title {
      margin: 0;
      font-size: 1.05rem;
    }

    > .n-card {
      .n-card-content {
        display: grid;
        gap: 1rem;
        margin: 0;

        > .unit.-chart {
          min-inline-size: 0;

          > .unovis-xy-container {
            inline-size: 100%;
          }
        }

        > .list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem 1.25rem;
          padding: 0;
          margin: 0;
          list-style: none;

          > .item {
            display: flex;
            gap: 0.45rem;
            align-items: center;

            > .icon {
              inline-size: 1.5rem;
              block-size: 3px;
              background: var(--nagi-color-series-1);

              &.-previous {
                background: repeating-linear-gradient(
                  90deg,
                  var(--nagi-color-series-2) 0 0.45rem,
                  transparent 0.45rem 0.7rem
                );
              }
            }
          }
        }

        > .figcaption {
          color: var(--nagi-color-text-muted);
        }

        > .table {
          inline-size: 100%;
          border-collapse: collapse;

          > .caption {
            margin-block-end: 0.45rem;
            color: var(--nagi-color-text-muted);
            font-size: var(--nagi-font-size-label);
            text-align: start;
          }

          > .rowgroup {
            > .row {
              > .cell {
                padding: 0.45rem;
                border-block-end: 1px solid var(--nagi-color-border-muted);
                text-align: end;
                font-variant-numeric: tabular-nums;
              }

              > .cell:first-child {
                text-align: start;
              }
            }
          }
        }
      }
    }

    &.-dark {
      --nagi-color-border-muted: #50676f;
      --nagi-color-series-1: #5fc7dd;
      --nagi-color-series-2: #e49abc;
      --nagi-color-series-3: #e0b555;
      --nagi-color-series-4: #8fca7e;
      --nagi-color-series-5: #aaa2f5;
      --nagi-color-series-6: #f1937f;
      --nagi-color-surface: #17323b;
      --nagi-color-text: #f5fbfc;
      --nagi-color-text-muted: #c2d2d6;
    }
  }
}
</style>
