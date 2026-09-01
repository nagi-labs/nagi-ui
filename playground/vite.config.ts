import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"
import { nagiStyleCompiler } from "../packages/core/style-compiler.mjs"

export default defineConfig({
  css: {
    postcss: {
      plugins: [nagiStyleCompiler()],
    },
  },
  plugins: [vue()],
})
