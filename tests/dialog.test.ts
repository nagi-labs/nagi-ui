import assert from "node:assert/strict";
import test from "node:test";

import { nextTick, ref } from "vue";

import { useDialog, vDialogClose } from "@nagi-labs/nagi-ui";

interface FakeDialog {
  isConnected: boolean;
  open: boolean;
  calls: string[];
  showModal: () => void;
  show: () => void;
  close: () => void;
}

function fakeDialog(): FakeDialog {
  return {
    isConnected: true,
    open: false,
    calls: [],
    showModal() {
      this.open = true;
      this.calls.push("showModal");
    },
    show() {
      this.open = true;
      this.calls.push("show");
    },
    close() {
      this.open = false;
      this.calls.push("close");
    },
  };
}

function toggleEvent(target: FakeDialog, newState: "open" | "closed") {
  return { target, newState } as unknown as ToggleEvent;
}

function plainEvent(target: FakeDialog) {
  return { target } as unknown as Event;
}

test("[DLG-SEM-03] emits Invoker Command attributes and standard handlers", () => {
  const { id, triggerProps, dialogProps } = useDialog({ id: "dlg-1" });

  assert.equal(id, "dlg-1");
  assert.equal(triggerProps.commandfor, "dlg-1");
  assert.equal(triggerProps.command, "show-modal");
  assert.equal(typeof triggerProps.onClick, "function");
  assert.equal(dialogProps.id, "dlg-1");
  assert.equal(typeof dialogProps.onClose, "function");
  assert.equal(typeof dialogProps.onToggle, "function");
  assert.equal(typeof dialogProps.onKeydown, "function");
});

test("[DLG-STATE-02] non-modal dialog omits invalid command wiring and uses show()", (t) => {
  class FakeButton {}
  Object.defineProperty(FakeButton.prototype, "command", { value: "" });
  const original = Object.getOwnPropertyDescriptor(globalThis, "HTMLButtonElement");
  Object.defineProperty(globalThis, "HTMLButtonElement", {
    configurable: true,
    value: FakeButton,
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "HTMLButtonElement", original);
    else Reflect.deleteProperty(globalThis, "HTMLButtonElement");
  });

  const element = fakeDialog();
  const { open, triggerProps, dialogProps } = useDialog({ id: "dlg-2", modal: false });

  assert.equal("command" in triggerProps, false);
  assert.equal("commandfor" in triggerProps, false);

  dialogProps.onToggle(toggleEvent(element, "closed"));
  let prevented = false;
  triggerProps.onClick({
    preventDefault: () => {
      prevented = true;
    },
  } as unknown as MouseEvent);
  assert.equal(prevented, true);
  assert.equal(open.value, true);
  assert.deepEqual(element.calls, ["show"]);
});

test("[DLG-STATE-01] uncontrolled: actual close mirrors into open without intercepting cancel", () => {
  const element = fakeDialog();
  const { open, dialogProps } = useDialog({ id: "dlg-3" });

  element.open = true;
  dialogProps.onToggle(toggleEvent(element, "open"));
  assert.equal(open.value, true);
  assert.equal("onCancel" in dialogProps, false);

  dialogProps.onClose(plainEvent(element));
  assert.equal(open.value, false);
});

test("toggle mirrors the native open property when newState is unavailable", () => {
  const element = fakeDialog();
  const { open, dialogProps } = useDialog({ id: "dlg-toggle-compat" });

  element.open = true;
  dialogProps.onToggle({ target: element } as unknown as ToggleEvent);

  assert.equal(open.value, true);
});

test("controlled: writes apply imperatively", async () => {
  const element = fakeDialog();
  const externalOpen = ref(false);
  const { open, dialogProps } = useDialog({ id: "dlg-4", open: externalOpen });

  assert.equal(open, externalOpen);

  element.open = true;
  dialogProps.onToggle(toggleEvent(element, "open"));
  assert.equal(externalOpen.value, true);

  externalOpen.value = false;
  await nextTick();
  assert.deepEqual(element.calls, ["close"]);
  assert.equal(element.open, false);
});

