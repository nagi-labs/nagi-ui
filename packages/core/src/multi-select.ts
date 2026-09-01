import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef,
  toValue,
  useId,
  watch,
  type ComponentPublicInstance,
  type CSSProperties,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";

import { createAnchorPair } from "./anchor.ts";
import { createElementRegistry } from "./element-registry.ts";
import { useNativeFormReset } from "./native-form.ts";
import { modelValueAccepted, type WritableRef } from "./model-sync.ts";
import { usePopover, type PopoverProps } from "./popover.ts";

export interface UseMultiSelectOptions<Item, Key extends string = string> {
  items: MaybeRefOrGetter<readonly Item[]>;
  selected: WritableRef<readonly Key[]>;
  getKey: (item: Item) => Key;
  getTextValue: (item: Item) => string;
  isDisabled?: (item: Item) => boolean;
  label: MaybeRefOrGetter<string>;
  name?: MaybeRefOrGetter<string | undefined>;
  form?: MaybeRefOrGetter<string | undefined>;
  placeholder?: MaybeRefOrGetter<string | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  readOnly?: MaybeRefOrGetter<boolean | undefined>;
  required?: MaybeRefOrGetter<boolean | undefined>;
  open?: WritableRef<boolean>;
  formControl?: Readonly<Ref<HTMLSelectElement | null>>;
  inputControl?: Readonly<Ref<HTMLInputElement | null>>;
  id?: string;
}

export interface MultiSelectInputProps {
  ref: (element: Element | ComponentPublicInstance | null) => void;
  id: string;
  role: "combobox";
  value: string;
  "aria-label": string;
  "aria-autocomplete": "list";
  "aria-controls": string;
  "aria-expanded": "true" | "false";
  "aria-activedescendant"?: string | undefined;
  readonly "aria-required": "true" | undefined;
  readonly "aria-invalid": "true" | undefined;
  placeholder?: string | undefined;
  disabled: boolean;
  readonly: boolean;
  style?: CSSProperties;
  onInput: (event: Event) => void;
  onClick: (event: MouseEvent) => void;
  onKeydown: (event: KeyboardEvent) => void;
  onBlur: (event: FocusEvent) => void;
}

export interface MultiSelectOptionProps {
  ref: (element: Element | ComponentPublicInstance | null) => void;
  id: string;
  role: "option";
  "aria-selected": "true" | "false";
  "aria-disabled"?: "true";
  "data-active"?: "";
  onPointerdown: (event: PointerEvent) => void;
  onClick: (event: MouseEvent) => void;
}

export interface MultiSelectFormProps {
  ref: (element: Element | ComponentPublicInstance | null) => void;
  multiple: true;
  name?: string | undefined;
  form?: string | undefined;
  disabled: boolean;
  required: boolean;
  tabindex: -1;
  "aria-hidden": "true";
  onInvalid: (event: Event) => void;
}

export interface MultiSelectBinding<Item, Key extends string = string> {
  selected: Ref<readonly Key[]>;
  inputValue: Ref<string>;
  activeKey: Ref<Key | null>;
  inputElement: Readonly<Ref<HTMLInputElement | null>>;
  formElement: Readonly<Ref<HTMLSelectElement | null>>;
  visibleItems: ComputedRef<readonly Item[]>;
  popupProps: PopoverProps & { style?: CSSProperties };
  listboxProps: { id: string; role: "listbox"; "aria-multiselectable": "true" };
  inputProps: MultiSelectInputProps;
  optionProps: (item: Item) => MultiSelectOptionProps;
  formProps: MultiSelectFormProps;
  isSelected: (item: Item) => boolean;
  toggle: (item: Item) => void;
  remove: (key: Key) => void;
  reset: (value: readonly Key[]) => void;
}

