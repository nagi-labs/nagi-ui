import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  ref,
  toValue,
  useId,
  watch,
  type CSSProperties,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";

import { createAnchorPair, type AnchorOptions } from "./anchor.ts";
import { useNativeCustomValidity, useNativeFormReset } from "./native-form.ts";
import { usePopover, type PopoverProps } from "./popover.ts";

export interface UseComboboxOptions<Item, Key extends string = string> {
  /** The unfiltered data set. Keys must be unique and stable. */
  items: MaybeRefOrGetter<readonly Item[]>;
  getKey: (item: Item) => Key;
  getTextValue: (item: Item) => string;
  isDisabled?: (item: Item) => boolean;
  /** Defaults to a locale-aware, case-insensitive substring match. */
  filter?: (item: Item, inputValue: string) => boolean;
  /** Controlled editable value. This is the text rendered by the input. */
  inputValue?: Ref<string>;
  defaultInputValue?: string;
  onInputValueChange?: (value: string) => void;
  /**
   * Controlled committed option. Filtering never prunes this key; navigating
   * suggestions only changes activeKey and Escape therefore remains lossless.
   */
  selected?: Ref<Key | null>;
  defaultSelected?: Key | null;
  onSelectionChange?: (key: Key | null) => void;
  onSelect?: (item: Item) => void;
  open?: Ref<boolean>;
  defaultOpen?: boolean;
  /** Popup id. The input id is derived as `${id}-input`. */
  id?: string;
  /** Wrap ArrowUp/ArrowDown at the ends. Defaults to false. */
  loop?: boolean;
  /** Prevent every interaction and expose the native disabled state. */
  disabled?: MaybeRefOrGetter<boolean>;
  /** Allow inspection, but prevent editing, clearing, and selection changes. */
  readOnly?: MaybeRefOrGetter<boolean>;
  /** Expose aria-required; the renderer owns form constraint validation. */
  required?: MaybeRefOrGetter<boolean>;
  /** Keep the popup available for an application-owned empty/loading status. */
  openWhenEmpty?: MaybeRefOrGetter<boolean>;
  /** Position the listbox against the input. Defaults to native/fallback anchoring. */
  anchor?: AnchorOptions | true;
}

export interface ComboboxInputProps {
  id: string;
  role: "combobox";
  readonly value: string;
  "aria-autocomplete": "list";
  "aria-controls": string;
  readonly "aria-expanded": "true" | "false";
  readonly "aria-activedescendant": string | undefined;
  readonly "aria-required": "true" | undefined;
  readonly disabled: boolean;
  readonly readonly: boolean;
  style?: CSSProperties;
  onInput: (event: Event) => void;
  onClick: (event: MouseEvent) => void;
  onKeydown: (event: KeyboardEvent) => void;
  onFocus: (event: FocusEvent) => void;
  onBlur: (event: FocusEvent) => void;
}

export interface ComboboxPopupProps extends PopoverProps {}

export interface ComboboxListboxProps {
  id: string;
  role: "listbox";
}

export interface ComboboxOptionProps {
  id: string;
  role: "option";
  "aria-selected": "true" | "false";
  "aria-disabled"?: "true";
  onPointerdown: (event: PointerEvent) => void;
  onClick: (event: MouseEvent) => void;
}

export interface UseComboboxReturn<Item, Key extends string = string> {
  id: string;
  inputId: string;
  open: Ref<boolean>;
  inputValue: Ref<string>;
  selectedKey: Ref<Key | null>;
  activeKey: Ref<Key | null>;
  visibleItems: ComputedRef<readonly Item[]>;
  show: () => void;
  hide: () => void;
  select: (item: Item) => void;
  clear: () => void;
  inputProps: ComboboxInputProps;
  popupProps: ComboboxPopupProps;
  listboxProps: ComboboxListboxProps;
  optionProps: (item: Item) => ComboboxOptionProps;
}

interface ComboboxControlProps {
  readonly required: boolean;
  readonly validationMessage: string;
}

/** Binds one editable combobox model to its native form-control channels. */
export function useComboboxControl<Item, Key extends string>(
  props: ComboboxControlProps,
  input: Readonly<Ref<HTMLInputElement | null>>,
  behavior: UseComboboxReturn<Item, Key>,
) {
  const initialInputValue = behavior.inputValue.value;
  const initialSelected = behavior.selectedKey.value;

  useNativeFormReset(input, (control) => {
    behavior.selectedKey.value = initialSelected;
    behavior.hide();
    // Selection watchers canonicalize text to the option label. Reset owns
    // both initial models, so restore deliberately non-canonical initial text
    // after those watchers settle.
    void nextTick(() => {
      behavior.inputValue.value = initialInputValue;
      control.value = initialInputValue;
    });
  });

  useNativeCustomValidity(input, () =>
    props.required && behavior.selectedKey.value === null
      ? props.validationMessage
      : "",
  );

  function clear() {
    behavior.clear();
    input.value?.focus();
  }

  return { clear };
}

