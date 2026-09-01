import assert from "node:assert/strict"
import test from "node:test"

import { nextTick, ref } from "vue"

import { usePopover, vPopoverTrigger } from "@nagi-labs/nagi-ui"

interface FakePopoverElement {
  isConnected: boolean
  openState: boolean
  calls: string[]
  matches: (selector: string) => boolean
  showPopover: () => void
  hidePopover: () => void
}

function fakeElement(): FakePopoverElement {
  return {
    isConnected: true,
    openState: false,
    calls: [],
    matches(selector: string) {
      return selector === ":popover-open" && this.openState
    },
    showPopover() {
      this.openState = true
      this.calls.push("show")
    },
    hidePopover() {
      this.openState = false
      this.calls.push("hide")
    },
  }
}

function toggleEvent(target: FakePopoverElement, newState: "open" | "closed") {
  return { target, newState } as unknown as ToggleEvent
}

test("[POP-SEM-01] emits local native target and surface registration", () => {
  const { id, triggerProps, popoverProps } = usePopover({ id: "pop-1" })

  assert.equal(id, "pop-1")
  assert.equal(triggerProps.popovertarget, "pop-1")
  assert.equal(typeof triggerProps.ref, "function")
  assert.equal(popoverProps.id, "pop-1")
  assert.equal(typeof popoverProps.ref, "function")
  assert.equal(typeof popoverProps.onToggle, "function")
})

test("[POP-STATE-01] uncontrolled UA toggle events mirror into open", async () => {
  const element = fakeElement()
  const { open, popoverProps } = usePopover({ id: "pop-2" })

  element.openState = true
  popoverProps.onToggle(toggleEvent(element, "open"))
  assert.equal(open.value, true)

  await nextTick()
  assert.deepEqual(element.calls, [])

  element.openState = false
  popoverProps.onToggle(toggleEvent(element, "closed"))
  assert.equal(open.value, false)
})

test("[POP-STATE-01] controlled writes apply to the registered native surface", async () => {
  const element = fakeElement()
  const externalOpen = ref(false)
  const { open, popoverProps } = usePopover({ id: "pop-3", open: externalOpen })

  assert.equal(open, externalOpen)

  element.openState = true
  popoverProps.onToggle(toggleEvent(element, "open"))
  assert.equal(externalOpen.value, true)

  externalOpen.value = false
  await nextTick()
  assert.deepEqual(element.calls, ["hide"])
  assert.equal(element.openState, false)
})

test("show/hide helpers drive the model and reach the element", async () => {
  const element = fakeElement()
  const { show, hide, open, popoverProps } = usePopover({ id: "pop-4" })

  popoverProps.onToggle(toggleEvent(element, "closed"))

  show()
  assert.equal(open.value, true)
  await nextTick()
  assert.deepEqual(element.calls, ["show"])

  element.openState = true
  hide()
  await nextTick()
  assert.deepEqual(element.calls, ["show", "hide"])
})

test("apply is a no-op before any element is known", async () => {
  const { show, open } = usePopover({ id: "pop-5" })

  show()
  await nextTick()
  assert.equal(open.value, true)
})

test("directive renders popovertarget on the server", () => {
  const props = vPopoverTrigger.getSSRProps?.(
    { value: "pop-6" } as never,
    null as never,
  )
  assert.deepEqual(props, { popovertarget: "pop-6" })
})
