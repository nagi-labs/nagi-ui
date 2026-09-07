<script setup lang="ts">
import { NBadge, NButton, NCard, NProgress, NTable } from "@nagi-labs/nagi-ui/components";

useHead({ title: "Overview" });
const previewRows = [
  { account: "Acme Systems", status: "Healthy", mrr: "$18.6k" },
  { account: "Vertex Health", status: "Review", mrr: "$12.1k" },
  { account: "Northstar Labs", status: "Healthy", mrr: "$6.4k" },
];
const previewColumns = [
  { key: "account", label: "Account", rowHeader: true },
  { key: "status", label: "Health" },
  { key: "mrr", label: "MRR", align: "end" },
] as const;
</script>

<template>
  <div class="site-index-page">
    <section class="section -hero">
      <header class="header">
        <span class="text -eyebrow">Nagi UI</span>
        <h1 class="title">When the abstraction recedes, the source remains.</h1>
        <span class="text">
          Readable Vue components, with executable contracts for the behavior worth keeping. Own the
          source, change its shape, and keep its boundaries in view.
        </span>
        <div class="actions">
          <a
            class="link -primary"
            :href="useSitePath('/components/')"
            >Explore the components</a
          ><a
            class="link"
            :href="useSitePath('/concept/')"
            >Follow one owned change →</a
          >
        </div>
        <span class="text -proof">
          An ordinary component can be open to change without being left unguarded.
        </span>
      </header>
      <div
        class="unit -preview"
        aria-label="Live product interface preview"
      >
        <header class="header">
          <span class="value">Operations overview</span
          ><n-badge
            label="Live preview"
            tone="success"
          />
        </header>
        <div class="seg -metrics">
          <metric-card
            label="Revenue"
            value="$86.4k"
            change="+12.8%"
          /><metric-card
            label="Retention"
            value="108.2%"
            change="+2.4 pts"
          />
        </div>
        <n-card
          title="Priority accounts"
          description="Native table semantics, composed in a product surface."
        >
          <n-table
            :rows="previewRows"
            :columns="previewColumns"
            caption="Priority accounts"
            caption-hidden
          >
            <template #cell-status="{ value }">
              <n-badge
                :label="String(value)"
                :tone="value === 'Healthy' ? 'success' : 'warning'"
              />
            </template>
          </n-table>
        </n-card>
        <n-progress
          label="Quarterly onboarding target"
          :value="78"
          :max="100"
        />
      </div>
    </section>

    <section class="section -proof">
      <header class="header">
        <span class="text">What remains</span>
        <h2 class="title">Source, change, and behavior—kept in the same view.</h2>
      </header>
      <div class="unit -principles">
        <article class="article">
          <span
            class="icon"
            aria-hidden="true"
            >01</span
          >
          <h3 class="title">The source</h3>
          <span class="text">
            The component you read is the component that runs. Structure and styling stay in an
            ordinary Vue SFC; narrow Behavior APIs coordinate only what needs coordination.
          </span>
        </article>
        <article class="article">
          <span
            class="icon"
            aria-hidden="true"
            >02</span
          >
          <h3 class="title">The change</h3>
          <span class="text">
            When the anatomy needs to move, edit the component itself. The change happens where it
            can be seen, without translating it through another component language.
          </span>
        </article>
        <article class="article">
          <span
            class="icon"
            aria-hidden="true"
            >03</span
          >
          <h3 class="title">The behavior</h3>
          <span class="text">
            Shared Contracts describe what should travel. Implementation tests describe what stays
            local. Together they keep the boundary of a change visible.
          </span>
        </article>
      </div>
    </section>

    <section class="section -ownership">
      <div class="unit">
        <span class="text -eyebrow">Bring the component home</span>
        <h2 class="title">Let it settle into your repository.</h2>
        <span class="text">
          Package mode is there for light use. When the interface needs a structural change, bring
          the Vue source home together with the tests and maintenance view that explain its boundary.
        </span>
      </div>
      <div class="actions">
        <pre class="pre"><code>vp exec nagi-ui own dialog</code></pre>
        <n-button @click="navigateTo('/components/')">Browse components</n-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.site-index-page {
  --local-display-min: 2rem;
  --local-display-max: 3rem;
  --local-section-min: 1.375rem;
  --local-section-max: 1.75rem;
  --local-eyebrow-tracking: 0.04em;
  --local-display-tracking: -0.035em;
  --local-section-tracking: -0.02em;
  > .section {
    max-inline-size: var(--site-layout-max);
    inline-size: 100%;
    padding: calc(3 * var(--n-space-8)) max(var(--n-space-8), 4vw);
  }
  > .section.-hero {
    display: grid;
    grid-template-columns: minmax(20rem, 0.8fr) minmax(32rem, 1.2fr);
    gap: calc(3 * var(--n-space-8));
    align-items: start;
    padding-block-start: calc(5 * var(--n-space-8));

    > .header {
      display: grid;
      justify-items: start;

      > .title {
        max-inline-size: 34rem;
        margin: var(--n-space-5) 0;
        color: var(--site-color-ink-strong);
        font-size: clamp(var(--local-display-min), 6vw, var(--local-display-max));
        font-weight: 600;
        line-height: 1.12;
        letter-spacing: var(--local-display-tracking);
      }

      > .text {
        max-inline-size: 39rem;
        margin: 0;
        color: var(--nagi-color-text-muted);
        font-size: var(--n-font-size-5);

        &.-eyebrow {
          color: var(--nagi-color-text-muted);
          font-size: var(--n-font-size-2);
          font-weight: 500;
          letter-spacing: var(--local-eyebrow-tracking);
        }

        &.-proof {
          margin: var(--n-space-7) 0 0;
          font-size: var(--n-font-size-3);
        }
      }

      > .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--n-space-5);
        margin-block-start: var(--n-space-8);

        > .link {
          padding: var(--n-space-5) var(--n-space-7);
          color: var(--nagi-color-accent);
          font-weight: 500;
          text-decoration: none;

          &.-primary {
            border: var(--n-border-width-1) solid var(--nagi-color-border);
            border-radius: var(--n-radius-2);
            background: var(--nagi-color-surface);
            color: var(--nagi-color-text);
          }
        }
      }

    }

    > .unit.-preview {
      display: grid;
      gap: var(--n-space-7);
      justify-items: stretch;
      padding: var(--n-space-8);
      border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
      border-radius: var(--n-radius-3);
      background: color-mix(in srgb, var(--nagi-color-surface) 86%, var(--site-color-canvas));

      > .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-block-end: var(--n-space-5);
        border-block-end: var(--n-border-width-1) solid var(--nagi-color-border-muted);

        > .value {
          font-weight: 600;
        }
      }

      > .seg.-metrics {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--n-space-5);
      }
    }
  }
  > .section.-proof {
    border-block: var(--n-border-width-1) solid var(--nagi-color-border-muted);

    > .header {
      max-inline-size: 48rem;

      > .text {
        margin: 0;
        color: var(--nagi-color-text-muted);
        font-size: var(--n-font-size-2);
        font-weight: 500;
        letter-spacing: var(--local-eyebrow-tracking);
      }

      > .title {
        margin: var(--n-space-4) 0 0;
        color: var(--site-color-ink-strong);
        font-size: clamp(var(--local-section-min), 4vw, var(--local-section-max));
        letter-spacing: var(--local-section-tracking);
      }
    }

    > .unit.-principles {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: calc(2 * var(--n-space-8));
      margin-block-start: calc(3 * var(--n-space-8));

      > .article {
        > .icon {
          color: var(--site-color-brand);
          font-weight: 600;
        }

        > .title {
          margin: var(--n-space-5) 0 var(--n-space-3);
          color: var(--site-color-ink-strong);
          font-size: var(--n-font-size-5);
        }

        > .text {
          margin: 0;
          color: var(--nagi-color-text-muted);
        }
      }
    }
  }

  > .section.-ownership {
    display: flex;
    gap: calc(3 * var(--n-space-8));
    align-items: center;
    justify-content: space-between;
    margin-block-end: calc(3 * var(--n-space-8));
    border-radius: var(--n-radius-3);
    background: var(--nagi-color-surface);
    border: var(--n-border-width-1) solid var(--nagi-color-border-muted);

    > .unit {
      max-inline-size: 44rem;

      > .text.-eyebrow {
        color: var(--nagi-color-text-muted);
        font-size: var(--n-font-size-2);
        font-weight: 500;
        letter-spacing: var(--local-eyebrow-tracking);
      }

      > .title {
        margin: var(--n-space-5) 0;
        color: var(--site-color-ink-strong);
        font-size: clamp(var(--local-section-min), 4vw, var(--local-section-max));
        line-height: 1.08;
        letter-spacing: var(--local-section-tracking);
      }

      > .text {
        color: var(--nagi-color-text-muted);
      }
    }

    > .actions {
      display: grid;
      gap: var(--n-space-5);
      justify-items: stretch;

      > .pre {
        overflow-x: auto;
        margin: 0;
        padding: calc(2 * var(--n-space-8));
        border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
        border-radius: var(--n-radius-3);
        background: var(--site-color-canvas-muted);
        color: var(--nagi-color-text-muted);
        font-family: var(--site-font-code);
        line-height: 1.8;
      }
    }
  }
}
@media (max-width: 68rem) {
  .site-index-page {
    > .section.-hero {
      grid-template-columns: 1fr;
    }
  }
}
@media (max-width: 48rem) {
  .site-index-page {
    > .section {
      padding-block: calc(2 * var(--n-space-8));
    }
    > .section.-hero {
      min-block-size: auto;
    }
    > .section.-hero {
      > .unit.-preview {
        transform: none;
      }
    }
    > .section.-proof {
      > .unit.-principles {
        grid-template-columns: 1fr;
      }
    }
    > .section.-ownership {
      align-items: stretch;
      flex-direction: column;
    }
  }
}
@media (max-width: 38rem) {
  .site-index-page {
    > .section.-hero {
      > .unit.-preview {
        > .seg.-metrics {
          grid-template-columns: 1fr;
        }
      }
    }
  }
}
</style>
