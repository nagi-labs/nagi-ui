<script setup lang="ts">
defineProps<{ eyebrow?: string; title: string; description: string }>();
</script>

<template>
  <header class="site-page-heading">
    <div class="unit">
      <p
        v-if="eyebrow"
        class="text -eyebrow"
      >
        {{ eyebrow }}
      </p>
      <h1 class="title">
        {{ title }}
      </h1>
      <p class="text">
        {{ description }}
      </p>
    </div>
    <div
      v-if="$slots.default"
      class="actions"
    >
      <slot />
    </div>
  </header>
</template>

<style scoped>
.site-page-heading {
  --local-display-min: 1.8rem;
  --local-display-max: 2.6rem;
  --local-eyebrow-tracking: 0.08em;
  --local-tight-tracking: -0.035em;
  display: flex;
  gap: var(--n-space-8);
  align-items: end;
  justify-content: space-between;

  > .unit {
    > .text.-eyebrow {
      margin: 0 0 var(--n-space-3);
      color: var(--site-color-brand);
      font-size: var(--n-font-size-2);
      font-weight: 600;
      letter-spacing: var(--local-eyebrow-tracking);
      text-transform: uppercase;
    }
    > .title {
      margin: 0;
      color: var(--site-color-ink-strong);
      font-size: clamp(var(--local-display-min), 3vw, var(--local-display-max));
      line-height: 1.08;
      letter-spacing: var(--local-tight-tracking);
    }
    > .text:not(.-eyebrow) {
      max-inline-size: 44rem;
      margin: var(--n-space-4) 0 0;
      color: var(--nagi-color-text-muted);
    }
  }

  > .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--n-space-4);
  }
}

@media (max-width: 42rem) {
  .site-page-heading {
    align-items: start;
    flex-direction: column;
  }
}
</style>
