import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { ref } from "vue";

import { usePreviewCard } from "../packages/core/src/preview-card.ts";

interface FakePreview {
  isConnected: boolean;
  openState: boolean;
  calls: string[];
  contains: (candidate: unknown) => boolean;
  matches: (selector: string) => boolean;
  showPopover: () => void;
  hidePopover: () => void;
}

function fakePreview(): FakePreview {
  return {
    isConnected: true,
    openState: false,
    calls: [],
    contains: () => false,
    matches(selector: string) {
      return selector === ":popover-open" && this.openState;
    },
    showPopover() {
      this.openState = true;
      this.calls.push("show");
    },
    hidePopover() {
      this.openState = false;
      this.calls.push("hide");
    },
  };
}

function pointerEvent(currentTarget: object = { isConnected: true }, pointerType = "mouse") {
  return { currentTarget, pointerType } as unknown as PointerEvent;
}

function focusEvent(
  currentTarget: object = { isConnected: true },
  relatedTarget: object | null = null,
) {
  return { currentTarget, relatedTarget } as unknown as FocusEvent;
}

function toggleEvent(target: FakePreview, newState: "open" | "closed") {
  return { target, newState } as unknown as ToggleEvent;
}

test("trigger wiring preserves real-link activation and does not impersonate a tooltip", () => {
  const preview = usePreviewCard({ id: "profile-preview" });

  assert.equal(preview.previewProps.id, "profile-preview");
  assert.equal("onClick" in preview.triggerProps, false);
  assert.equal("popovertarget" in preview.triggerProps, false);
  assert.equal("aria-describedby" in preview.triggerProps, false);
  assert.equal("role" in preview.previewProps, false);
  assert.equal("popover" in preview.previewProps, false);
});

test("hover delay and close delay preserve trigger-to-preview pointer transit", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const element = fakePreview();
  const preview = usePreviewCard({ id: "hover-preview", openDelay: 600, closeDelay: 300 });
  preview.previewProps.ref(element as unknown as Element);

  preview.triggerProps.onPointerenter(pointerEvent());
  t.mock.timers.tick(599);
  assert.equal(preview.open.value, false);
  t.mock.timers.tick(1);
  assert.equal(preview.open.value, true);
  assert.deepEqual(element.calls, ["show"]);

  preview.triggerProps.onPointerleave(pointerEvent());
  preview.previewProps.onPointerenter(pointerEvent(element));
  t.mock.timers.tick(300);
  assert.equal(preview.open.value, true);

  preview.previewProps.onPointerleave(pointerEvent(element));
  t.mock.timers.tick(299);
  assert.equal(preview.open.value, true);
  t.mock.timers.tick(1);
  assert.equal(preview.open.value, false);
  assert.deepEqual(element.calls, ["show", "hide"]);
});

test("focus uses the same intent delay and stays open while interactive preview content owns focus", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const element = fakePreview();
  const inside = {};
  element.contains = (candidate) => candidate === inside;
  const preview = usePreviewCard({ id: "focus-preview", openDelay: 100, closeDelay: 0 });
  preview.previewProps.ref(element as unknown as Element);

  preview.triggerProps.onFocus(focusEvent());
  t.mock.timers.tick(99);
  assert.equal(preview.open.value, false);
  t.mock.timers.tick(1);
  assert.equal(preview.open.value, true);

  preview.triggerProps.onBlur(focusEvent());
  preview.previewProps.onFocusin(focusEvent(element));
  t.mock.timers.tick(0);
  assert.equal(preview.open.value, true);

  preview.previewProps.onFocusout(focusEvent(element, inside));
  t.mock.timers.tick(0);
  assert.equal(preview.open.value, true);

  preview.previewProps.onFocusout(focusEvent(element));
  t.mock.timers.tick(0);
  assert.equal(preview.open.value, false);
});

test("controlled state mirrors native toggles and applies external writes", () => {
  const element = fakePreview();
  const open = ref(false);
  const preview = usePreviewCard({ id: "controlled-preview", open });
  preview.previewProps.ref(element as unknown as Element);

  open.value = true;
  assert.deepEqual(element.calls, ["show"]);
  open.value = false;
  assert.deepEqual(element.calls, ["show", "hide"]);

  element.openState = true;
  preview.previewProps.onToggle(toggleEvent(element, "open"));
  assert.equal(open.value, true);
  element.openState = false;
  preview.previewProps.onToggle(toggleEvent(element, "closed"));
  assert.equal(open.value, false);
});

test("disabled suppresses preview intent while leaving the link contract untouched", () => {
  const element = fakePreview();
  const disabled = ref(true);
  const open = ref(false);
  const preview = usePreviewCard({ id: "disabled-preview", disabled, open, openDelay: 0 });
  preview.previewProps.ref(element as unknown as Element);

  preview.triggerProps.onPointerenter(pointerEvent());
  preview.triggerProps.onFocus(focusEvent());
  preview.show();
  open.value = true;
  assert.equal(open.value, false);
  assert.deepEqual(element.calls, []);

  disabled.value = false;
  preview.show();
  assert.equal(open.value, true);
  disabled.value = true;
  assert.equal(open.value, false);
  assert.deepEqual(element.calls, ["show", "hide"]);
});

test("touch pointer entry does not synthesize a hover-only preview", () => {
  const preview = usePreviewCard({ id: "touch-preview", openDelay: 0 });
  preview.triggerProps.onPointerenter(pointerEvent({}, "touch"));
  assert.equal(preview.open.value, false);
});

test("component overload maps named delay, disabled, and anchor props", () => {
  const open = ref(false);
  const preview = usePreviewCard(
    {
      openDelay: 0,
      closeDelay: 25,
      disabled: false,
      area: "block-start",
      offset: 12,
    },
    open,
  );

  assert.equal(preview.open, open);
  assert.equal(preview.previewProps.style?.["position-area"], "block-start");
  assert.equal(preview.previewProps.style?.["margin-block-end"], "12px");
});

test("Blueprint keeps link semantics, interactive content, and behavior mechanism separated", () => {
  const source = fs.readFileSync(
    path.join(import.meta.dirname, "../packages/core/blueprints/preview-card/PreviewCard.vue"),
    "utf8",
  );

  assert.match(source, /<a\s[\s\S]*?:href="href"[\s\S]*?v-bind="preview\.triggerProps"/);
  assert.match(source, /<span\s+class="unit"\s+popover\s+v-bind="preview\.previewProps"\s*>/);
  assert.match(source, /usePreviewCard\(props, open\)/);
  assert.match(source, /<slot\s*\/>/);
  assert.match(source, /@media \(forced-colors: active\)/);
  assert.match(source, /@media \(prefers-reduced-motion: reduce\)/);

  assert.doesNotMatch(source, /@click|\.prevent|onClick/);
  assert.doesNotMatch(source, /role="tooltip"|popover="hint"|mergeElementProps/);
  assert.doesNotMatch(source, /Teleport|provide\(|inject\(|data-state/);
  assert.doesNotMatch(
    source,
    /\b(?:watch|watchEffect|onMounted|onBeforeUnmount|document|window)\b/,
  );
  assert.doesNotMatch(source, /var\(--nagi-[^,)]+,/);
  assert.doesNotMatch(source, /#[\da-f]{3,8}\b/i);
});
