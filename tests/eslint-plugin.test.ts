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

test("reports wrong targets and missing native attributes", () => {
  const messages = verify(`
    <template>
      <div v-bind="menu.triggerProps">Open</div>
      <ul v-bind="menu.menuProps"></ul>
    </template>
  `)
  assert.deepEqual(
    messages.map((message) => message.messageId),
    ["missingButtonType", "wrongElement", "missingPopover"],
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
  const combobox = verify(`<template><ul v-bind="combobox.listboxProps"></ul></template>`)
  const listbox = verify(`<template><ul v-bind="listbox.listboxProps"></ul></template>`)
  assert.equal(combobox[0]?.messageId, "missingPopover")
  assert.deepEqual(listbox, [])
})

test("all shipped Blueprints satisfy verified-bindings", () => {
  const files = fs
    .readdirSync(path.join(repo, "blueprints"), { recursive: true })
    .filter((file): file is string => typeof file === "string" && file.endsWith(".vue"))

  const failures = files.flatMap((file) => {
    const absolute = path.join(repo, "blueprints", file)
    return verify(fs.readFileSync(absolute, "utf8"), absolute).map((message) => ({
      file,
      line: message.line,
      message: message.message,
    }))
  })

  assert.deepEqual(failures, [])
})
