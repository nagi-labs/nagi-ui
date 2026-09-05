<script setup lang="ts">
/* eslint-disable vue/no-v-html -- This is the single sink for branded Shiki output. */
import { NDisclosure } from "@nagi-labs/nagi-ui/components";
import type { TrustedShikiHtml } from "~/utils/highlight-source";

defineProps<{ summary: string; html?: TrustedShikiHtml | "" }>();
</script>

<template>
  <div class="site-code-disclosure">
    <n-disclosure
      class="n-disclosure"
      :summary="summary"
    >
      <div class="n-disclosure-content">
        <!-- TrustedShikiHtml can only be created by the repository-source highlighter. -->
        <div
          v-if="html"
          class="unit"
          v-html="html"
        />
        <div
          v-else
          class="unit"
        >
          <slot />
        </div>
      </div>
    </n-disclosure>
  </div>
</template>

<style scoped>
.site-code-disclosure {
  > .n-disclosure {
    max-inline-size: none;

    .n-disclosure-content {
      > .unit {
        max-block-size: 48rem;
        padding: var(--n-space-8);
        overflow: auto;
        background: var(--site-color-code);

        & :deep(pre) {
          min-inline-size: max-content;
          margin: 0;
          padding: 0;
          font-family: var(--site-font-code);
          font-size: var(--n-font-size-4);
          line-height: 1.7;
        }
      }
    }
  }
}
</style>
