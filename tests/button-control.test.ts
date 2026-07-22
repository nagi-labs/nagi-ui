import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { useButton } from "@nagi-labs/nagi-ui/component-controls";

function clickEvent() {
  let defaultPrevented = false;
  let immediatePropagationStopped = false;
  return {
    event: {
      preventDefault() {
        defaultPrevented = true;
      },
      stopImmediatePropagation() {
        immediatePropagationStopped = true;
      },
    } as MouseEvent,
    wasPrevented: () => defaultPrevented,
    wasImmediatePropagationStopped: () => immediatePropagationStopped,
  };
}

test("Button control keeps ordinary disabled state native", () => {
  const props = { disabled: true, focusableWhenDisabled: false };
  const { buttonProps } = useButton(props);

  assert.equal(buttonProps.disabled, true);
  assert.equal(buttonProps["aria-disabled"], undefined);

  const click = clickEvent();
  buttonProps.onClickCapture(click.event);
  assert.equal(click.wasPrevented(), false);
  assert.equal(click.wasImmediatePropagationStopped(), false);
});

test("Button control keeps focusable disabled buttons in tab order and suppresses activation", () => {
  const props = { disabled: true, focusableWhenDisabled: true };
  const { buttonProps } = useButton(props);

  assert.equal(buttonProps.disabled, false);
  assert.equal(buttonProps["aria-disabled"], "true");

  const click = clickEvent();
  buttonProps.onClickCapture(click.event);
  assert.equal(click.wasPrevented(), true);
  assert.equal(click.wasImmediatePropagationStopped(), true);
});

test("Button control props remain reactive getters", () => {
  const props = { disabled: false, focusableWhenDisabled: false };
  const { buttonProps } = useButton(props);

  assert.equal(buttonProps.disabled, false);
  assert.equal(buttonProps["aria-disabled"], undefined);

  props.disabled = true;
  props.focusableWhenDisabled = true;
  assert.equal(buttonProps.disabled, false);
  assert.equal(buttonProps["aria-disabled"], "true");
});

test("Button SFC binds the complete fixed control contract once", () => {
  const source = fs.readFileSync(
    path.join(
      import.meta.dirname,
      "../packages/core/blueprints/button/Button.vue",
    ),
    "utf8",
  );

  assert.match(source, /v-bind="button\.buttonProps"/u);
  assert.doesNotMatch(source, /:disabled="button\.|:aria-disabled="button\.|@click\.capture="button\./u);
});
