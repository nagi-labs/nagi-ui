import { fileURLToPath } from "node:url";
import { nagiStyleCompiler } from "../packages/core/style-compiler.mjs";
import { componentDocuments } from "./data/components";

const repository = process.env.GITHUB_REPOSITORY?.split("/").at(-1);
const baseURL = process.env.NUXT_APP_BASE_URL ?? (repository ? `/${repository}/` : "/");
const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const coreRoot = fileURLToPath(new URL("../packages/core/", import.meta.url));

export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: "2024-11-01",
  alias: {
    "#nagi-blueprints": `${coreRoot}blueprints`,
    "#nagi-control-source": `${coreRoot}src`,
  },
  app: {
    baseURL,
    head: {
      htmlAttrs: { lang: "en" },
      titleTemplate: "%s · Nagi UI",
      script: [
        {
          innerHTML: `(function () {
  var path = location.pathname;
  var segment = path.slice(path.lastIndexOf("/") + 1);
  if (path !== "/" && !path.endsWith("/") && !segment.includes(".")) {
    location.replace(path + "/" + location.search + location.hash);
  }
})();`,
          tagPosition: "head",
        },
        {
          innerHTML: `(function () {
  var theme = "light";
  try {
    var stored = localStorage.getItem("nagi-theme");
    theme = stored === "dark" || stored === "light"
      ? stored
      : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch (_) {
    theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.dataset.theme = theme;
})();`,
          tagPosition: "head",
        },
      ],
      meta: [
        {
          name: "description",
          content:
            "Readable Vue components and the executable maintenance tests needed to own and change them.",
        },
        { name: "theme-color", content: "#315fbd" },
      ],
      link: [
        { rel: "icon", href: `${baseURL}favicon.svg`, type: "image/svg+xml" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@400;500&display=swap",
        },
      ],
    },
  },
  css: [`${coreRoot}theme/styles.css`, "~/assets/css/site.css"],
  nitro: {
    prerender: {
      routes: [
        "/",
        "/showcase",
        "/showcase/customers",
        "/showcase/customers/acme",
        "/showcase/settings",
        "/components",
        ...componentDocuments.map((entry) => `/components/${entry.slug}`),
      ],
    },
  },
  vite: {
    css: {
      postcss: {
        plugins: [nagiStyleCompiler()],
      },
    },
    server: { fs: { allow: [repoRoot] } },
  },
});
