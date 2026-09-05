<script setup lang="ts">
defineProps<{ name: string }>();
</script>

<template>
  <section
    class="site-component-definition-wip-section"
    aria-labelledby="component-definition-heading"
  >
    <header class="header">
      <h2
        id="component-definition-heading"
        class="title"
      >
        Definition
      </h2>
      <small class="note"> {{ name }} · Contract audit WIP · Browser evidence not collected </small>
    </header>

    <div class="unit -notice">
      <strong class="strong">Component Definition in progress</strong>
      <span class="text">
        The component is available, but its Component Contract and Implementation audit has not yet
        been assembled. No runner-native browser evidence has been collected for this Definition.
      </span>
    </div>
  </section>
</template>

<style scoped>
.site-component-definition-wip-section {
  --local-status-radius: 999px;

  display: grid;
  gap: var(--n-space-7);

  > .header {
    display: flex;
    flex-wrap: wrap;
    gap: var(--n-space-3);
    align-items: end;
    justify-content: space-between;

    > .title {
      margin: 0;
      color: var(--site-color-ink-strong);
      font-size: var(--n-font-size-6);
    }

    > .note {
      padding: var(--n-space-1) var(--n-space-3);
      border: var(--n-border-width-1) solid var(--nagi-color-warning);
      border-radius: var(--local-status-radius);
      background: var(--nagi-color-surface-warning);
      color: var(--nagi-color-warning);
      font-family: var(--site-font-code);
      font-weight: 700;
    }
  }

  > .unit.-notice {
    display: grid;
    gap: var(--n-space-3);
    max-inline-size: 54rem;
    padding: var(--n-space-7);
    border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
    border-inline-start: calc(3 * var(--n-border-width-1)) solid var(--nagi-color-warning);
    border-radius: var(--nagi-radius-control);
    background: var(--nagi-color-surface);

    > .strong {
      color: var(--site-color-ink-strong);
    }

    > .text {
      margin: 0;
      color: var(--nagi-color-text-muted);
    }
  }
}
</style>
