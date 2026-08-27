import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import { Linter } from "eslint"
import vueParser from "vue-eslint-parser"

import nagiUi from "../packages/eslint-plugin-nagi-ui/src/index.ts"

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function verify(source: string, filename = "Blueprint.vue") {
  const linter = new Linter()
  return linter.verify(
    source,
    [
      {
        files: ["**/*.vue"],
        languageOptions: {
          parser: vueParser,
          parserOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            // This rule only consumes the template AST. Skipping script
            // parsing is an official vue-eslint-parser mode and keeps this
            // integration compatible with TypeScript 7.
            parser: false,
          },
        },
        plugins: { "nagi-ui": nagiUi },
        rules: { "nagi-ui/verified-bindings": "error" },
      },
    ],
    { filename },
  )
}

test("accepts a correctly wired menu and keyed item loop", () => {
  const messages = verify(`
    <template>
      <button type="button" v-bind="menu.triggerProps">Open</button>
      <ul popover v-bind="menu.menuProps">
        <li v-for="item in items" :key="item.key">
          <button type="button" v-bind="menu.itemProps(item)">{{ item.label }}</button>
        </li>
      </ul>
    </template>
  `)
  assert.deepEqual(messages, [])
})

test("accepts href anchors for action menu items and rejects anchor-shaped buttons", () => {
  const valid = verify(`
    <template>
      <ul popover v-bind="menu.menuProps">
        <li v-for="item in items" :key="item.key">
          <a :href="item.href" v-bind="menu.itemProps(item)">{{ item.label }}</a>
        </li>
      </ul>
    </template>
  `)
  assert.deepEqual(valid, [])

  const invalid = verify(`
    <template>
      <a v-bind="menu.itemProps(item)">{{ item.label }}</a>
    </template>
  `)
  assert.equal(invalid[0]?.messageId, "missingAnchorHref")
})

test("reports wrong targets and missing native attributes", () => {
  const messages = verify(`
    <template>
      <div v-bind="menu.triggerProps">Open</div>
      <ul v-bind="menu.menuProps"></ul>
    </template>
  `)
  assert.deepEqual(
    messages.map((message) => message.messageId),
    ["wrongElement", "missingPopover"],
  )
})

test("reports direct semantic overrides and multiple object bindings", () => {
  const messages = verify(`
    <template>
      <ul role="listbox" v-bind="menu.menuProps" v-bind="localProps" popover></ul>
    </template>
  `)
  assert.deepEqual(
    messages.map((message) => message.messageId),
    ["protectedOverride", "multipleObjectBindings"],
  )
})

test("requires a key on the v-for owner", () => {
  const messages = verify(`
    <template>
      <ul popover v-bind="menu.menuProps">
        <li v-for="item in items">
          <button type="button" v-bind="menu.itemProps(item)">{{ item.label }}</button>
        </li>
      </ul>
    </template>
  `)
  assert.equal(messages.length, 1)
  assert.equal(messages[0]?.messageId, "missingKey")
})

test("requires popover for the Combobox popup but not standalone Listbox", () => {
  const combobox = verify(`<template><div v-bind="combobox.popupProps"></div></template>`)
  const listbox = verify(`<template><ul v-bind="listbox.listboxProps"></ul></template>`)
  assert.equal(combobox[0]?.messageId, "missingPopover")
  assert.deepEqual(listbox, [])
})

test("protects Combobox disabled and readonly behavior from DOM-only overrides", () => {
  const messages = verify(`
    <template>
      <input disabled readonly v-bind="combobox.inputProps">
    </template>
  `)
  assert.deepEqual(
    messages.map((message) => message.messageId),
    ["protectedOverride", "protectedOverride"],
  )
})

test("accepts owned Tabs wiring and protects its role relationships", () => {
  const valid = verify(`
    <template>
      <div v-bind="tabs.tablistProps">
        <button
          v-for="item in items"
          :key="item.key"
          v-bind="tabs.tabProps(item)"
        >{{ item.label }}</button>
      </div>
      <section
        v-for="item in items"
        :key="item.key"
        v-bind="tabs.panelProps(item)"
      ></section>
    </template>
  `)
  assert.deepEqual(valid, [])

  const invalid = verify(`
    <template>
      <ul v-bind="tabs.tablistProps"></ul>
      <button role="button" v-bind="tabs.tabProps(item)">Tab</button>
      <section hidden v-bind="tabs.panelProps(item)"></section>
    </template>
  `)
  assert.deepEqual(
    invalid.map((message) => message.messageId),
    ["wrongElement", "protectedOverride", "protectedOverride"],
  )
})

