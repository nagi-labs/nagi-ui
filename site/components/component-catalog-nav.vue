<script setup lang="ts">
import { NSidebarLink, NSidebarSection } from "@nagi-labs/nagi-ui/components";
import { componentCategories, componentDocuments } from "~/data/components";

const route = useRoute();
</script>

<template>
  <div class="site-component-catalog-nav">
    <n-sidebar-link
      :href="useSitePath('/components/')"
      :current="route.path === '/components' || route.path === '/components/'"
      :navigate="() => navigateTo('/components/')"
    >
      All components
    </n-sidebar-link>
    <n-sidebar-section
      v-for="category in componentCategories"
      :key="category"
      :label="category"
    >
      <n-sidebar-link
        v-for="entry in componentDocuments.filter((item) => item.category === category)"
        :key="entry.slug"
        :href="useSitePath(`/components/${entry.slug}/`)"
        :navigate="() => navigateTo(`/components/${entry.slug}/`)"
        :current="route.params.component === entry.slug"
        >{{ entry.name }}</n-sidebar-link
      >
    </n-sidebar-section>
  </div>
</template>

<style scoped>
.site-component-catalog-nav {
  display: grid;
  gap: var(--n-space-7);
}
</style>
