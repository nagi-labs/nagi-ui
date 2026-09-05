<script setup lang="ts">
useHead({ title: "Own, change, verify" });

const repository = "https://github.com/nagi-labs/nagi-ui";
const deepSea = "https://github.com/nagi-labs/nagi-ui-deep-sea";
</script>

<template>
  <div class="site-concept-page">
    <header class="header">
      <span class="text -eyebrow">One concrete ownership story</span>
      <h1 class="title">Own readable Vue source. Change it. Keep the behavior you chose.</h1>
      <span class="text">
        Nagi UI pairs editable Vue components with executable checks for the behavior an owner
        intends to preserve. The example below follows Dialog; it does not claim that every
        Definition is complete or that ownership is the right tradeoff for every application.
      </span>
    </header>

    <section class="section -change">
      <h2 class="title">1. Make a structural change in the source you own</h2>
      <span class="text">
        Suppose product design needs the action row before the title and body. Package props and
        slots are useful for bounded configuration, but this is an anatomy change: own the SFC and
        edit the visible template directly.
      </span>
      <pre class="pre"><code class="code">vp exec nagi-ui own dialog

dialog/
├── Dialog.vue
└── dialog.definition.ts</code></pre>
      <span class="text">
        The current command copies the canonical SFC and Definition with provenance. It does not
        vendor all Nagi runtime or test code: Dialog.vue still imports the shared
        <code class="code">useDialog</code> behavior and <code class="code">vDialogClose</code>
        directive from the installed package.
      </span>
      <pre class="pre"><code class="code">Canonical: header(title + description) → section(body) → footer(actions)
Owned:     nav(actions) → article(description + body + title)</code></pre>
      <div class="actions">
        <a
          class="link"
          :href="`${repository}/blob/main/packages/core/blueprints/dialog/Dialog.vue`"
          >Read the canonical Dialog.vue</a
        ><a
          class="link"
          :href="`${repository}/blob/main/playground/src/OwnedContractLab.vue#L955-L1008`"
          >Read the rearranged owned source</a
        >
      </div>
    </section>

    <section class="section -contract">
      <h2 class="title">2. Preserve the portable behavior with a shared Contract</h2>
      <span class="text">
        The shared Dialog Contract checks observable behavior such as a named modal surface,
        accepted open state, explicit close, focus containment, and restoration to the invoker.
        It discovers behavior through roles, names, state, and relationships rather than Nagi CSS
        classes or a fixed child index.
      </span>
      <pre class="pre"><code class="code">dialogContract({
  fixture: "owned",
  includeStandardImplementation: false,
  dialogName: "Owned profile editor",
  description: "Its footer moved before the title and body.",
})</code></pre>
      <span class="text">
        This is an explanatory excerpt, not a directly executable call. The complete existing
        invocation also supplies the Definition, fixture URL, accessible names, model status,
        and controlled-mode expectations required by the public API. The repository runs that
        rearranged owned fixture against the same
        <code class="code">nagi/dialog</code> requirement set used by the package Blueprint.
      </span>
      <a
        class="link"
        :href="`${repository}/blob/main/tests/browser/conformance-contract.spec.ts#L388-L428`"
        >Read the complete package and owned Contract calls →</a
      >
    </section>

    <section class="section -implementation">
      <h2 class="title">3. Keep implementation-specific evidence separate</h2>
      <span class="text">
        The standard Blueprint delegates presence and modal behavior to native
        <code class="code">&lt;dialog&gt;</code>. Deep Sea owns a different Dialog implementation,
        retains its surface for Motion exit, and documents that choice separately while adopting
        the same Nagi Dialog requirement set. Its local tests cover the retained presence and
        motion policy; those are not portable guarantees imposed on every Dialog.
      </span>
      <div class="actions">
        <a
          class="link"
          :href="`${deepSea}/blob/main/src/components/nagi/dialog/Dialog.vue`"
          >Deep Sea owned Dialog.vue</a
        ><a
          class="link"
          :href="`${deepSea}/blob/main/src/components/nagi/dialog/dialog.definition.ts`"
          >Deep Sea Implementation definition</a
        ><a
          class="link"
          :href="`${deepSea}/blob/main/tests/dialog.spec.ts`"
          >Deep Sea Dialog tests</a
        >
      </div>
    </section>

    <section class="section -failure">
      <h2 class="title">4. A passing example is not the only evidence</h2>
      <span class="text">
        The isolated mutation suite intentionally redirects focus after close. The shared
        <code class="code">DLG-FOCUS-02</code> assertion rejects it because focus no longer returns
        to the invoker. The broken fixture stays outside the normal implementation; the Contract
        is not weakened to make it pass.
      </span>
      <a
        class="link"
        :href="`${repository}/blob/main/tests/browser/definition-mutations.spec.ts#L320-L331`"
        >Read the failing mutation proof →</a
      >
    </section>

    <section class="section -limits">
      <h2 class="title">What remains yours</h2>
      <span class="text">
        A Contract verifies only its named requirements and tested browsers. It does not prove the
        whole Definition, every accessibility requirement, visual correctness, animation quality,
        or application-specific policy. Draft and WIP Definitions remain labeled as such. After
        ownership, your repository decides when source, local tests, and requirements intentionally
        diverge; package runtime and shared Contract dependencies remain until you replace or vendor
        them deliberately.
      </span>
      <a
        class="link -feedback"
        href="https://github.com/nagi-labs/nagi-ui/issues/new?template=ownership-model-feedback.md"
        >Discuss the ownership model →</a
      >
    </section>
  </div>
