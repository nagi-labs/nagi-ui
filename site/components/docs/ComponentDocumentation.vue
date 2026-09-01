<template>
  <div class="site-component-documentation">
    <section
      class="section -preview"
      aria-labelledby="component-basic-heading"
    >
      <header class="header">
        <h2
          id="component-basic-heading"
          class="title"
        >
          Basic
        </h2>
        <slot name="basic-meta" />
      </header>
      <slot name="basic-description" />
      <slot name="basic" />
    </section>

    <section
      id="properties"
      class="section -properties"
      aria-labelledby="component-api-heading"
    >
      <header class="header">
        <h2
          id="component-api-heading"
          class="title"
        >
          API
        </h2>
      </header>
      <slot name="api" />
    </section>

    <section
      id="owned-source"
      class="section -ownership"
      aria-labelledby="component-source-heading"
    >
      <header class="header">
        <h2
          id="component-source-heading"
          class="title"
        >
          Source
        </h2>
      </header>
      <slot name="source" />
    </section>

    <slot />
  </div>
</template>

<style scoped>
.site-component-documentation {
  display: grid;
  gap: calc(2 * var(--n-space-8));

  > .section {
    display: grid;
    gap: var(--n-space-7);

    > .header {
      display: flex;
      align-items: end;
      justify-content: space-between;

      > .title {
        margin: 0;
        color: var(--site-color-ink-strong);
        font-size: var(--n-font-size-6);
      }
    }

    > :slotted(.text) {
      max-inline-size: 54rem;
      margin: 0;
      color: var(--nagi-color-text-muted);
    }

    > :slotted(.n-table) {
      .n-table-cell-content {
        > .code {
          color: var(--nagi-color-text);
          font-family: var(--site-font-code);
          font-size: inherit;
        }
      }
    }
  }
}
</style>
