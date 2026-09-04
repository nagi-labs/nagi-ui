<script setup lang="ts">
import { componentCategories, componentDocuments } from "~/data/components";
import {
  componentDefinitionAuditStatus,
  componentDefinitionEvidenceStatus,
} from "~/data/component-definitions";

useHead({ title: "Components" });
</script>

<template>
  <div class="site-index">
    <page-heading
      eyebrow="Component catalog"
      title="One component, one focused page"
      description="Explore every component that ships in Nagi UI. Each page keeps the live native behavior, essential API, and ownership path together."
    />
    <section
      v-for="category in componentCategories"
      :key="category"
      class="section"
    >
      <header class="header">
        <h2 class="title">{{ category }}</h2>
        <span class="value">
          {{ componentDocuments.filter((entry) => entry.category === category).length }} components
        </span>
      </header>
      <div class="unit -grid">
        <a
          v-for="entry in componentDocuments.filter((item) => item.category === category)"
          :key="entry.slug"
          class="link"
          :href="useSitePath(`/components/${entry.slug}`)"
        >
          <span class="seg -name">
            <strong class="strong">{{ entry.name }}</strong>
            <span class="fr -statuses">
              <small
                class="note -status"
                :data-audit-status="componentDefinitionAuditStatus(entry.name)"
              >
                Contract audit
                {{ componentDefinitionAuditStatus(entry.name) === "ready" ? "ready" : "WIP" }}
              </small>
              <small
                class="note -status"
                :data-evidence-status="componentDefinitionEvidenceStatus(entry.name)"
              >
                Browser evidence
                {{
                  componentDefinitionEvidenceStatus(entry.name) === "not-collected"
                    ? "not collected"
                    : componentDefinitionEvidenceStatus(entry.name)
                }}
              </small>
            </span>
          </span>
          <p class="text">{{ entry.description }}</p>
          <span
            class="icon"
            aria-hidden="true"
            >→</span
          >
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.site-index {
  --local-status-radius: 999px;

  display: grid;
  gap: calc(3 * var(--n-space-8));
  max-inline-size: var(--site-layout-max);
  inline-size: 100%;
  padding: calc(3 * var(--n-space-8)) max(var(--n-space-8), 4vw);

  > .section {
    display: grid;
    gap: var(--n-space-7);

    > .header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      padding-block-end: var(--n-space-5);
      border-block-end: var(--n-border-width-1) solid var(--nagi-color-border-muted);

      > .title {
        margin: 0;
        color: var(--site-color-ink-strong);
        font-size: var(--n-font-size-6);
      }

      > .value {
        color: var(--nagi-color-text-muted);
        font-size: var(--n-font-size-3);
      }
    }

    > .unit.-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--n-space-5);

      > .link {
        position: relative;
        display: grid;
        gap: var(--n-space-3);
        padding: var(--n-space-7);
        border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
        border-radius: var(--n-radius-2);
        background: var(--nagi-color-surface);
        color: var(--nagi-color-text);
        text-decoration: none;

        &:hover {
          border-color: var(--nagi-color-accent);
          box-shadow: var(--n-shadow-1);
        }

        > .seg.-name {
          display: flex;
          flex-wrap: wrap;
          gap: var(--n-space-2);
          align-items: center;
          padding-inline-end: var(--n-space-7);

          > .strong {
            color: var(--site-color-ink-strong);
            font-size: var(--n-font-size-4);
          }

          > .fr.-statuses {
            display: flex;
            flex-wrap: wrap;
            gap: var(--n-space-2);

            > .note.-status {
              padding: var(--n-space-1) var(--n-space-2);
              border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
              border-radius: var(--local-status-radius);
              color: var(--nagi-color-text-muted);
              font-size: var(--n-font-size-1);

              &[data-audit-status="ready"],
              &[data-evidence-status="passed"] {
                border-color: var(--nagi-color-accent);
                background: var(--nagi-color-surface-accent);
                color: var(--nagi-color-text);
              }

              &[data-audit-status="wip"] {
                border-color: var(--nagi-color-warning);
                background: var(--nagi-color-surface-warning);
                color: var(--nagi-color-warning);
              }

              &[data-evidence-status="failed"] {
                border-color: var(--nagi-color-danger);
                background: var(--nagi-color-surface-danger);
                color: var(--nagi-color-danger);
              }
            }
          }
        }

        > .text {
          color: var(--nagi-color-text-muted);
          font-size: var(--n-font-size-3);
        }

        > .icon {
          position: absolute;
          inset-block-start: var(--n-space-6);
          inset-inline-end: var(--n-space-6);
          color: var(--nagi-color-accent);
        }
      }
    }
  }
}

@media (max-width: 64rem) {
  .site-index {
    > .section {
      > .unit.-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  }
}

@media (max-width: 40rem) {
  .site-index {
    > .section {
      > .unit.-grid {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>