interface MultiSelectComponentItem {
  readonly key: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface MultiSelectComponentProps<Item extends MultiSelectComponentItem> {
  readonly items: readonly Item[];
  readonly id?: string | undefined;
  readonly label: string;
  readonly name?: string | undefined;
  readonly form?: string | undefined;
  readonly placeholder?: string | undefined;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
}

export interface MultiSelectComponentModel {
  selected: Ref<readonly string[]>;
  formControl?: Readonly<Ref<HTMLSelectElement | null>>;
  inputControl?: Readonly<Ref<HTMLInputElement | null>>;
}

let multiSelectCount = 0;

function createMultiSelect<Item, Key extends string>(
  options: UseMultiSelectOptions<Item, Key>,
): MultiSelectBinding<Item, Key> {
  const instance = getCurrentInstance();
  const id = options.id ?? (instance ? useId() : `nagi-multi-select-${multiSelectCount++}`);
  const inputValue = ref("");
  const activeKey = ref<Key | null>(null) as Ref<Key | null>;
  const invalid = ref(false);
  const popover = usePopover({ ...(options.open ? { open: options.open } : {}), id: `${id}-popup` });
  const anchor = createAnchorPair(id, {});
  const inputElement = shallowRef<HTMLInputElement | null>(null);
  const formElement = shallowRef<HTMLSelectElement | null>(null);
  let popupElement: HTMLElement | null = null;
  let detachAnchor: (() => void) | null = null;
  const optionElements = createElementRegistry<Key>();
  const currentInput = () => options.inputControl?.value ?? inputElement.value;

  const items = () => toValue(options.items);
  const keyOf = (item: Item) => options.getKey(item);
  const itemDisabled = (item: Item) => options.isDisabled?.(item) ?? false;
  const disabled = () => toValue(options.disabled) ?? false;
  const readOnly = () => toValue(options.readOnly) ?? false;
  const visibleItems = computed(() => {
    const query = inputValue.value.trim().toLocaleLowerCase();
    return query === "" ? items() : items().filter((item) =>
      options.getTextValue(item).toLocaleLowerCase().includes(query));
  });
  const enabled = () => visibleItems.value.filter((item) => !itemDisabled(item));
  const optionId = (key: Key) => `${id}-option-${encodeURIComponent(key)}`;

  function setInput(element: Element | ComponentPublicInstance | null) {
    inputElement.value = element as HTMLInputElement | null;
    syncAnchor(popover.open.value);
  }

  function setFormControl(element: Element | ComponentPublicInstance | null) {
    formElement.value = element as HTMLSelectElement | null;
  }

  function syncAnchor(open: boolean) {
    detachAnchor?.();
    detachAnchor = null;
    if (!open || anchor.native || !inputElement.value || !popupElement) return;
    detachAnchor = anchor.attach(inputElement.value, popupElement);
  }

  function write(next: readonly Key[]) {
    options.selected.value = next;
  }

  function equals(left: readonly Key[], right: readonly Key[]) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
  }

  function clearQuery() {
    inputValue.value = "";
    if (inputElement.value) inputElement.value.value = "";
  }

  function commit(next: readonly Key[], clearOnAccept = false): boolean {
    write(next);
    const accepted = equals(options.selected.value, next);
    if (accepted && clearOnAccept) clearQuery();
    else if (clearOnAccept) {
      void modelValueAccepted(options.selected, next, equals).then((eventuallyAccepted) => {
        if (eventuallyAccepted) clearQuery();
      });
    }
    return accepted;
  }

  function isSelected(item: Item) {
    return options.selected.value.includes(keyOf(item));
  }

  function toggle(item: Item) {
    if (disabled() || readOnly() || itemDisabled(item)) return;
    const key = keyOf(item);
    commit(options.selected.value.includes(key)
      ? options.selected.value.filter((candidate) => candidate !== key)
      : [...options.selected.value, key], true);
  }

  function remove(key: Key) {
    if (disabled() || readOnly()) return;
    write(options.selected.value.filter((candidate) => candidate !== key));
    void nextTick(() => currentInput()?.focus());
  }