</template>

<style scoped>
.site-concept-page {
  --local-eyebrow-tracking: 0.08em;
  --local-display-min: 2rem;
  --local-display-max: 3rem;
  --local-display-tracking: -0.035em;
  --local-link-offset: 0.2em;
  display: grid;
  gap: calc(2 * var(--n-space-8));
  inline-size: 100%;
  max-inline-size: 58rem;
  padding: calc(4 * var(--n-space-8)) max(var(--n-space-8), 4vw);

  > .header,
  > .section {
    display: grid;
    gap: var(--n-space-6);
  }

  > .header {
    padding-block-end: calc(2 * var(--n-space-8));
    border-block-end: var(--n-border-width-1) solid var(--nagi-color-border-muted);

    > .text {
      color: var(--nagi-color-text-muted);
      font-size: var(--n-font-size-5);

      &.-eyebrow {
        color: var(--site-color-brand);
        font-size: var(--n-font-size-2);
        font-weight: 600;
        letter-spacing: var(--local-eyebrow-tracking);
        text-transform: uppercase;
      }
    }

    > .title {
      margin: 0;
      color: var(--site-color-ink-strong);
      font-size: clamp(var(--local-display-min), 6vw, var(--local-display-max));
      line-height: 1.08;
      letter-spacing: var(--local-display-tracking);
    }
  }

  > .section {
    padding: calc(2 * var(--n-space-8));
    border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
    border-radius: var(--n-radius-3);
    background: var(--nagi-color-surface);

    > .title {
      margin: 0;
      color: var(--site-color-ink-strong);
      font-size: var(--n-font-size-6);
    }

    > .text {
      color: var(--nagi-color-text-muted);

      > .code {
        font-family: var(--site-font-code);
      }
    }

    > .pre {
      overflow-x: auto;
      margin: 0;
      padding: var(--n-space-7);
      border-radius: var(--n-radius-2);
      background: var(--site-color-code);
      color: var(--site-color-code-text);
      font-family: var(--site-font-code);
      line-height: 1.7;
    }

    > .link,
    > .actions > .link {
      color: var(--nagi-color-accent);
      font-weight: 600;
      text-underline-offset: var(--local-link-offset);
    }

    > .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--n-space-6);
    }
  }
}

@media (max-width: 42rem) {
  .site-concept-page {
    padding-inline: var(--n-space-5);

    > .section {
      padding: var(--n-space-7);
    }
  }
}
</style>
