import { defineConfig } from "vite";

export default defineConfig({
  build: {
    minify: false,
    lib: {
      entry: {
        definition: "src/definition.ts",
        "test/index": "src/test/index.ts",
        "contracts/button": "blueprints/button/button.definition.ts",
        "contracts/carousel": "blueprints/carousel/carousel.definition.ts",
        "contracts/combobox": "blueprints/combobox/combobox.definition.ts",
        "contracts/dialog": "blueprints/dialog/dialog.definition.ts",
        "contracts/toast": "blueprints/toast/toast.definition.ts",
      },
      formats: ["es"],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    outDir: "dist",
    rollupOptions: {
      external: ["@floating-ui/dom", "@internationalized/date", "@playwright/test", "vue"],
    },
  },
});
