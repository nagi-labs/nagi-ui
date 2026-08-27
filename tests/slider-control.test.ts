import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { effectScope, nextTick, ref } from "vue";

import { useSlider } from "@nagi-labs/nagi-ui/component-controls";

const repo = path.join(import.meta.dirname, "..");
const sourcePath = path.join(repo, "packages/core/blueprints/slider/Slider.vue");

test("Slider reset adopts the browser-sanitized range value", async () => {
  const form = new EventTarget();
  const input = ref({ form, valueAsNumber: 19 } as unknown as HTMLInputElement);
  const model = ref(999);
  const scope = effectScope();

  scope.run(() => useSlider(input, model));
  await nextTick();

  form.dispatchEvent(new Event("reset"));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));

  assert.equal(model.value, 19);
  scope.stop();
});

test("Slider SFC exposes constraints but not sanitization or reset wiring", () => {
  const source = fs.readFileSync(sourcePath, "utf8");

  assert.match(source, /useSlider\(input, model\)/u);
  assert.match(source, /:min="min"[\s\S]*:max="max"[\s\S]*:step="step"/u);
  assert.match(source, /<output class="output"[^>]*>\{\{ model \}\}<\/output>/u);
  assert.doesNotMatch(source, /useNativeNumberReset|valueAsNumber|watch|onMounted|onUpdated/u);
});
