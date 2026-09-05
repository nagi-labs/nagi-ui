import assert from "node:assert/strict";
import test from "node:test";

import {
  handleLinkClick,
  linkInteractionProps,
  prefetchLink,
  usePagination,
  useStepper,
  useToggleGroup,
} from "@nagi-labs/nagi-ui";
import { ref } from "vue";

test("useToggleGroup owns single and multiple selection transitions", () => {
  const single = ref<string | null | readonly string[]>("one");
  const singleGroup = useToggleGroup({ mode: "single" }, single);
  singleGroup.toggle("one");
  assert.equal(single.value, null);
  singleGroup.toggle("two");
  assert.equal(single.value, "two");

  const multiple = ref<string | null | readonly string[]>(["one"]);
  const multipleGroup = useToggleGroup({ mode: "multiple" }, multiple);
  multipleGroup.toggle("two");
  assert.deepEqual(multiple.value, ["one", "two"]);
  multipleGroup.toggle("one");
  assert.deepEqual(multiple.value, ["two"]);
  multipleGroup.toggle("three", true);
  assert.deepEqual(multiple.value, ["two"]);
});

test("usePagination separates controlled buttons from native links", () => {
  const current = ref("one");
  const selected: string[] = [];
  const pagination = usePagination<{ key: string; disabled?: boolean }>(
    { onSelect: (item) => selected.push(item.key) },
    current,
  );
  pagination.selectLink({ key: "two" });
  assert.equal(current.value, "one");
  pagination.selectButton({ key: "two" });
  assert.equal(current.value, "two");
  pagination.selectButton({ key: "three", disabled: true });
  assert.deepEqual(selected, ["two", "two"]);
});

test("useStepper rejects disabled programmatic selection", () => {
  const current = ref("one");
  const stepper = useStepper<{ key: string; disabled?: boolean }>(current);
  stepper.select({ key: "two", disabled: true });
  assert.equal(current.value, "one");
  stepper.select({ key: "two" });
  assert.equal(current.value, "two");
});

test("link adapter preserves modified navigation and adapts plain self-navigation", () => {
  let navigated = 0;
  let prefetched = 0;
  let prevented = 0;
  const event = (overrides: Partial<MouseEvent> = {}) => ({
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    preventDefault: () => { prevented += 1; },
    ...overrides,
  }) as MouseEvent;
  const link = {
    navigate: () => { navigated += 1; },
    prefetch: () => { prefetched += 1; },
  };

  assert.equal(handleLinkClick(link, event()), true);
  assert.equal(handleLinkClick(link, event({ metaKey: true })), false);
  prefetchLink(link);
  prefetchLink({ ...link, disabled: true });
  let activated = 0;
  const interaction = linkInteractionProps(link, () => { activated += 1; });
  interaction.onPointerenter({} as PointerEvent);
  interaction.onClick(event());
  interaction.onClick(event({ metaKey: true }));
  assert.deepEqual(
    { navigated, prefetched, prevented, activated },
    { navigated: 2, prefetched: 2, prevented: 2, activated: 1 },
  );
});
