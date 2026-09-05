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

test("[BTN-STATE-01][BTN-INT-01] Button control keeps ordinary disabled state native", () => {
  const props = { disabled: true, focusableWhenDisabled: false };
  const { buttonProps } = useButton(props);

  assert.equal(buttonProps.disabled, true);
  assert.equal(buttonProps["aria-disabled"], undefined);

  const click = clickEvent();
  buttonProps.onClickCapture(click.event);
  assert.equal(click.wasPrevented(), false);
  assert.equal(click.wasImmediatePropagationStopped(), false);
});

test("[BTN-STATE-02][BTN-INT-02] Button control keeps focusable disabled buttons in tab order and suppresses activation", () => {
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

test("Button control returns the complete native root binding", () => {
  const props: {
    type: "button" | "submit" | "reset";
    disabled: boolean;
    focusableWhenDisabled: boolean;
  } = { type: "submit", disabled: false, focusableWhenDisabled: false };
  const attrs = { class: "n-button -primary", "data-testid": "save" };
  const button = useButton(props, attrs);

  assert.equal(button.buttonProps.type, "submit");
  assert.equal(button.buttonProps.class, "-primary");
  assert.equal(button.buttonProps["data-testid"], "save");

  props.type = "reset";
  attrs.class = "n-button -destructive";
  assert.equal(button.buttonProps.type, "reset");
  assert.equal(button.buttonProps.class, "-destructive");
});

test("[BTN-SEM-02][BTN-INT-03][BTN-ANAT-01] Button SFC merges consumer attrs with behavior-owned props in one binding", () => {
  const source = fs.readFileSync(
    path.join(import.meta.dirname, "../packages/core/blueprints/button/Button.vue"),
    "utf8",
  );

  assert.match(source, /const button = useButton\(props, useAttrs\(\)\)/u);
  assert.doesNotMatch(source, /mergeElementProps|withoutClassToken|computed\(/u);
  assert.match(source, /v-bind="button\.buttonProps"/u);
  assert.match(source, /data-scope="button"[\s\S]*data-part="root"/u);
  assert.doesNotMatch(
    source,
    /:disabled="button\.|:aria-disabled="button\.|@click\.capture="button\./u,
  );
});
