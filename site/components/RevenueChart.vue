<script setup lang="ts">
const revenue = [61.2, 64.7, 63.8, 68.9, 70.4, 72.8, 74.1, 77.6, 79.3, 81.9, 83.6, 86.4];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const plot = { left: 44, right: 704, top: 20, bottom: 214, min: 58, max: 90 } as const;
const x = (index: number) => plot.left + (index * (plot.right - plot.left)) / (revenue.length - 1);
const y = (value: number) =>
  plot.bottom - ((value - plot.min) * (plot.bottom - plot.top)) / (plot.max - plot.min);
const points = revenue.map((value, index) => `${x(index)},${y(value)}`).join(" ");
const area = `${plot.left},${plot.bottom} ${points} ${plot.right},${plot.bottom}`;
const gridValues = [60, 70, 80, 90];
</script>

<template>
  <figure class="site-revenue-chart">
    <div class="unit">
      <span class="value">$86.4k</span>
      <small class="note">+$9.8k since Jul</small>
    </div>
    <svg
      class="svg"
      viewBox="0 0 720 240"
      role="img"
      aria-label="Monthly recurring revenue increased from 61.2 thousand dollars in January to 86.4 thousand dollars in December"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id="revenue-area"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="var(--nagi-color-series-1)"
            stop-opacity="0.22"
          />
          <stop
            offset="100%"
            stop-color="var(--nagi-color-series-1)"
            stop-opacity="0.01"
          />
        </linearGradient>
      </defs>
      <g aria-hidden="true">
        <template
          v-for="value in gridValues"
          :key="value"
        >
          <line
            :x1="plot.left"
            :x2="plot.right"
            :y1="y(value)"
            :y2="y(value)"
            stroke="var(--nagi-color-border-muted)"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
          <text
            x="36"
            :y="y(value) + 4"
            fill="var(--nagi-color-text-muted)"
            font-family="Inter, ui-sans-serif, system-ui, sans-serif"
            font-size="var(--n-font-size-1)"
            text-anchor="end"
          >
            ${{ value }}k
          </text>
        </template>
      </g>
      <polygon
        :points="area"
        fill="url(#revenue-area)"
        aria-hidden="true"
      />
      <polyline
        :points="points"
        fill="none"
        stroke="var(--nagi-color-series-1)"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2.5"
        vector-effect="non-scaling-stroke"
        aria-hidden="true"
      />
      <g>
        <circle
          v-for="(value, index) in revenue"
          :key="months[index]"
          :cx="x(index)"
          :cy="y(value)"
          :r="index === revenue.length - 1 ? 5 : 3"
          :fill="
            index === revenue.length - 1
              ? 'var(--nagi-color-series-1)'
              : 'var(--nagi-color-surface)'
          "
          :stroke="
            index === revenue.length - 1
              ? 'var(--nagi-color-surface)'
              : 'var(--nagi-color-series-1)'
          "
          :stroke-width="index === revenue.length - 1 ? 3 : 2"
          vector-effect="non-scaling-stroke"
        >
          <title>{{ months[index] }}: ${{ value.toFixed(1) }}k</title>
        </circle>
      </g>
    </svg>
    <figcaption class="figcaption">
      <span
        v-for="index in [0, 3, 6, 9, 11]"
        :key="index"
        class="value"
        >{{ months[index] }}</span
      >
    </figcaption>
  </figure>
</template>

<style scoped>
.site-revenue-chart {
  --local-axis-inset: 2.75rem;
  display: grid;
  gap: var(--n-space-3);

  > .unit {
    display: flex;
    gap: var(--n-space-4);
    align-items: baseline;

    > .value {
      color: var(--nagi-color-text);
      font-size: var(--n-font-size-6);
      font-weight: 600;
    }

    > .note {
      color: var(--nagi-color-success);
      font-size: var(--n-font-size-2);
    }
  }

  > .svg {
    inline-size: 100%;
    block-size: 14rem;
    overflow: visible;
  }

  > .figcaption {
    display: flex;
    justify-content: space-between;
    padding-inline-start: var(--local-axis-inset);
    color: var(--nagi-color-text-muted);
    font-size: var(--n-font-size-2);
  }
}
</style>
