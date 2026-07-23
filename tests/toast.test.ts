import assert from "node:assert/strict"
import test from "node:test"

import { createToastManager, useToast } from "../packages/core/src/toast.ts"

test("useToast stays a setup-scoped DOM binding while the manager works outside Vue", () => {
  assert.throws(() => useToast(), /must run during Vue setup/)
  const manager = createToastManager({ duration: 0 })
  assert.equal(manager.add({ description: "Outside Vue" }), "nagi-toast-1")
})

test("explicit managers keep structured toast state isolated", () => {
  const first = createToastManager({ duration: 0 })
  const second = createToastManager({ duration: 0 })
  const action = { label: "Undo", onClick: () => {} }

  const id = first.add({
    title: "Saved",
    description: "The profile is up to date",
    tone: "success",
    priority: "assertive",
    action,
  })
  action.label = "Mutated outside the manager"

  assert.equal(id, "nagi-toast-1")
  assert.deepEqual(first.toasts.value, [
    {
      id,
      revision: 0,
      title: "Saved",
      description: "The profile is up to date",
      tone: "success",
      priority: "assertive",
      action: { label: "Undo", onClick: action.onClick },
      duration: 0,
    },
  ])
  assert.deepEqual(second.toasts.value, [])
})

test("add with an existing id upserts in place and update never resurrects a missing toast", () => {
  const manager = createToastManager({ duration: 0 })
  manager.add({ id: "sync", description: "Starting", tone: "accent" })
  manager.add({ id: "later", description: "Second" })

  assert.equal(manager.add({ id: "sync", title: "Ready", tone: "success" }), "sync")
  assert.equal(manager.toasts.value.length, 2)
  assert.deepEqual(manager.toasts.value.map((toast) => toast.id), ["sync", "later"])
  assert.deepEqual(manager.toasts.value[0], {
    id: "sync",
    revision: 1,
    title: "Ready",
    description: "Starting",
    tone: "success",
    priority: "polite",
    action: undefined,
    duration: 0,
  })

  manager.update("sync", { title: null, description: "Complete", priority: "assertive" })
  assert.equal(manager.toasts.value[0]?.revision, 2)
  assert.equal(manager.toasts.value[0]?.title, undefined)
  assert.equal(manager.toasts.value[0]?.description, "Complete")

  manager.close("sync")
  manager.update("sync", { description: "Must stay closed" })
  assert.deepEqual(manager.toasts.value.map((toast) => toast.id), ["later"])
})

test("limit closes the oldest toast and close without an id closes all", () => {
  const manager = createToastManager({ duration: 0, limit: 2 })
  manager.add({ id: "one", description: "One" })
  manager.add({ id: "two", description: "Two" })
  manager.add({ id: "three", description: "Three" })
  assert.deepEqual(manager.toasts.value.map((toast) => toast.id), ["two", "three"])

  manager.close("unknown")
  assert.equal(manager.toasts.value.length, 2)
  manager.close()
  assert.deepEqual(manager.toasts.value, [])
})

test("auto-dismiss refreshes on update and pauses with remaining time", (t) => {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: 1000 })
  const manager = createToastManager({ duration: 100 })
  const id = manager.add({ description: "Timed" })

  t.mock.timers.tick(60)
  manager.update(id, { description: "Updated", duration: 200 })
  t.mock.timers.tick(80)
  manager.pause()
  t.mock.timers.tick(1000)
  assert.equal(manager.toasts.value.length, 1)

  manager.resume()
  t.mock.timers.tick(119)
  assert.equal(manager.toasts.value.length, 1)
  t.mock.timers.tick(1)
  assert.equal(manager.toasts.value.length, 0)
})

test("duration zero stays open and dispose clears timers and rejects reuse", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] })
  const manager = createToastManager({ duration: 0 })
  manager.add({ description: "Persistent" })
  t.mock.timers.tick(60_000)
  assert.equal(manager.toasts.value.length, 1)

  manager.dispose()
  assert.deepEqual(manager.toasts.value, [])
  assert.throws(() => manager.add({ description: "Too late" }), /disposed/)
})

