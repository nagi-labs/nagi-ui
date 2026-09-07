<script setup lang="ts">
import { activities } from "~/data/customers";
</script>

<template>
  <ol class="site-activity-list">
    <li
      v-for="activity in activities"
      :key="activity.title"
      class="item"
    >
      <span
        class="icon"
        aria-hidden="true"
      />
      <span class="unit">
        <strong class="strong">{{ activity.title }}</strong>
        <small class="note">{{ activity.detail }}</small>
      </span>
      <time class="time">{{ activity.time }}</time>
    </li>
  </ol>
</template>

<style scoped>
.site-activity-list {
  display: grid;
  gap: 0;
  padding: 0;
  list-style: none;

  > .item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: var(--n-space-5);
    align-items: start;
    padding-block: var(--n-space-5);
    border-block-end: var(--n-border-width-1) solid var(--nagi-color-border-muted);

    &:last-child {
      border-block-end: 0;
    }

    > .icon {
      inline-size: 0.65rem;
      block-size: 0.65rem;
      margin-block-start: var(--n-space-3);
      border-radius: var(--n-radius-3);
      background: var(--site-color-brand);
    }

    > .unit {
      display: grid;

      > .strong {
        color: var(--nagi-color-text);
        font-size: var(--n-font-size-3);
      }

      > .note {
        color: var(--nagi-color-text-muted);
        font-size: var(--n-font-size-2);
      }
    }

    > .time {
      color: var(--nagi-color-text-muted);
      font-size: var(--n-font-size-2);
    }
  }
}
</style>
