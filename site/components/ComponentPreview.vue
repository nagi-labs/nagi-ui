<script setup lang="ts">
import ActionsFormsPreview from "~/components/previews/ActionsFormsPreview.vue";
import DateNavigationPreview from "~/components/previews/DateNavigationPreview.vue";
import DisplayOverlayPreview from "~/components/previews/DisplayOverlayPreview.vue";
import { actionsFormsExamples } from "~/data/examples/actions-forms";
import { dateNavigationExamples } from "~/data/examples/date-navigation";
import { displayOverlayExamples } from "~/data/examples/display-overlay";

const props = defineProps<{ componentName: string }>();

const previewFamily = computed(() => {
  if (Object.hasOwn(actionsFormsExamples, props.componentName)) return "actions-forms";
  if (Object.hasOwn(dateNavigationExamples, props.componentName)) return "date-navigation";
  if (Object.hasOwn(displayOverlayExamples, props.componentName)) return "display-overlay";
  throw new Error(`No preview registered for ${props.componentName}`);
});
</script>

<template>
  <div class="site-component-preview">
    <actions-forms-preview
      v-if="previewFamily === 'actions-forms'"
      :component-name="componentName"
    />
    <date-navigation-preview
      v-else-if="previewFamily === 'date-navigation'"
      :component-name="componentName"
    />
    <display-overlay-preview
      v-else
      :component-name="componentName"
    />
  </div>
</template>

<style scoped>
.site-component-preview {
  display: grid;
  align-content: center;
  justify-items: stretch;
  min-block-size: 16rem;
  padding: calc(2 * var(--n-space-8));
  overflow: auto;
  border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
  border-radius: var(--n-radius-3);
  background: var(--site-color-canvas-muted);
}
</style>
