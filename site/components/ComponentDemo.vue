<script setup lang="ts">
defineProps<{ title: string; description: string; code?: string }>();
</script>

<template>
  <article class="site-component-demo">
    <header class="header">
      <div class="unit">
        <h2 class="title">
          {{ title }}
        </h2>
        <p class="text">
          {{ description }}
        </p>
      </div>
      <slot name="meta" />
    </header>
    <div class="unit -preview">
      <slot />
    </div>
    <details
      v-if="code"
      class="details"
    >
      <summary class="summary">View source</summary>
      <pre class="pre"><code>{{ code }}</code></pre>
    </details>
  </article>
</template>

<style scoped>
.site-component-demo {
  overflow: hidden;
  border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
  border-radius: var(--n-radius-3);
  background: var(--nagi-color-surface);
  box-shadow: var(--n-shadow-1);
  > .header {
    display: flex;
    gap: var(--n-space-6);
    align-items: start;
    justify-content: space-between;
    padding: var(--n-space-8);
    border-block-end: var(--n-border-width-1) solid var(--nagi-color-border-muted);
    > .unit {
      > .title {
        margin: 0;
        color: var(--site-color-ink-strong);
        font-size: var(--n-font-size-5);
      }

      > .text {
        margin: var(--n-space-2) 0 0;
        color: var(--nagi-color-text-muted);
        font-size: var(--n-font-size-3);
      }
    }
  }

  > .unit.-preview {
    min-block-size: 9rem;
    padding: calc(2 * var(--n-space-8));
    background: linear-gradient(
      135deg,
      var(--site-color-canvas) 0%,
      var(--nagi-color-surface) 100%
    );
  }
  > .details {
    border-block-start: var(--n-border-width-1) solid var(--nagi-color-border-muted);
    > .summary {
      padding: var(--n-space-5) var(--n-space-8);
      color: var(--nagi-color-text-muted);
      font-weight: 500;
      cursor: pointer;
    }

    > .pre {
      overflow-x: auto;
      margin: 0;
      padding: var(--n-space-8);
      background: var(--site-color-code);
      color: var(--site-color-code-text);
      font-family: var(--site-font-code);
      font-size: var(--n-font-size-3);
    }
  }
}
</style>
