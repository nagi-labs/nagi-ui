import assert from "node:assert/strict";
import test from "node:test";

import { computed, effectScope, nextTick, ref } from "vue";

import { useAutocomplete } from "../packages/core/src/autocomplete.ts";
import { useMultiSelect } from "../packages/core/src/multi-select.ts";
import { useTagsInput } from "../packages/core/src/tags-input.ts";

test("Autocomplete preserves free text and commits a suggestion only on selection", async () => {
  const scope = effectScope();
  const value = ref("");
  const items = [
    { key: "jp", label: "Japan" },
    { key: "jm", label: "Jamaica" },
  ];
  const behavior = scope.run(() => useAutocomplete({
    value,
    items,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
  }));
  assert.ok(behavior);
  const input = { value: "Jam" } as HTMLInputElement;
  behavior.inputProps.onInput({ currentTarget: input } as unknown as Event);
  assert.equal(value.value, "Jam");
  await nextTick();
  assert.deepEqual(behavior.visibleItems.value.map((item) => item.key), ["jm"]);
  behavior.select(items[1]);
  assert.equal(value.value, "Jamaica");
  assert.equal(behavior.selectedKey.value, "jm");
  value.value = "Custom place";
  assert.equal(behavior.selectedKey.value, null);
  scope.stop();
});

test("MultiSelect toggles keys, filters options, removes from an empty input, and resets", async () => {
  const form = new EventTarget();
  const control = ref({ form } as unknown as HTMLSelectElement);
  const selected = ref<readonly string[]>(["a"]);
  const items = [
    { key: "a", label: "Alpha" },
    { key: "b", label: "Beta" },
    { key: "c", label: "Gamma", disabled: true },
  ];
  const scope = effectScope();
  const select = scope.run(() => useMultiSelect({
    items,
    selected,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    isDisabled: (item) => item.disabled ?? false,
    label: "Letters",
    required: true,
    formControl: control,
  }));
  assert.ok(select);
  select.toggle(items[1]);
  assert.deepEqual(selected.value, ["a", "b"]);
  select.toggle(items[2]);
  assert.deepEqual(selected.value, ["a", "b"]);
  const input = { value: "bet", focus() {} } as HTMLInputElement;
  select.inputProps.onInput({ currentTarget: input } as unknown as Event);
  assert.deepEqual(select.visibleItems.value.map((item) => item.key), ["b"]);
  select.inputValue.value = "";
  select.inputProps.onKeydown({
    key: "Backspace", keyCode: 8, isComposing: false, currentTarget: input,
    preventDefault() {},
  } as unknown as KeyboardEvent);
  assert.deepEqual(selected.value, ["a"]);
  selected.value = ["b"];
  form.dispatchEvent(new Event("reset"));
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.deepEqual(selected.value, ["a"]);
  assert.equal(select.formProps.required, true);
  selected.value = [];
  select.formProps.onInvalid({ preventDefault() {} } as unknown as Event);
  assert.equal(select.inputProps["aria-invalid"], "true");
  selected.value = ["a"];
  assert.equal(select.inputProps["aria-invalid"], undefined);
  scope.stop();
});

test("TagsInput adds, deduplicates, pastes, removes, and resets repeated values", async () => {
  const form = new EventTarget();
  const control = ref({ form } as unknown as HTMLSelectElement);
  const value = ref<readonly string[]>(["vue"]);
  const scope = effectScope();
  const tags = scope.run(() => useTagsInput({
    value,
    label: "Topics",
    required: true,
    formControl: control,
  }));
  assert.ok(tags);
  tags.inputValue.value = "accessibility";
  assert.equal(tags.add(), true);
  assert.deepEqual(value.value, ["vue", "accessibility"]);
  tags.inputValue.value = "vue";
  assert.equal(tags.add(), false);
  assert.deepEqual(value.value, ["vue", "accessibility"]);

  let prevented = false;
  tags.inputProps.onPaste({
    clipboardData: { getData: () => "forms, aria\nkeyboard" },
    preventDefault() { prevented = true; },
  } as unknown as ClipboardEvent);
  assert.equal(prevented, true);
  assert.deepEqual(value.value, ["vue", "accessibility", "forms", "aria", "keyboard"]);
  tags.remove(1);
  assert.deepEqual(value.value, ["vue", "forms", "aria", "keyboard"]);
  value.value = ["changed"];
  form.dispatchEvent(new Event("reset"));
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.deepEqual(value.value, ["vue"]);
  value.value = [];
  tags.formProps.onInvalid({ preventDefault() {} } as unknown as Event);
  assert.equal(tags.inputProps["aria-invalid"], "true");
  value.value = ["restored"];
  assert.equal(tags.inputProps["aria-invalid"], undefined);
  scope.stop();
});

