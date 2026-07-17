import assert from "node:assert/strict"
import test from "node:test"

import {
  mergeNagiProps,
  NagiPropConflictError,
} from "@nagi-labs/nagi-ui"

test("merges class and style through Vue normalization", () => {
  const merged = mergeNagiProps(
    { class: "button primary", style: { color: "red", padding: "4px" } },
    { class: ["primary", { active: true }], style: [{ color: "blue" }, "margin: 1px"] },
  )

  assert.equal(merged.class, "button primary active")
  assert.deepEqual(merged.style, {
    color: "blue",
    padding: "4px",
    margin: "1px",
  })
})

test("composes Vue event handlers in source order", () => {
  const calls: string[] = []
  const merged = mergeNagiProps(
    { onClick: (value: string) => calls.push(`nagi:${value}`) },
    {
      onClick: [
        (value: string) => calls.push(`consumer:${value}`),
        (value: string) => calls.push(`analytics:${value}`),
      ],
    },
  )

  merged.onClick("save")
  assert.deepEqual(calls, ["nagi:save", "consumer:save", "analytics:save"])
})

test("merges and de-duplicates token-list ARIA relationships", () => {
  const merged = mergeNagiProps(
    { "aria-describedby": "hint shared", "aria-controls": "menu" },
    { "aria-describedby": "shared error", "aria-controls": "preview menu" },
  )

  assert.equal(merged["aria-describedby"], "hint shared error")
  assert.equal(merged["aria-controls"], "menu preview")
})

test("allows equal semantic attributes and rejects overrides", () => {
  assert.equal(mergeNagiProps({ role: "menu" }, { role: "menu" }).role, "menu")

  assert.throws(
    () => mergeNagiProps({ role: "menu" }, { role: "listbox" }),
    (error) => error instanceof NagiPropConflictError && error.key === "role",
  )
  assert.throws(
    () => mergeNagiProps({ popovertarget: "actions" }, { popovertarget: "other" }),
    NagiPropConflictError,
  )
})

test("undefined does not override behavior wiring", () => {
  const merged = mergeNagiProps(
    { id: "actions", "aria-haspopup": "menu" },
    { id: undefined, "aria-haspopup": undefined },
  )

  assert.equal(merged.id, "actions")
  assert.equal(merged["aria-haspopup"], "menu")
})

test("keeps source getters live", () => {
  let expanded = false
  const behavior = {
    get "aria-expanded"() {
      return expanded ? "true" : "false"
    },
  }
  const merged = mergeNagiProps(behavior, { class: "trigger" })

  assert.equal(merged["aria-expanded"], "false")
  expanded = true
  assert.equal(merged["aria-expanded"], "true")
})

test("does not mutate source objects", () => {
  const behavior = { class: "trigger", onClick: () => undefined }
  const local = { class: "large", onClick: () => undefined }
  const behaviorSnapshot = { ...behavior }
  const localSnapshot = { ...local }

  mergeNagiProps(behavior, local)

  assert.deepEqual(behavior, behaviorSnapshot)
  assert.deepEqual(local, localSnapshot)
})
