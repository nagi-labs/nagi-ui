<template>
  <div class="site-example-frame"><slot /></div>
</template>

<style scoped>
.site-example-frame {
  display: flex;
  flex-wrap: wrap;
  gap: var(--n-space-8);
  align-items: end;
  padding: calc(2 * var(--n-space-8));
  border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
  border-radius: var(--n-radius-3);
  background: var(--site-color-canvas-muted);

  > :slotted(.output) {
    color: var(--nagi-color-text-muted);
    font-family: var(--site-font-code);
  }
}
</style>
