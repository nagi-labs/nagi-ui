import {
  computed,
  getCurrentInstance,
  nextTick,
  onBeforeUnmount,
  reactive,
  ref,
  shallowRef,
  toValue,
  useId,
  watch,
  type CSSProperties,
  type ComponentPublicInstance,
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
  /** Expose aria-required and drive selected-value form constraint validation. */
  required?: MaybeRefOrGetter<boolean>;
  /** Native constraint message when a required Combobox has no committed option. */
  validationMessage?: MaybeRefOrGetter<string | undefined>;
  /** Keep the popup available for an application-owned empty/loading status. */
  openWhenEmpty?: MaybeRefOrGetter<boolean>;
  /** Position the listbox against the input. Defaults to native/fallback anchoring. */
  anchor?: AnchorOptions | true;
}

export interface ComboboxInputProps {
  /** Complete Behavior API wiring; registers the local native input. */
  ref: (element: Element | ComponentPublicInstance | null) => void;
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
  onCompositionstart: (event: CompositionEvent) => void;
  onCompositionend: (event: CompositionEvent) => void;
  onClick: (event: MouseEvent) => void;
  onKeydown: (event: KeyboardEvent) => void;
  onFocus: (event: FocusEvent) => void;
  onBlur: (event: FocusEvent) => void;
}

export interface ComboboxPopupProps extends PopoverProps {}

