<script setup lang="ts">
import { NButton } from "@nagi-labs/nagi-ui/components";
useHead({ title: "Customers" });
</script>

<template>
  <div class="site-customers-page">
    <page-heading
      eyebrow="Customer operations"
      title="Customers"
      description="Search, sort, filter, and act on realistic local records—without turning the presentational Nagi Table into a data grid."
    >
      <span class="actions -primary"><n-button> Add customer </n-button></span>
    </page-heading>
    <customer-directory />
  </div>
</template>

<style scoped>
.site-customers-page {
  display: grid;
  gap: calc(2 * var(--n-space-8));
  max-inline-size: 90rem;
  inline-size: 100%;
  padding: calc(2 * var(--n-space-8));
}
@media (max-width: 38rem) {
  .site-customers-page {
    padding: var(--n-space-8);
  }
}
</style>
