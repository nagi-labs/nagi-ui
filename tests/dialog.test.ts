import assert from "node:assert/strict"
import test from "node:test"

import { nextTick, ref } from "vue"

import { useDialog, vDialogClose } from "@nagi-labs/nagi-ui"

interface FakeDialog {
  isConnected: boolean
  open: boolean
  calls: string[]
  showModal: () => void
  show: () => void
  close: () => void
}

function fakeDialog(): FakeDialog {
  return {
    isConnected: true,
    open: false,
    calls: [],
    showModal() {
      this.open = true
      this.calls.push("showModal")
    },
    show() {
      this.open = true
      this.calls.push("show")
    },
    close() {
      this.open = false
      this.calls.push("close")
    },
  }
}

function toggleEvent(target: FakeDialog, newState: "open" | "closed") {
  return { target, newState } as unknown as ToggleEvent
}

function plainEvent(target: FakeDialog) {
  return { target } as unknown as Event
}

test("emits Invoker Command attributes and standard handlers", () => {
  const { id, triggerProps, dialogProps } = useDialog({ id: "dlg-1" })

  assert.equal(id, "dlg-1")
  assert.equal(triggerProps.commandfor, "dlg-1")
  assert.equal(triggerProps.command, "show-modal")
  assert.equal(typeof triggerProps.onClick, "function")
  assert.equal(dialogProps.id, "dlg-1")
  assert.equal(typeof dialogProps.onClose, "function")
  assert.equal(typeof dialogProps.onToggle, "function")
})

test("non-modal dialog uses command=show and show()", async () => {
  const element = fakeDialog()
  const { open, triggerProps, dialogProps } = useDialog({ id: "dlg-2", modal: false })

  assert.equal(triggerProps.command, "show")

  dialogProps.onToggle(toggleEvent(element, "closed"))
  open.value = true
  await nextTick()
  assert.deepEqual(element.calls, ["show"])
})

test("uncontrolled: UA close/cancel mirror into open", async () => {
  const element = fakeDialog()
  const { open, dialogProps } = useDialog({ id: "dlg-3" })

  element.open = true
  dialogProps.onToggle(toggleEvent(element, "open"))
  assert.equal(open.value, true)

  dialogProps.onClose(plainEvent(element))
  assert.equal(open.value, false)
})

test("controlled: writes apply imperatively", async () => {
  const element = fakeDialog()
  const externalOpen = ref(false)
  const { open, dialogProps } = useDialog({ id: "dlg-4", open: externalOpen })

  assert.equal(open, externalOpen)

  element.open = true
  dialogProps.onToggle(toggleEvent(element, "open"))
  assert.equal(externalOpen.value, true)

  externalOpen.value = false
  await nextTick()
  assert.deepEqual(element.calls, ["close"])
  assert.equal(element.open, false)
})

test("show/close helpers drive the model and reach the element", async () => {
  const element = fakeDialog()
  const { show, close, open, dialogProps } = useDialog({ id: "dlg-5" })

  dialogProps.onToggle(toggleEvent(element, "closed"))

  show()
  assert.equal(open.value, true)
  await nextTick()
  assert.deepEqual(element.calls, ["showModal"])

  close()
  await nextTick()
  assert.deepEqual(element.calls, ["showModal", "close"])
})

test("fallback onClick opens when Invoker Commands are unsupported", () => {
  // No HTMLButtonElement in this runtime, so the fallback path runs.
  const { open, triggerProps } = useDialog({ id: "dlg-6" })
  triggerProps.onClick({ preventDefault() {} } as unknown as MouseEvent)
  assert.equal(open.value, true)
})

test("closedby is emitted only when requested", () => {
  const withPolicy = useDialog({ id: "dlg-7", closedby: "any" })
  assert.equal(withPolicy.dialogProps.closedby, "any")

  const withoutPolicy = useDialog({ id: "dlg-8" })
  assert.equal("closedby" in withoutPolicy.dialogProps, false)
})

test("close-button directive renders command wiring on the server", () => {
  const props = vDialogClose.getSSRProps?.({ value: "dlg-9" } as never, null as never)
  assert.deepEqual(props, { commandfor: "dlg-9", command: "close" })
})