export interface ComboboxListboxProps {
  /** Complete Behavior API wiring; registered locally instead of rediscovered from `document`. */
  ref: (element: Element | ComponentPublicInstance | null) => void;
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

export interface ComboboxClearButtonProps {
  onClick: () => void;
}

export interface UseComboboxReturn<Item, Key extends string = string> {
  id: string;
  inputId: string;
  open: Ref<boolean>;
  inputValue: Ref<string>;
  selectedKey: Ref<Key | null>;
  activeKey: Ref<Key | null>;
  /** Locally registered input for form adapters and focus restoration. */
  inputElement: Readonly<Ref<HTMLInputElement | null>>;
  visibleItems: ComputedRef<readonly Item[]>;
  show: () => void;
  hide: () => void;
  select: (item: Item) => void;
  clear: () => void;
  clearButtonProps: ComboboxClearButtonProps;
  inputProps: ComboboxInputProps;
  popupProps: ComboboxPopupProps;
  listboxProps: ComboboxListboxProps;
  optionProps: (item: Item) => ComboboxOptionProps;
}

interface ComboboxComponentItem {
  readonly key: string;
  readonly label: string;
  readonly disabled?: boolean;
}

interface ComboboxComponentProps<Item extends ComboboxComponentItem> {
  readonly items: readonly Item[];
  readonly id?: string | undefined;
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly required: boolean;
  readonly validationMessage: string;
}

/**
 * Editable list-autocomplete combobox. DOM focus stays on the caller-owned
 * input while aria-activedescendant points into the popover listbox.
 * Navigation is provisional: only Enter/click commits selectedKey.
 */
function createCombobox<Item, Key extends string = string>(
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

  const inputElement = shallowRef<HTMLInputElement | null>(null);
  let popupElement: HTMLElement | null = null;
  let listboxElement: HTMLElement | null = null;
  let detachAnchor: (() => void) | null = null;
  let composing = false;

  function recordInput(event: Event) {
    const candidate = event.currentTarget ?? event.target;
    if (typeof HTMLInputElement !== "undefined" && candidate instanceof HTMLInputElement) {
      inputElement.value = candidate;
    }
  }

  function setInput(element: Element | ComponentPublicInstance | null) {
    inputElement.value = element as HTMLInputElement | null;
    syncAnchor(popover.open.value);
  }

  function syncAnchor(isOpen: boolean) {
    detachAnchor?.();
    detachAnchor = null;
    if (!isOpen || anchor.native || !inputElement.value || !popupElement) return;
    detachAnchor = anchor.attach(inputElement.value, popupElement);
  }

  function scrollActive() {
    const key = activeKey.value;
    const currentListbox = listboxElement;
    if (key === null || !currentListbox) return;
    queueMicrotask(() => {
      if (listboxElement !== currentListbox || activeKey.value !== key) return;
      const targetId = optionId(key);
      const element = Array.from(
        currentListbox.querySelectorAll<HTMLElement>('[role="option"]'),
      ).find((candidate) => candidate.id === targetId);
      element?.scrollIntoView({ block: "nearest" });
    });
  }

  function setListbox(element: Element | ComponentPublicInstance | null) {
    listboxElement = element as HTMLElement | null;
    if (listboxElement && activeKey.value !== null) scrollActive();
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

  const clearButtonProps: ComboboxClearButtonProps = {
    onClick() {
      clear();
      inputElement.value?.focus();
    },
  };

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
    if (composing || (event as InputEvent).isComposing) return;
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

  const listboxProps = reactive<ComboboxListboxProps>({
    ref: setListbox,
    id,
    role: "listbox",
  });

  const inputProps = reactive<ComboboxInputProps>({
    ref: setInput,
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
    onCompositionstart(event) {
      recordInput(event);
      composing = true;
    },
    onCompositionend(event) {
      composing = false;
      onInput(event);
    },
    onClick(event) {
      recordInput(event);
      show();
    },
    onKeydown,
    onFocus(event) {
      recordInput(event);
    },
    onBlur(event) {
      const target = event.currentTarget as HTMLInputElement;
      queueMicrotask(() => {
        const root = target.getRootNode();
        const active =
          "activeElement" in root ? (root as Document | ShadowRoot).activeElement : null;
        if (active === target) return;
        hide();
      });
    },
  });

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

  function reconcileCollection([keys, openWhenEmpty]: readonly [readonly Key[], boolean]) {
    if (activeKey.value !== null && !keys.includes(activeKey.value)) setActive(undefined);
    if (keys.length === 0 && !openWhenEmpty && popover.open.value) hide();
  }

  function reconcileInteractionMode([disabled, readOnly]: readonly [boolean, boolean]) {
    if ((disabled || readOnly) && popover.open.value) hide();
  }

  function syncInputFromSelection(key: Key | null) {
    if (key === null) return;
    const item = allItems().find((candidate) => keyOf(candidate) === key);
    if (item !== undefined) writeInputValue(options.getTextValue(item));
  }

  watch(() => [enabledItems().map(keyOf), opensWhenEmpty()] as const, reconcileCollection);

  watch(() => [componentDisabled(), componentReadOnly()] as const, reconcileInteractionMode);

  watch(selectedKey, syncInputFromSelection);

  if (instance) {
    const initialInputValue = inputValue.value;
    const initialSelected = selectedKey.value;
    useNativeFormReset(inputElement, (control) => {
      selectedKey.value = initialSelected;
      hide();
      // Selection watchers canonicalize text to the option label. Reset owns
      // both initial models, so restore deliberately non-canonical initial text
      // after those watchers settle.
      void nextTick(() => {
        inputValue.value = initialInputValue;
        control.value = initialInputValue;
      });
    });
    useNativeCustomValidity(inputElement, () =>
      (toValue(options.required) ?? false) && selectedKey.value === null
        ? (toValue(options.validationMessage) ?? "Select an option.")
        : "",
    );
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
    inputElement,
    visibleItems,
    show,
    hide,
    select,
    clear,
    clearButtonProps,
    inputProps,
    popupProps,
    listboxProps,
    optionProps,
  };
}

export function useCombobox<Item, Key extends string = string>(
  options: UseComboboxOptions<Item, Key>,
): UseComboboxReturn<Item, Key>;
export function useCombobox<Item extends ComboboxComponentItem>(
  props: ComboboxComponentProps<Item>,
  inputValue: Ref<string>,
  selected: Ref<string | null>,
): UseComboboxReturn<Item>;
export function useCombobox<Item extends ComboboxComponentItem>(
  props: ComboboxComponentProps<Item>,
  input: Readonly<Ref<HTMLInputElement | null>>,
  inputValue: Ref<string>,
  selected: Ref<string | null>,
): UseComboboxReturn<Item>;
/**
 * Uses either complete headless options, or the shipped flat-item contract.
 */
export function useCombobox(
  optionsOrProps: UseComboboxOptions<unknown> | ComboboxComponentProps<ComboboxComponentItem>,
  inputOrInputValue?: Readonly<Ref<HTMLInputElement | null>> | Ref<string>,
  inputValueOrSelected?: Ref<string> | Ref<string | null>,
  selected?: Ref<string | null>,
): unknown {
  if (inputOrInputValue === undefined || inputValueOrSelected === undefined) {
    return createCombobox(optionsOrProps as UseComboboxOptions<unknown>);
  }

  const inputValue =
    selected === undefined
      ? (inputOrInputValue as Ref<string>)
      : (inputValueOrSelected as Ref<string>);
  const selectedKey =
    selected === undefined ? (inputValueOrSelected as Ref<string | null>) : selected;

  const props = optionsOrProps as ComboboxComponentProps<ComboboxComponentItem>;
  const behavior = createCombobox<ComboboxComponentItem>({
    ...(props.id === undefined ? {} : { id: props.id }),
    getKey: (item) => item.key,
    getTextValue: (item) => item.label,
    isDisabled: (item) => item.disabled ?? false,
    disabled: () => props.disabled,
    readOnly: () => props.readOnly,
    required: () => props.required,
    validationMessage: () => props.validationMessage,
    openWhenEmpty: true,
    items: () => (props.loading ? [] : props.items),
    inputValue,
    selected: selectedKey,
  });
  return behavior;
}

let comboboxCount = 0;
