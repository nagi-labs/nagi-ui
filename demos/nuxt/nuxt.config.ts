import { fileURLToPath } from "node:url"

// CHARTER §10 Phase 0 Demo A. This demo renders the focused native-popover proof
// (../NativePopoverDropdown.vue) inside a real Nuxt app under
// delayed hydration, to prove §4.5: because the wiring is native
// (`popovertarget` + `popover`), the dropdown opens before the client hydrates
// — and with JS fully disabled.
const repoRoot = fileURLToPath(new URL("../../", import.meta.url))
const libEntry = fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url))

export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: "2024-11-01",
  // The proof component imports the library by its published name; resolve it to the
  // workspace source so Vite transpiles it (raw .ts, .ts-extension imports).
  alias: {
    "@nagi-labs/nagi-ui": libEntry,
  },
  vite: {
    // The proof SFC lives outside the Nuxt root; allow Vite to read it.
    server: {
      fs: {
        allow: [repoRoot],
      },
    },
  },
})
