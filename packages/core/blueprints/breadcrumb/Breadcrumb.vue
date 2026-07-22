<script lang="ts">
export interface BreadcrumbItem {
  key: string;
  label: string;
  /** Real navigation target. Router integrations should resolve their route to an href. */
  href?: string;
  /** The last item is current by default; set this for an earlier current item. */
  current?: boolean;
}
</script>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    items: readonly BreadcrumbItem[];
    label?: string;
    separator?: string;
  }>(),
  {
    label: "Breadcrumb",
    separator: "/",
  },
);

const currentIndex = computed(() => {
  const explicit = props.items.findIndex((item) => item.current);
  return explicit >= 0 ? explicit : props.items.length - 1;
});
</script>

<template>
  <nav class="n-breadcrumb" :aria-label="label">
    <ol class="list">
      <li v-for="(item, index) in items" :key="item.key" class="item">
        <span v-if="index > 0" class="icon" aria-hidden="true">
          {{ separator }}
        </span>
        <a
          v-if="item.href"
          class="link"
          :href="item.href"
          :aria-current="index === currentIndex ? 'page' : undefined"
        >
          {{ item.label }}
        </a>
        <span
          v-else
          class="text"
          :aria-current="index === currentIndex ? 'page' : undefined"
        >
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.n-breadcrumb {
  color: var(--nagi-color-text-muted);
  font: inherit;

  > .list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--nagi-space-item-gap);
    align-items: center;
    margin: 0;
    padding: 0;
    list-style: none;

    > .item {
      display: inline-flex;
      gap: var(--nagi-space-item-gap);
      align-items: center;

      > .icon {
        color: var(--nagi-color-text-disabled);
      }

      > .link {
        color: var(--nagi-color-accent);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }

        &:focus-visible {
          border-radius: var(--nagi-radius-item);
          outline: none;
          box-shadow: var(--nagi-shadow-focus);
        }
      }

      > [aria-current="page"] {
        color: var(--nagi-color-text);
        font-weight: 650;
      }
    }
  }
}

@media (forced-colors: active) {
  .n-breadcrumb > .list > .item > .link:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
</style>
