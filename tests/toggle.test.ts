import assert from "node:assert/strict";
import test from "node:test";

import { ref } from "vue";

import { useToggle } from "../packages/core/src/toggle.ts";

function click(): MouseEvent {
  return {} as MouseEvent;
}

test("emits native button toggle semantics without a custom state attribute", () => {
  const { pressed, buttonProps } = useToggle();

  assert.equal(pressed.value, false);
  assert.equal(buttonProps.type, "button");
  assert.equal(buttonProps["aria-pressed"], "false");
  assert.equal(buttonProps.disabled, false);
  assert.equal("data-state" in buttonProps, false);
});

test("uncontrolled mode starts from defaultPressed and toggles on click", () => {
  const { pressed, buttonProps } = useToggle({ defaultPressed: true });

  assert.equal(buttonProps["aria-pressed"], "true");
  buttonProps.onClick(click());
  assert.equal(pressed.value, false);
  assert.equal(buttonProps["aria-pressed"], "false");
});

test("controlled mode reads and writes the supplied ref", () => {
  const externalPressed = ref(false);
  const { pressed, buttonProps, toggle } = useToggle({ pressed: externalPressed });

  assert.equal(pressed, externalPressed);
  buttonProps.onClick(click());
  assert.equal(externalPressed.value, true);

  externalPressed.value = false;
  assert.equal(buttonProps["aria-pressed"], "false");

  toggle();
  assert.equal(externalPressed.value, true);
});

test("reactive disabled state uses native disabled and suppresses user activation", () => {
  const disabled = ref(true);
  const { pressed, buttonProps } = useToggle({ disabled });

  assert.equal(buttonProps.disabled, true);
  buttonProps.onClick(click());
  assert.equal(pressed.value, false);

  disabled.value = false;
  assert.equal(buttonProps.disabled, false);
  buttonProps.onClick(click());
  assert.equal(pressed.value, true);
});

test("programmatic changes remain available while the control is disabled", () => {
  const { pressed, toggle } = useToggle({ disabled: true });

  toggle();
  assert.equal(pressed.value, true);
});

test("component binding merges native attrs without duplicating the surface class", () => {
  const pressed = ref(false);
  const toggle = useToggle({ disabled: false }, pressed, {
    class: "n-toggle -quiet",
    "data-testid": "pin",
  });

  assert.equal(toggle.buttonProps.class, "-quiet");
  assert.equal(toggle.buttonProps["data-testid"], "pin");
  assert.equal(toggle.buttonProps.type, "button");
});
