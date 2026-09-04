import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import vue from "@vitejs/plugin-vue";
import { createServer } from "vite";
import { createSSRApp, h, type Component } from "vue";
import { renderToString } from "vue/server-renderer";

import { nagiThemeTokens } from "../packages/core/theme/tokens.mjs";

const repo = path.join(import.meta.dirname, "..");
const sourcePath = path.join(repo, "packages/core/blueprints/stepper/Stepper.vue");

function normalizeSsrHtml(html: string) {
  return html.replace(/\sdata-v-[\da-f]+/gu, "").replace(/<!--\[-->|<!--\]-->/gu, "");
}

async function renderStepper(props: Record<string, unknown>) {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "nagi-stepper-vite-"));
  const server = await createServer({
    configFile: false,
    plugins: [vue()],
    root: path.join(repo, "playground"),
    cacheDir,
    optimizeDeps: { noDiscovery: true, include: [] },
    logLevel: "silent",
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const stepper = (await server.ssrLoadModule(`/@fs${sourcePath}`)).default as Component;
    return normalizeSsrHtml(
      await renderToString(
        createSSRApp({
          render: () => h(stepper, props),
        }),
      ),
    );
  } finally {
    await server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
}

test("Stepper renders one named native step navigation", async () => {
  const html = await renderStepper({
    label: "Account setup",
    currentKey: "profile",
    items: [
      { key: "account", label: "Account", description: "Create credentials" },
      { key: "profile", label: "Profile", description: "Add personal details" },
      { key: "confirm", label: "Confirm", disabled: true },
    ],
  });

  assert.match(html, /^<nav class="n-stepper"[^>]*aria-label="Account setup">/u);
  assert.match(html, /<ol class="list">/u);
  assert.equal(html.match(/<li class="item">/gu)?.length, 3);
  assert.equal(html.match(/<button class="button" type="button"/gu)?.length, 3);
  assert.equal(html.match(/aria-current="step"/gu)?.length, 1);

  const current = html.match(/<button[^>]*aria-current="step"[^>]*>[\s\S]*?<\/button>/u)?.[0];
  assert.ok(current);
  assert.match(current, />Profile</u);

  const disabled = html.match(/<button[^>]*disabled[^>]*>[\s\S]*?<\/button>/u)?.[0];
  assert.ok(disabled);
  assert.match(disabled, />Confirm</u);

  assert.match(html, /<span class="text -secondary">Create credentials<\/span>/u);
});

test("Stepper does not invent a current step for an invalid controlled key", async () => {
  const html = await renderStepper({
    label: "Checkout",
    currentKey: "missing",
    items: [
      { key: "shipping", label: "Shipping" },
      { key: "payment", label: "Payment" },
    ],
  });

  assert.doesNotMatch(html, /aria-current="step"/u);
  assert.doesNotMatch(html, /tabindex|aria-selected|aria-activedescendant/u);
});

test("Stepper delegates selection policy and keeps editable anatomy in its SFC", () => {
  const source = fs.readFileSync(sourcePath, "utf8");
  const manifest = new Set<string>(nagiThemeTokens);

  assert.match(source, /export interface StepperItem/u);
  assert.match(source, /key: string/u);
  assert.match(source, /label: string/u);
  assert.match(source, /description\?: string/u);
  assert.match(source, /disabled\?: boolean/u);
  assert.match(source, /defineModel<string>\("currentKey", \{ required: true \}\)/u);
  assert.match(source, /useStepper<StepperItem>\(currentKey\)/u);
  assert.match(source, /<nav[\s\S]*?class="n-stepper"[\s\S]*?:aria-label="props\.label"[\s\S]*?>/u);
  assert.match(source, /<ol class="list">/u);
  assert.match(
    source,
    /<button[\s\S]*type="button"[\s\S]*:aria-current="stepper\.isCurrent\(item\) \? 'step' : undefined"/u,
  );
  assert.match(source, /:disabled="item\.disabled"[\s\S]*@click="stepper\.select\(item\)"/u);

  assert.doesNotMatch(source, /<slot\b|Teleport|provide\(|inject\(|asChild|data-state/u);
  assert.doesNotMatch(source, /\b(?:useId|watch|watchEffect|onMounted|document|window)\b/u);
  assert.doesNotMatch(source, /@keydown|onKeydown|tabindex|role="(?:tablist|tab|progressbar)"/u);
  assert.doesNotMatch(source, /wizard|validation|linear|form|panel/iu);
  assert.doesNotMatch(source, /\.zone\b/u);
  assert.doesNotMatch(source, /var\(--nagi-[^,)]+,/u, "theme tokens have no fallbacks");
  assert.doesNotMatch(source, /#[\da-f]{3,8}\b|\brgba?\(|\bhsla?\(/iu);
  assert.match(source, /@media \(forced-colors: active\)/u);
  assert.match(
    source,
    /&\[aria-current="step"\][\s\S]{0,80}> \.icon \{\s*border-width: calc\(var\(--n-border-width-1\) \+ var\(--n-border-width-2\)\)/u,
  );
  assert.match(source, /&:focus-visible \{\s*outline: 2px solid Highlight/u);
  assert.match(source, /&:disabled[\s\S]*> \.unit \{[\s\S]*> \.text/u);

  for (const match of source.matchAll(/var\((--nagi-[a-z0-9-]+)\)/g)) {
    assert.ok(manifest.has(match[1] as string), `unknown token ${match[1]}`);
  }
});