test("promise updates the same toast and preserves resolve and reject values", async () => {
  const resolved = createToastManager({ duration: 0 })
  const result = await resolved.promise(Promise.resolve(42), {
    loading: "Loading",
    success: (value) => ({ title: "Ready", description: String(value), tone: "success" }),
    error: "Failed",
  })
  assert.equal(result, 42)
  assert.equal(resolved.toasts.value.length, 1)
  assert.equal(resolved.toasts.value[0]?.revision, 1)
  assert.equal(resolved.toasts.value[0]?.title, "Ready")
  assert.equal(resolved.toasts.value[0]?.description, "42")

  const rejected = createToastManager({ duration: 0 })
  const failure = new Error("network")
  await assert.rejects(
    rejected.promise(Promise.reject(failure), {
      loading: "Loading",
      success: "Ready",
      error: (error) => ({ description: String(error), tone: "danger" }),
    }),
    failure,
  )
  assert.equal(rejected.toasts.value[0]?.tone, "danger")
  assert.match(rejected.toasts.value[0]?.description ?? "", /network/)
})

test("promise settlement replaces loading presentation and restores the default duration", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] })
  let settle!: (value: string) => void
  const source = new Promise<string>((resolve) => { settle = resolve })
  const manager = createToastManager({ duration: 250 })
  const pending = manager.promise(source, {
    loading: {
      title: "Loading",
      description: "Please wait",
      tone: "accent",
      duration: 0,
      action: { label: "Cancel", onClick() {} },
    },
    success: (value) => value,
    error: "Failed",
  })

  settle("Complete")
  assert.equal(await pending, "Complete")
  assert.deepEqual(manager.toasts.value[0], {
    id: "nagi-toast-1",
    revision: 1,
    title: undefined,
    description: "Complete",
    tone: "neutral",
    priority: "polite",
    action: undefined,
    duration: 250,
  })
  t.mock.timers.tick(249)
  assert.equal(manager.toasts.value.length, 1)
  t.mock.timers.tick(1)
  assert.equal(manager.toasts.value.length, 0)
})

test("a settled promise cannot reopen or overwrite a replacement after manual close", async () => {
  let settle!: (value: string) => void
  const source = new Promise<string>((resolve) => { settle = resolve })
  const manager = createToastManager({ duration: 0 })
  const pending = manager.promise(source, {
    loading: "Loading",
    success: (value) => `Success: ${value}`,
    error: "Failed",
  })
  const id = manager.toasts.value[0]?.id
  assert.ok(id)

  manager.close(id)
  manager.add({ id, description: "A newer notification" })
  settle("old result")
  assert.equal(await pending, "old result")
  assert.equal(manager.toasts.value[0]?.description, "A newer notification")
  assert.equal(manager.toasts.value[0]?.revision, 0)
})

test("a reentrant promise formatter cannot overwrite a replacement toast", async () => {
  let settle!: (value: string) => void
  const source = new Promise<string>((resolve) => { settle = resolve })
  const manager = createToastManager({ duration: 0 })
  let id = ""
  const pending = manager.promise(source, {
    loading: "Loading",
    success(value) {
      manager.close(id)
      manager.add({ id, description: "Replacement" })
      return `Stale: ${value}`
    },
    error: "Failed",
  })
  id = manager.toasts.value[0]?.id ?? ""

  settle("old result")
  assert.equal(await pending, "old result")
  assert.equal(manager.toasts.value[0]?.description, "Replacement")
})

test("promise formatter failures reject the returned chain as programming errors", async () => {
  const manager = createToastManager({ duration: 0 })
  const formatterError = new Error("formatter failed")
  await assert.rejects(
    manager.promise(Promise.resolve("source value"), {
      loading: "Loading",
      success() {
        throw formatterError
      },
      error: "Source failed",
    }),
    formatterError,
  )
  assert.equal(manager.toasts.value[0]?.description, "Loading")
})

test("disposing a manager does not change the source promise outcome", async () => {
  let settle!: (value: string) => void
  const source = new Promise<string>((resolve) => { settle = resolve })
  const manager = createToastManager({ duration: 0 })
  const pending = manager.promise(source, {
    loading: "Loading",
    success: "Done",
    error: "Failed",
  })
  manager.dispose()
  settle("original value")
  assert.equal(await pending, "original value")
})

test("invalid manager bounds and empty content fail early", () => {
  assert.throws(() => createToastManager({ duration: -1 }), RangeError)
  assert.throws(() => createToastManager({ limit: 0 }), RangeError)
  const manager = createToastManager({ duration: 0 })
  assert.throws(() => manager.add({} as never), /title or description/)
})