  function move(delta: -1 | 1) {
    const candidates = enabled();
    if (candidates.length === 0) { activeKey.value = null; return; }
    const current = candidates.findIndex((item) => keyOf(item) === activeKey.value);
    const next = current < 0
      ? (delta > 0 ? 0 : candidates.length - 1)
      : Math.max(0, Math.min(current + delta, candidates.length - 1));
    const candidate = candidates[next];
    if (candidate) {
      activeKey.value = keyOf(candidate);
      const key = keyOf(candidate);
      queueMicrotask(() => {
        optionElements.get(key)?.scrollIntoView({ block: "nearest" });
      });
    }
  }

  const originalToggle = popover.popoverProps.onToggle;
  const popupProps = {
    ...popover.popoverProps,
    style: anchor.positionedStyle,
    onToggle(event: ToggleEvent) {
      popupElement = event.target as HTMLElement;
      originalToggle(event);
      syncAnchor(event.newState === "open");
      if (event.newState === "closed") activeKey.value = null;
    },
  };

  const inputProps: MultiSelectInputProps = {
    ref: setInput,
    id: `${id}-input`,
    role: "combobox",
    get value() { return inputValue.value; },
    get "aria-label"() { return toValue(options.label); },
    "aria-autocomplete": "list",
    "aria-controls": `${id}-listbox`,
    get "aria-expanded"() { return popover.open.value ? "true" : "false"; },
    get "aria-activedescendant"() { return activeKey.value ? optionId(activeKey.value) : undefined; },
    get "aria-required"() { return toValue(options.required) ? "true" : undefined; },
    get "aria-invalid"() { return invalid.value ? "true" : undefined; },
    get placeholder() { return toValue(options.placeholder); },
    get disabled() { return disabled(); },
    get readonly() { return readOnly(); },
    style: anchor.anchorStyle,
    onInput(event) {
      inputElement.value = event.currentTarget as HTMLInputElement;
      if (disabled() || readOnly()) return;
      inputValue.value = inputElement.value.value;
      popover.show();
    },
    onClick(event) {
      inputElement.value = event.currentTarget as HTMLInputElement;
      if (!disabled() && !readOnly()) popover.show();
    },
    onKeydown(event) {
      inputElement.value = event.currentTarget as HTMLInputElement;
      if (disabled() || readOnly() || event.isComposing || event.keyCode === 229) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        popover.show();
        move(event.key === "ArrowDown" ? 1 : -1);
        void nextTick(() => {
          if (!popover.open.value) activeKey.value = null;
        });
      } else if (event.key === "Enter" && popover.open.value && activeKey.value) {
        const item = visibleItems.value.find((candidate) => keyOf(candidate) === activeKey.value);
        if (item) { event.preventDefault(); toggle(item); }
      } else if (event.key === "Escape" && popover.open.value) {
        event.preventDefault();
        popover.hide();
      } else if (event.key === "Backspace" && inputValue.value === "") {
        const last = options.selected.value.at(-1);
        if (last) { event.preventDefault(); remove(last); }
      }
    },
    onBlur(event) {
      const target = event.currentTarget;
      queueMicrotask(() => {
        const root = (target as HTMLElement).getRootNode();
        const active = "activeElement" in root
          ? (root as Document | ShadowRoot).activeElement
          : null;
        if (active !== target) popover.hide();
      });
    },
  };

  function reset(value: readonly Key[]) {
    commit([...value], true);
    invalid.value = false;
    activeKey.value = null;
    popover.hide();
  }

  const formProps: MultiSelectFormProps = {
    ref: setFormControl,
    multiple: true,
    get name() { return toValue(options.name); },
    get form() { return toValue(options.form); },
    get disabled() { return disabled(); },
    get required() { return (toValue(options.required) ?? false) && !readOnly(); },
    tabindex: -1,
    "aria-hidden": "true",
    onInvalid(event) {
      event.preventDefault();
      invalid.value = true;
      currentInput()?.focus();
    },
  };

  const resetControl = options.formControl ?? formElement;
  if (options.formControl || instance) {
    const initial = [...options.selected.value];
    useNativeFormReset(resetControl, () => reset(initial));
  }

  function reconcileValidity(
    [required, isDisabled, isReadOnly, selectionCount]: readonly [boolean, boolean, boolean, number],
  ) {
    if (!required || isDisabled || isReadOnly || selectionCount > 0) invalid.value = false;
  }

  function reconcileInteractionMode(
    [isDisabled, isReadOnly, isOpen]: readonly [boolean, boolean, boolean],
  ) {
    if (isDisabled || isReadOnly) {
      if (isOpen) popover.hide();
      activeKey.value = null;
    } else if (!isOpen) {
      activeKey.value = null;
    }
  }

  function reconcileCollection(
    [visibleKeys, enabledKeys]: readonly [readonly Key[], readonly Key[]],
  ) {
    optionElements.prune(visibleKeys);
    if (activeKey.value !== null && !enabledKeys.includes(activeKey.value)) {
      activeKey.value = null;
    }
  }

  watch(
    () => [
      toValue(options.required) ?? false,
      disabled(),
      readOnly(),
      options.selected.value.length,
    ] as const,
    reconcileValidity,
    { flush: "sync", immediate: true },
  );
  watch(
    () => [disabled(), readOnly(), popover.open.value] as const,
    reconcileInteractionMode,
    { flush: "sync", immediate: true },
  );
  watch(
    () => [visibleItems.value.map(keyOf), enabled().map(keyOf)] as const,
    reconcileCollection,
    { flush: "sync", immediate: true },
  );

  if (instance) {
    onBeforeUnmount(() => {
      detachAnchor?.();
      detachAnchor = null;
      optionElements.clear();
    });
  }

  return {
    selected: options.selected,
    inputValue,
    activeKey,
    inputElement,
    formElement,
    visibleItems,
    popupProps,
    listboxProps: { id: `${id}-listbox`, role: "listbox", "aria-multiselectable": "true" },
    inputProps,
    optionProps(item) {
      const key = keyOf(item);
      return {
        ref: optionElements.refFor(key),
        id: optionId(key),
        role: "option",
        "aria-selected": isSelected(item) ? "true" : "false",
        ...(activeKey.value === key ? { "data-active": "" as const } : {}),
        ...(itemDisabled(item) ? { "aria-disabled": "true" as const } : {}),
        onPointerdown(event) { event.preventDefault(); },
        onClick(event) {
          if (itemDisabled(item)) { event.preventDefault(); return; }
          toggle(item);
        },
      };
    },
    formProps,
    isSelected,
    toggle,
    remove,
    reset,
  };
}

