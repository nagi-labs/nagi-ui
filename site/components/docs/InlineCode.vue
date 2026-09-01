<template>
  <code class="site-inline-code"><slot /></code>
</template>

<style scoped>
.site-inline-code {
  padding: var(--n-space-1) var(--n-space-2);
  border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
  border-radius: var(--n-radius-1);
  background: var(--nagi-color-surface-active);
  color: var(--nagi-color-text);
  font-family: var(--site-font-code);
  font-size: var(--n-font-size-3);
}
</style>