test("protects native Accordion details and summary wiring", () => {
  const valid = verify(`
    <template>
      <details
        v-for="item in items"
        :key="item.key"
        v-bind="accordion.detailsProps(item.key)"
      >
        <summary v-bind="accordion.summaryProps(item.disabled)">{{ item.summary }}</summary>
      </details>
    </template>
  `)
  assert.deepEqual(valid, [])

  const invalid = verify(`
    <template>
      <section v-bind="accordion.detailsProps(item.key)">
        <button aria-disabled="false" v-bind="accordion.summaryProps(item.disabled)">
          {{ item.summary }}
        </button>
      </section>
    </template>
  `)
  assert.deepEqual(
    invalid.map((message) => message.messageId),
    ["wrongElement", "protectedOverride", "wrongElement"],
  )
})

test("verifies date grid and segmented-field bindings, including merged props", () => {
  const valid = verify(`
    <template>
      <div v-bind="mergeNagiProps(field.fieldProps, attrs)">
        <span v-for="segment in segments" :key="segment.key" v-bind="field.segmentProps(segment)"></span>
        <input v-bind="field.formValueProps">
      </div>
      <table v-bind="calendar.gridProps">
        <tbody><tr><td v-for="cell in cells" :key="cell.key" v-bind="calendar.gridCellProps(cell)">
          <button v-bind="calendar.cellButtonProps(cell)"></button>
        </td></tr></tbody>
      </table>
    </template>
  `)
  assert.deepEqual(valid, [])

  const invalid = verify(`
    <template>
      <section v-bind="mergeNagiProps(field.fieldProps, attrs)"></section>
      <div role="grid" v-bind="calendar.gridProps"></div>
      <button disabled v-bind="calendar.cellButtonProps(cell)"></button>
      <div v-bind="field.formValueProps"></div>
    </template>
  `)
  assert.deepEqual(
    invalid.map((message) => message.messageId),
    ["wrongElement", "protectedOverride", "wrongElement", "protectedOverride", "wrongElement"],
  )
})

test("protects expanded-catalog OTP, carousel, Menubar, and NavigationMenu contracts", () => {
  const valid = verify(`
    <template>
      <input v-bind="otp.otpInputProps">
      <article v-for="slide in slides" :key="slide.key" v-bind="carousel.slideProps(slide)"></article>
      <button type="button" v-bind="menubar.menubarTriggerProps(menu)"></button>
      <button v-bind="navigation.navigationTriggerProps(item)"></button>
    </template>
  `)
  assert.deepEqual(valid, [])

  const invalid = verify(`
    <template>
      <div v-bind="otp.otpInputProps"></div>
      <input pattern="wrong" v-bind="otp.otpInputProps">
      <div v-for="slide in slides" v-bind="carousel.slideProps(slide)"></div>
      <button aria-expanded="false" v-bind="menubar.menubarTriggerProps(menu)"></button>
      <a v-bind="navigation.navigationTriggerProps(item)"></a>
    </template>
  `)
  assert.deepEqual(
    invalid.map((message) => message.messageId),
    [
      "wrongElement",
      "protectedOverride",
      "missingKey",
      "wrongElement",
      "missingButtonType",
      "protectedOverride",
      "wrongElement",
    ],
  )
})

test("all shipped Blueprints satisfy verified-bindings", () => {
  const files = fs
    .readdirSync(path.join(repo, "packages/core/blueprints"), { recursive: true })
    .filter((file): file is string => typeof file === "string" && file.endsWith(".vue"))

  const failures = files.flatMap((file) => {
    const absolute = path.join(repo, "packages/core/blueprints", file)
    return verify(fs.readFileSync(absolute, "utf8"), absolute).map((message) => ({
      file,
      line: message.line,
      message: message.message,
    }))
  })

  assert.deepEqual(failures, [])
})