export function useMultiSelect<Item, Key extends string = string>(
  options: UseMultiSelectOptions<Item, Key>,
): MultiSelectBinding<Item, Key>;
export function useMultiSelect<Item extends MultiSelectComponentItem>(
  props: MultiSelectComponentProps<Item>,
  model: MultiSelectComponentModel,
): MultiSelectBinding<Item, string>;
export function useMultiSelect(
  optionsOrProps: UseMultiSelectOptions<unknown> | MultiSelectComponentProps<MultiSelectComponentItem>,
  model?: MultiSelectComponentModel,
): MultiSelectBinding<unknown> {
  if (!model) return createMultiSelect(optionsOrProps as UseMultiSelectOptions<unknown>);
  const props = optionsOrProps as MultiSelectComponentProps<MultiSelectComponentItem>;
  return createMultiSelect({
    ...(props.id === undefined ? {} : { id: props.id }),
    items: () => props.items,
    selected: model.selected,
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    isDisabled: (item) => item.disabled ?? false,
    label: () => props.label,
    name: () => props.name,
    form: () => props.form,
    placeholder: () => props.placeholder,
    disabled: () => props.disabled,
    readOnly: () => props.readOnly,
    required: () => props.required,
    ...(model.formControl ? { formControl: model.formControl } : {}),
    ...(model.inputControl ? { inputControl: model.inputControl } : {}),
  }) as unknown as MultiSelectBinding<unknown>;
}
