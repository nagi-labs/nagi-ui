import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import vue from "@vitejs/plugin-vue"
import { createServer } from "vite"
import { createSSRApp, h } from "vue"
import { renderToString } from "vue/server-renderer"

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

// CHARTER §4.5: the standard attributes must be present in server-rendered
// HTML, so popovertarget wiring works before hydration — and with no JS at
// all. This test is the machine-checkable half of Phase 0 demo A; the
// written artifact is the human-clickable half (a page with zero scripts).
test("SSR emits the full popover wiring as plain attributes", async () => {
  // No configFile and a tmp cacheDir: vite must not write into the repo
  // (sandboxed test runs only get tmp-dir write access).
  const server = await createServer({
    configFile: false,
    plugins: [vue()],
    root: path.join(repo, "playground"),
    cacheDir: fs.mkdtempSync(path.join(os.tmpdir(), "nagi-vite-")),
    logLevel: "silent",
    server: { middlewareMode: true },
    appType: "custom",
  })

  try {
    const blueprint = (
      await server.ssrLoadModule("/@fs" + path.join(repo, "blueprints/dropdown/DropdownMenu.vue"))
    ).default
    const lab = (
      await server.ssrLoadModule("/@fs" + path.join(repo, "playground/src/PopoverLab.vue"))
    ).default

    const items = [
      { key: "rename", label: "Rename" },
      { key: "duplicate", label: "Duplicate" },
    ]
    const blueprintHtml = await renderToString(
      createSSRApp({ render: () => h(blueprint, { label: "Actions", items }) }),
    )
    const labHtml = await renderToString(createSSRApp(lab))

    // The trigger carries popovertarget, and its value matches the popover id.
    const target = blueprintHtml.match(/popovertarget="([^"]+)"/)?.[1]
    assert.ok(target, "blueprint trigger renders popovertarget on the server")
    assert.ok(
      blueprintHtml.includes(`id="${target}"`),
      "popovertarget points at the rendered popover id",
    )
    assert.match(blueprintHtml, /<div[^>]*\spopover[\s>]/, "popover attribute is server-rendered")

    // The directive path renders its attribute too (getSSRProps).
    const directiveButton = labHtml.match(/<button([^>]*)>Directive trigger/)?.[1]
    assert.ok(directiveButton !== undefined, "directive trigger button renders")
    assert.match(directiveButton, /popovertarget="/, "v-popover-trigger renders via getSSRProps")

    // Write the zero-JS artifact: the blueprint's server HTML with no script
    // tags at all. Opening it in a browser, the dropdown opens natively.
    const artifact = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Nagi UI — zero-JS proof</title>
<style>body { font-family: ui-sans-serif, system-ui; padding: 2rem; }</style>
</head>
<body>
<h1>Zero-JS proof</h1>
<p>This page contains no script tags. The dropdown below is the server-rendered
output of DropdownMenu.vue — clicking it works because the wiring is native
(<code>popovertarget</code>), not hydration.</p>
${blueprintHtml}
</body>
</html>
`
    assert.ok(!artifact.includes("<script"), "artifact must contain no scripts")
    const artifactPath =
      process.env.NAGI_SSR_ARTIFACT ?? path.join(os.tmpdir(), "nagi-zero-js-demo.html")
    fs.writeFileSync(artifactPath, artifact)
    console.log(`zero-JS artifact: ${artifactPath}`)
  } finally {
    await server.close()
  }
})
