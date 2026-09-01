<script setup lang="ts">
defineProps<{ label: string; value: string; change: string; tone?: "positive" | "attention" }>();
</script>

<template>
  <article
    class="site-metric-card"
    :data-tone="tone"
  >
    <header class="header">
      <p class="text">
        {{ label }}
      </p>
      <span
        class="icon"
        aria-hidden="true"
        >↗</span
      >
    </header>
    <strong class="strong">{{ value }}</strong>
    <p class="text -change">
      {{ change }}
    </p>
  </article>
</template>

<style scoped>
.site-metric-card {
  --local-tight-tracking: -0.03em;
  padding: var(--n-space-8);
  border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
  border-radius: var(--n-radius-3);
  background: var(--nagi-color-surface);
  box-shadow: var(--n-shadow-1);

  > .header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    > .text {
      margin: 0;
      color: var(--nagi-color-text-muted);
      font-size: var(--n-font-size-3);
      font-weight: 500;
    }

    > .icon {
      color: var(--nagi-color-success);
    }
  }
  > .strong {
    display: block;
    margin-block-start: var(--n-space-6);
    color: var(--site-color-ink-strong);
    font-size: var(--n-font-size-6);
    letter-spacing: var(--local-tight-tracking);
  }
  > .text.-change {
    margin: var(--n-space-2) 0 0;
    color: var(--nagi-color-success);
    font-size: var(--n-font-size-2);
  }
  &[data-tone="attention"] {
    > .header {
      > .icon {
        color: var(--nagi-color-warning);
      }
    }

    > .text.-change {
      color: var(--nagi-color-warning);
    }
  }
}
</style>