/**
 * Editable list-autocomplete combobox. DOM focus stays on the caller-owned
 * input while aria-activedescendant points into the popover listbox.
 * Navigation is provisional: only Enter/click commits selectedKey.
 */
export function useCombobox<Item, Key extends string = string>(
  options: UseComboboxOptions<Item, Key>,
): UseComboboxReturn<Item, Key> {
  const instance = getCurrentInstance();
  const generatedId = instance ? useId() : `nagi-combobox-${comboboxCount++}`;
  const id = options.id ?? generatedId;
  const inputId = `${id}-input`;

  function allItems(): readonly Item[] {
    return toValue(options.items);
  }

  function keyOf(item: Item): Key {
    return options.getKey(item);
  }

  function isDisabled(item: Item): boolean {
    return options.isDisabled?.(item) ?? false;
  }

  function componentDisabled(): boolean {
    return toValue(options.disabled) ?? false;
  }

  function componentReadOnly(): boolean {
    return toValue(options.readOnly) ?? false;
  }

  function opensWhenEmpty(): boolean {
    return toValue(options.openWhenEmpty) ?? false;
  }

  const initialSelected = options.selected?.value ?? options.defaultSelected ?? null;
  const internalSelection = ref<Key | null>(initialSelected) as Ref<Key | null>;
  const selectedKey = options.selected ?? internalSelection;
  const initialItem =
    initialSelected === null
      ? undefined
      : allItems().find((item) => keyOf(item) === initialSelected);
  const internalInputValue = ref(
    options.defaultInputValue ??
      (initialItem === undefined ? "" : options.getTextValue(initialItem)),
  );
  const inputValue = options.inputValue ?? internalInputValue;
  const activeKey = ref<Key | null>(null) as Ref<Key | null>;

  const visibleItems = computed<readonly Item[]>(() => {
    const query = inputValue.value;
    if (options.filter) return allItems().filter((item) => options.filter?.(item, query));
    const normalized = query.trim().toLocaleLowerCase();
    if (normalized === "") return allItems();
    return allItems().filter((item) =>
      options.getTextValue(item).toLocaleLowerCase().includes(normalized),
    );
  });

  function enabledItems(): readonly Item[] {
    return visibleItems.value.filter((item) => !isDisabled(item));
  }

  function optionId(key: string): string {
    return `${id}-option-${encodeURIComponent(key)}`;
  }

  const popover = usePopover({
    ...(options.open ? { open: options.open } : {}),
    ...(options.defaultOpen === undefined ? {} : { defaultOpen: options.defaultOpen }),
    id: `${id}-popup`,
  });
  const anchor = createAnchorPair(
    id,
    options.anchor === undefined || options.anchor === true ? {} : options.anchor,
  );

  let inputElement: HTMLInputElement | null = null;
  let popupElement: HTMLElement | null = null;
  let detachAnchor: (() => void) | null = null;

  function recordInput(event: Event) {
    const candidate = event.currentTarget ?? event.target;
    if (
      typeof HTMLInputElement !== "undefined" &&
      candidate instanceof HTMLInputElement
    ) {
      inputElement = candidate;
    }
  }

  function syncAnchor(isOpen: boolean) {
    detachAnchor?.();
    detachAnchor = null;
    if (!isOpen || anchor.native || !inputElement || !popupElement) return;
    detachAnchor = anchor.attach(inputElement, popupElement);
  }

  function scrollActive() {
    if (activeKey.value === null || typeof document === "undefined") return;
    const element = document.getElementById(optionId(activeKey.value));
    queueMicrotask(() => element?.scrollIntoView({ block: "nearest" }));
  }

  function setActive(item: Item | undefined) {
    activeKey.value = item === undefined ? null : keyOf(item);
    if (item !== undefined) scrollActive();
  }

  function activeItem(): Item | undefined {
    return visibleItems.value.find((item) => keyOf(item) === activeKey.value);
  }

  function writeInputValue(next: string) {
    if (inputValue.value === next) return;
    inputValue.value = next;
    options.onInputValueChange?.(next);
  }

  function writeSelection(next: Key | null) {
    if (selectedKey.value === next) return;
    selectedKey.value = next;
    options.onSelectionChange?.(next);
  }

  function show() {
    if (componentDisabled()) return;
    if (enabledItems().length === 0 && !opensWhenEmpty()) return;
    popover.show();
  }

  function hide() {
    setActive(undefined);
    popover.hide();
  }

  function select(item: Item) {
    if (componentDisabled() || componentReadOnly() || isDisabled(item)) return;
    writeSelection(keyOf(item));
    writeInputValue(options.getTextValue(item));
    options.onSelect?.(item);
    hide();
  }

  function clear() {
    if (componentDisabled() || componentReadOnly()) return;
    writeSelection(null);
    writeInputValue("");
    hide();
  }

  function move(delta: -1 | 1) {
    const enabled = enabledItems();
    if (enabled.length === 0) {
      setActive(undefined);
      return;
    }
    const current = enabled.findIndex((item) => keyOf(item) === activeKey.value);
    if (current === -1) {
      setActive(delta === 1 ? enabled[0] : enabled.at(-1));
      return;
    }
    const proposed = current + delta;
    const next =
      options.loop === true
        ? (proposed + enabled.length) % enabled.length
        : Math.max(0, Math.min(proposed, enabled.length - 1));
    setActive(enabled[next]);
  }

  function handled(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function onInput(event: Event) {
    recordInput(event);
    if (componentDisabled() || componentReadOnly()) return;
    const target = event.currentTarget ?? event.target;
    if (typeof (target as HTMLInputElement | null)?.value !== "string") return;
    writeInputValue((target as HTMLInputElement).value);
    setActive(undefined);
    // defineModel/custom refs can publish to their parent before their getter
    // reflects the new prop. Wait for that render so filtering, rendered
    // options, and popover visibility advance as one transaction.
    void nextTick(() => {
      if (enabledItems().length === 0 && !opensWhenEmpty()) hide();
      else show();
    });
  }

  function onKeydown(event: KeyboardEvent) {
    recordInput(event);
    if (componentDisabled()) return;
    if (event.isComposing || event.keyCode === 229) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      handled(event);
      show();
      if (!event.altKey) move(event.key === "ArrowDown" ? 1 : -1);
      return;
    }

    if (event.key === "Enter" && popover.open.value) {
      const item = activeItem();
      if (item === undefined) return;
      handled(event);
      if (componentReadOnly()) hide();
      else select(item);
      return;
    }

    if (event.key === "Escape" && popover.open.value) {
      handled(event);
      hide();
    }
  }

  const originalOnToggle = popover.popoverProps.onToggle;
  const popupProps: ComboboxPopupProps = {
    ...popover.popoverProps,
    style: anchor.positionedStyle,
    onToggle(event) {
      popupElement = event.target as HTMLElement;
      originalOnToggle(event);
      syncAnchor(event.newState === "open");
      if (event.newState === "closed") setActive(undefined);
    },
  };

  const listboxProps: ComboboxListboxProps = {
    id,
    role: "listbox",
  };

  const inputProps: ComboboxInputProps = {
    id: inputId,
    role: "combobox",
    get value() {
      return inputValue.value;
    },
    "aria-autocomplete": "list",
    "aria-controls": id,
    get "aria-expanded"() {
      return popover.open.value ? "true" : "false";
    },
    get "aria-activedescendant"() {
      return activeKey.value === null ? undefined : optionId(activeKey.value);
    },
    get disabled() {
      return componentDisabled();
    },
    get readonly() {
      return componentReadOnly();
    },
    get "aria-required"() {
      return toValue(options.required) ? "true" : undefined;
    },
    style: anchor.anchorStyle,
    onInput,
    onClick(event) {
      recordInput(event);
      show();
    },
    onKeydown,
    onFocus(event) {
      recordInput(event);
    },
    onBlur(event) {
      const target = event.currentTarget;
      queueMicrotask(() => {
        if (typeof document === "undefined" || document.activeElement === target) return;
        hide();
      });
    },
  };

  function optionProps(item: Item): ComboboxOptionProps {
    const key = keyOf(item);
    const disabled = isDisabled(item);
    return {
      id: optionId(key),
      role: "option",
      "aria-selected": activeKey.value === key ? "true" : "false",
      ...(disabled ? { "aria-disabled": "true" as const } : {}),
      onPointerdown(event) {
        // Keep DOM focus on the input so aria-activedescendant remains valid
        // through the subsequent click selection.
        event.preventDefault();
      },
      onClick(event) {
        if (componentDisabled() || componentReadOnly() || disabled) {
          event.preventDefault();
          return;
        }
        select(item);
      },
    };
  }

  watch(
    () => [enabledItems().map(keyOf), opensWhenEmpty()] as const,
    ([keys, openWhenEmpty]) => {
      if (activeKey.value !== null && !keys.includes(activeKey.value)) setActive(undefined);
      if (keys.length === 0 && !openWhenEmpty && popover.open.value) hide();
    },
  );

  watch(
    () => [componentDisabled(), componentReadOnly()] as const,
    ([disabled, readOnly]) => {
      if ((disabled || readOnly) && popover.open.value) hide();
    },
  );

  watch(selectedKey, (key) => {
    if (key === null) return;
    const item = allItems().find((candidate) => keyOf(candidate) === key);
    if (item !== undefined) writeInputValue(options.getTextValue(item));
  });

  if (instance) {
    onBeforeUnmount(() => {
      detachAnchor?.();
      detachAnchor = null;
    });
  }

  return {
    id,
    inputId,
    open: popover.open,
    inputValue,
    selectedKey,
    activeKey,
    visibleItems,
    show,
    hide,
    select,
    clear,
    inputProps,
    popupProps,
    listboxProps,
    optionProps,
  };
}

let comboboxCount = 0;
