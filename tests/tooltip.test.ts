import assert from "node:assert/strict"
import test from "node:test"

import { useTooltip } from "@nagi-labs/nagi-ui"

interface FakeHint {
  isConnected: boolean
  openState: boolean
  calls: string[]
  matches: (selector: string) => boolean
  showPopover: () => void
  hidePopover: () => void
}

function fakeHint(): FakeHint {
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

function toggleEvent(target: FakeHint, newState: "open" | "closed") {
  return { target, newState } as unknown as ToggleEvent
}

test("emits describedby and tooltip role, popover value stays in template", () => {
  const { triggerProps, tooltipProps } = useTooltip({ id: "tip-1" })

  assert.equal(triggerProps["aria-describedby"], "tip-1")
  assert.equal(tooltipProps.id, "tip-1")
  assert.equal(tooltipProps.role, "tooltip")
  assert.equal("popover" in tooltipProps, false)
})

test("hover opens after the open delay and pointer-leave closes it", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] })
  const element = fakeHint()
  const { open, triggerProps, tooltipProps } = useTooltip({ id: "tip-2", openDelay: 150 })

  tooltipProps.onToggle(toggleEvent(element, "closed"))

  triggerProps.onPointerenter()
  assert.equal(open.value, false)
  t.mock.timers.tick(149)
  assert.equal(open.value, false)
  t.mock.timers.tick(1)
  assert.equal(open.value, true)
  assert.deepEqual(element.calls, ["show"])

  element.openState = true
  triggerProps.onPointerleave()
  assert.equal(open.value, false)
  assert.deepEqual(element.calls, ["show", "hide"])
})

test("focus opens immediately, blur closes", () => {
  const element = fakeHint()
  const { open, triggerProps, tooltipProps } = useTooltip({ id: "tip-3", openDelay: 500 })

  tooltipProps.onToggle(toggleEvent(element, "closed"))

  triggerProps.onFocus()
  assert.equal(open.value, true)
  assert.deepEqual(element.calls, ["show"])

  element.openState = true
  triggerProps.onBlur()
  assert.equal(open.value, false)
})

test("a pending hover-open is cancelled by an early leave", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] })
  const element = fakeHint()
  const { open, triggerProps, tooltipProps } = useTooltip({ id: "tip-4", openDelay: 150 })

  tooltipProps.onToggle(toggleEvent(element, "closed"))

  triggerProps.onPointerenter()
  triggerProps.onPointerleave()
  t.mock.timers.tick(200)
  assert.equal(open.value, false)
  assert.deepEqual(element.calls, [])
})

test("UA toggle mirrors into open", () => {
  const element = fakeHint()
  const { open, tooltipProps } = useTooltip({ id: "tip-5" })

  element.openState = true
  tooltipProps.onToggle(toggleEvent(element, "open"))
  assert.equal(open.value, true)
})
