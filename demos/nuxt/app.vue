<template>
  <main class="app">
    <h1 class="title">Nagi UI — Nuxt lazy-hydration demo (Phase 0 Demo A)</h1>
    <p class="text">
      The dropdown below is the real
      <code class="code">demos/NativePopoverDropdown.vue</code>, rendered
      through Nuxt with <code class="code">hydrate-after="8000"</code>: its
      client JS does not run until 8s after load. Open it immediately — it works
      before hydration because the wiring is native
      (<code class="code">popovertarget</code> + <code class="code">popover</code>),
      not replayed in JS (CHARTER §4.5). It also opens with JS fully disabled.
    </p>
    <LazyDropdownDemo :hydrate-after="8000" />
  </main>
</template>

<style scoped>
.app {
  padding: 2rem;
  font-family: ui-sans-serif, system-ui, sans-serif;

  > .title {
    font-size: 1.4rem;
  }

  > .text {
    max-inline-size: 44rem;

    > .code {
      font-family: ui-monospace, monospace;
      background: #eef2f4;
      padding: 0.1em 0.35em;
      border-radius: 0.3em;
    }
  }
}
</style>
