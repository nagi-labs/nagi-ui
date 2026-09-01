<script setup lang="ts">
const route = useRoute();
const isShowcase = computed(() => route.path.startsWith("/showcase"));
</script>

<template>
  <site-shell :showcase="isShowcase">
    <slot />
  </site-shell>
</template>