test("read-only collection fields remain submitted but are barred from required validation", () => {
  const scope = effectScope();
  scope.run(() => {
    const multi = useMultiSelect({
      items: [{ key: "a", label: "Alpha" }],
      selected: ref<readonly string[]>([]),
      getKey: (item) => item.key,
      getTextValue: (item) => item.label,
      label: "Letters",
      required: true,
      readOnly: true,
    });
    const tags = useTagsInput({ value: ref<readonly string[]>([]), label: "Tags", required: true, readOnly: true });
    assert.equal(multi.formProps.disabled, false);
    assert.equal(multi.formProps.required, false);
    assert.equal(tags.formProps.disabled, false);
    assert.equal(tags.formProps.required, false);
  });
  scope.stop();
});

test("Autocomplete preserves IME text in progress and rolls rejected composition and selection back", async () => {
  const source = ref("Locked");
  const value = computed({ get: () => source.value, set: () => {} });
  const items = [{ key: "jp", label: "Japan" }];
  const scope = effectScope();
  const autocomplete = scope.run(() => useAutocomplete({
    value,
    items,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
  }));
  assert.ok(autocomplete);
  const input = { value: "日本" } as HTMLInputElement;
  const composition = { currentTarget: input } as unknown as CompositionEvent;
  autocomplete.inputProps.onCompositionstart(composition);
  autocomplete.inputProps.onInput({ currentTarget: input, isComposing: true } as unknown as InputEvent);
  await nextTick();
  assert.equal(input.value, "日本");
  autocomplete.inputProps.onCompositionend(composition);
  await nextTick();
  await nextTick();
  assert.equal(input.value, "Locked");
  autocomplete.select(items[0]);
  await nextTick();
  await nextTick();
  assert.equal(autocomplete.selectedKey.value, null);
  assert.equal(source.value, "Locked");
  scope.stop();
});

test("MultiSelect and TagsInput retain drafts when controlled collection writes are rejected", async () => {
  const selectedSource = ref<readonly string[]>(["a"]);
  const selected = computed({ get: () => selectedSource.value, set: () => {} });
  const tagsSource = ref<readonly string[]>(["vue"]);
  const value = computed({ get: () => tagsSource.value, set: () => {} });
  const scope = effectScope();
  const multi = scope.run(() => useMultiSelect({
    items: [{ key: "a", label: "Alpha" }, { key: "b", label: "Beta" }],
    selected,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    label: "Locked letters",
  }));
  const tags = scope.run(() => useTagsInput({ value, label: "Locked topics" }));
  assert.ok(multi && tags);
  const multiInput = { value: "bet" } as HTMLInputElement;
  multi.inputProps.onInput({ currentTarget: multiInput } as unknown as Event);
  multi.toggle(multi.visibleItems.value[0]);
  const tagsInput = { value: "aria" } as HTMLInputElement;
  tags.inputProps.onInput({ currentTarget: tagsInput } as unknown as Event);
  assert.equal(tags.add(), false);
  await nextTick();
  assert.deepEqual(selectedSource.value, ["a"]);
  assert.equal(multi.inputValue.value, "bet");
  assert.deepEqual(tagsSource.value, ["vue"]);
  assert.equal(tags.inputValue.value, "aria");
  assert.equal(tagsInput.value, "aria");
  scope.stop();
});

test("required TagsInput keeps visible invalidity when a controlled addition is rejected", async () => {
  const source = ref<readonly string[]>([]);
  const value = computed({ get: () => source.value, set: () => {} });
  const scope = effectScope();
  const tags = scope.run(() => useTagsInput({ value, label: "Locked required topics", required: true }));
  assert.ok(tags);
  tags.formProps.onInvalid({ preventDefault() {} } as unknown as Event);
  assert.equal(tags.inputProps["aria-invalid"], "true");
  const input = { value: "aria", focus() {} } as unknown as HTMLInputElement;
  tags.inputProps.onInput({ currentTarget: input } as unknown as Event);
  assert.equal(tags.add(), false);
  await nextTick();
  assert.deepEqual(source.value, []);
  assert.equal(tags.inputValue.value, "aria");
  assert.equal(tags.inputProps["aria-invalid"], "true");
  scope.stop();
});