test("[DLG-INT-01] show/close helpers drive the model and reach the element", async () => {
  const element = fakeDialog();
  const { show, close, open, dialogProps } = useDialog({ id: "dlg-5" });

  dialogProps.onToggle(toggleEvent(element, "closed"));

  show();
  assert.equal(open.value, true);
  await nextTick();
  assert.deepEqual(element.calls, ["showModal"]);

  close();
  await nextTick();
  assert.deepEqual(element.calls, ["showModal", "close"]);
});

test("fallback onClick opens when Invoker Commands are unsupported", () => {
  // No HTMLButtonElement in this runtime, so the fallback path runs.
  const { open, triggerProps } = useDialog({ id: "dlg-6" });
  triggerProps.onClick({ preventDefault() {} } as unknown as MouseEvent);
  assert.equal(open.value, true);
});

test("hydrated trigger owns the open transition when Invoker Commands are supported", (t) => {
  class FakeButton {}
  Object.defineProperty(FakeButton.prototype, "command", { value: "" });
  const original = Object.getOwnPropertyDescriptor(globalThis, "HTMLButtonElement");
  Object.defineProperty(globalThis, "HTMLButtonElement", {
    configurable: true,
    value: FakeButton,
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "HTMLButtonElement", original);
    else Reflect.deleteProperty(globalThis, "HTMLButtonElement");
  });

  const { open, triggerProps } = useDialog({ id: "dlg-command" });
  let prevented = false;
  triggerProps.onClick({
    preventDefault: () => {
      prevented = true;
    },
  } as unknown as MouseEvent);

  assert.equal(prevented, true);
  assert.equal(open.value, true);
});

test("closedby is emitted only when requested", () => {
  const withPolicy = useDialog({ id: "dlg-7", closedby: "any" });
  assert.equal(withPolicy.dialogProps.closedby, "any");

  const withoutPolicy = useDialog({ id: "dlg-8" });
  assert.equal("closedby" in withoutPolicy.dialogProps, false);
});

test("close-button directive renders command wiring on the server", () => {
  const props = vDialogClose.getSSRProps?.({ value: "dlg-9" } as never, null as never);
  assert.deepEqual(props, { commandfor: "dlg-9", command: "close" });
});

test("close-button directive falls back when Invoker Commands are unsupported", () => {
  const attributes = new Map<string, string>();
  let clickListener: ((event: MouseEvent) => void) | null = null;
  const element = {
    setAttribute(name: string, value: string) {
      attributes.set(name, value);
    },
    getAttribute(name: string) {
      return attributes.get(name) ?? null;
    },
    addEventListener(_name: string, listener: (event: MouseEvent) => void) {
      clickListener = listener;
    },
    removeEventListener() {
      clickListener = null;
    },
  };
  const dialog = fakeDialog();
  dialog.open = true;
  Object.assign(element, {
    getRootNode: () => ({ getElementById: (id: string) => (id === "dlg-10" ? dialog : null) }),
  });

  const binding = { value: "dlg-10" };
  const mounted = vDialogClose.mounted as Function;
  mounted(element, binding);
  let prevented = false;
  clickListener?.({
    currentTarget: element,
    preventDefault: () => {
      prevented = true;
    },
  } as unknown as MouseEvent);

  assert.equal(prevented, true);
  assert.deepEqual(dialog.calls, ["close"]);
  const beforeUnmount = vDialogClose.beforeUnmount as Function;
  beforeUnmount(element);
  assert.equal(clickListener, null);
});

test("dialogProps registers its surface without document-global rediscovery", async () => {
  const element = fakeDialog();
  const dialog = useDialog({ id: "local-dialog", defaultOpen: true });
  dialog.dialogProps.ref(element as unknown as Element);
  await nextTick();
  assert.deepEqual(element.calls, ["showModal"]);
});

test("hydration adopts a dialog opened by a server-rendered Invoker Command", () => {
  const element = fakeDialog();
  element.open = true;
  const dialog = useDialog({ id: "pre-hydration-dialog" });

  dialog.dialogProps.ref(element as unknown as Element);

  assert.equal(dialog.open.value, true);
  assert.deepEqual(element.calls, []);
});
