import assert from "node:assert/strict"
import test from "node:test"

import { nextTick, ref } from "vue"

import { useDisclosure } from "@nagi-labs/nagi-ui"

interface FakeDetails {
  isConnected: boolean
  open: boolean
}

function fakeDetails(open = false): FakeDetails {
  return { isConnected: true, open }
}

function toggleEvent(target: FakeDetails, newState: "open" | "closed") {
  return { target, newState } as unknown as ToggleEvent
}

test("emits an id and toggle handler; closed by default omits open", () => {
  const { id, detailsProps } = useDisclosure({ id: "disc-1" })

  assert.equal(id, "disc-1")
  assert.equal(detailsProps.id, "disc-1")
  assert.equal("open" in detailsProps, false)
  assert.equal(typeof detailsProps.onToggle, "function")
})

test("defaultOpen renders <details open> for SSR", () => {
  const { detailsProps } = useDisclosure({ id: "disc-2", defaultOpen: true })
  assert.equal(detailsProps.open, true)
})

test("exclusive-accordion name is forwarded", () => {
  const { detailsProps } = useDisclosure({ id: "disc-3", name: "faq" })
  assert.equal(detailsProps.name, "faq")
})

test("native toggle mirrors into open", () => {
  const element = fakeDetails()
  const { open, detailsProps } = useDisclosure({ id: "disc-4" })

  detailsProps.onToggle(toggleEvent({ ...element, open: true }, "open"))
  assert.equal(open.value, true)

  detailsProps.onToggle(toggleEvent(element, "closed"))
  assert.equal(open.value, false)
})

test("controlled: writes apply to the native open property", async () => {
  const element = fakeDetails()
  const externalOpen = ref(false)
  const { open, detailsProps } = useDisclosure({ id: "disc-5", open: externalOpen })

  assert.equal(open, externalOpen)

  // Seed the element reference through a toggle event, like the other composables.
  detailsProps.onToggle(toggleEvent(element, "closed"))

  externalOpen.value = true
  await nextTick()
  assert.equal(element.open, true)

  externalOpen.value = false
  await nextTick()
  assert.equal(element.open, false)
})

test("show/hide/toggle helpers drive the model", () => {
  const { open, show, hide, toggle } = useDisclosure({ id: "disc-6" })

  show()
  assert.equal(open.value, true)
  hide()
  assert.equal(open.value, false)
  toggle()
  assert.equal(open.value, true)
})
