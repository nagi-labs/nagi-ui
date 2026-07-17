import {
  getCurrentInstance,
  ref,
  toValue,
  useId,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";

import type { MenuDirection } from "./menu.ts";

export type ListboxSelectionMode = "single" | "multiple";
export type ListboxOrientation = "vertical" | "horizontal";

export interface UseListboxOptions<Item, Key extends string = string> {
  /** Items in visual order. Keys must be unique and stable across reorders. */
  items: MaybeRefOrGetter<readonly Item[]>;
  getKey: (item: Item) => Key;
  getTextValue: (item: Item) => string;
  isDisabled?: (item: Item) => boolean;
  /** Defaults to "single". Single mode keeps selection on the focused option. */
  mode?: ListboxSelectionMode;
  /**
   * Controlled selection. The array is the single source of truth; single
   * mode holds at most one key. Keys absent from items stay selected — the
   * selection belongs to the data, not to what is currently rendered.
   */
  selected?: Ref<readonly Key[]>;
  defaultSelected?: readonly Key[];
  onSelectionChange?: (keys: readonly Key[]) => void;
  /** Override the generated id (SSR-stable ids come from Vue's useId). */
  id?: string;
  /** Wrap ArrowUp/ArrowDown at the ends. Defaults to true. */
  loop?: boolean;
  /** Defaults to "vertical". Horizontal listboxes use ArrowLeft/ArrowRight. */
  orientation?: ListboxOrientation;
  /** Logical reading direction for horizontal orientation. */
  dir?: MenuDirection;
  /** Typeahead buffer reset delay. Defaults to 500ms. */
  typeaheadTimeout?: number;
}

export interface ListboxProps {
  id: string;
  role: "listbox";
  tabindex: 0;
  readonly "aria-activedescendant": string | undefined;
  "aria-multiselectable"?: "true";
  "aria-orientation"?: "horizontal";
  onKeydown: (event: KeyboardEvent) => void;
  onFocus: (event: FocusEvent) => void;
}

export interface ListboxOptionProps {
  id: string;
  role: "option";
  "aria-selected": "true" | "false";
  "aria-disabled"?: "true";
  "data-active"?: "";
  onClick: (event: MouseEvent) => void;
}

export interface UseListboxReturn<Item, Key extends string = string> {
  id: string;
  activeKey: Ref<Key | null>;
  /** The selection source of truth (the controlled ref when provided). */
  selectedKeys: Ref<readonly Key[]>;
  isSelected: (item: Item) => boolean;
  select: (item: Item) => void;
  clearSelection: () => void;
  listboxProps: ListboxProps;
  optionProps: (item: Item) => ListboxOptionProps;
}

let listboxCount = 0;

/**
 * Attribute-injection listbox using the APG aria-activedescendant focus
 * strategy shared with useMenu: DOM focus stays on the listbox container and
 * options are ordinary caller-owned elements.
 *
 * Selection model: single mode follows focus (arrows select, like a native
 * single-select list); multiple mode moves focus independently, Space/click
 * toggles, Shift+Arrow extends, Ctrl/Cmd+A toggles all enabled options.
 */
export function useListbox<Item, Key extends string = string>(
  options: UseListboxOptions<Item, Key>,
): UseListboxReturn<Item, Key> {
  const instance = getCurrentInstance();
  const id = options.id ?? (instance ? useId() : `nagi-listbox-${listboxCount++}`);
  const mode: ListboxSelectionMode = options.mode ?? "single";
  const orientation: ListboxOrientation = options.orientation ?? "vertical";
  const direction: MenuDirection = options.dir ?? "ltr";

  const activeKey = ref<Key | null>(null) as Ref<Key | null>;
  const internalSelection = ref<readonly Key[]>(options.defaultSelected ?? []) as Ref<
    readonly Key[]
  >;
  const selectedKeys = options.selected ?? internalSelection;

  let typeahead = "";
  let typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  function items(): readonly Item[] {
    return toValue(options.items);
  }

  function keyOf(item: Item): Key {
    return options.getKey(item);
  }

  function isDisabled(item: Item): boolean {
    return options.isDisabled?.(item) ?? false;
  }

  function enabledItems(): readonly Item[] {
    return items().filter((item) => !isDisabled(item));
  }

  function optionId(key: string): string {
    return `${id}-option-${encodeURIComponent(key)}`;
  }

  function setActive(item: Item | undefined) {
    activeKey.value = item === undefined ? null : keyOf(item);
  }

  function activeItem(): Item | undefined {
    return items().find((item) => keyOf(item) === activeKey.value);
  }

  function writeSelection(next: readonly Key[]) {
    selectedKeys.value = next;
    options.onSelectionChange?.(next);
  }

  function isSelected(item: Item): boolean {
    return selectedKeys.value.includes(keyOf(item));
  }

  function selectOnly(item: Item) {
    const key = keyOf(item);
    if (selectedKeys.value.length === 1 && selectedKeys.value[0] === key) return;
    writeSelection([key]);
  }

  function toggleSelection(item: Item) {
    const key = keyOf(item);
    const current = selectedKeys.value;
    writeSelection(
      current.includes(key) ? current.filter((existing) => existing !== key) : [...current, key],
    );
  }

  function addToSelection(item: Item) {
    const key = keyOf(item);
    if (selectedKeys.value.includes(key)) return;
    writeSelection([...selectedKeys.value, key]);
  }

  function select(item: Item) {
    if (isDisabled(item)) return;
    if (mode === "single") selectOnly(item);
    else toggleSelection(item);
  }

  function clearSelection() {
    if (selectedKeys.value.length === 0) return;
    writeSelection([]);
  }

  function toggleAll() {
    const enabled = enabledItems().map(keyOf);
    const allSelected =
      enabled.length > 0 && enabled.every((key) => selectedKeys.value.includes(key));
    writeSelection(allSelected ? [] : enabled);
  }

  /** Applies the mode's focus/selection coupling after keyboard navigation. */
  function afterNavigate(extend: boolean) {
    const item = activeItem();
    if (item === undefined) return;
    if (mode === "single") selectOnly(item);
    else if (extend) addToSelection(item);
  }

  function focusBoundary(next: "first" | "last") {
    const enabled = enabledItems();
    setActive(next === "first" ? enabled[0] : enabled.at(-1));
  }

  function move(delta: -1 | 1) {
    const enabled = enabledItems();
    if (enabled.length === 0) {
      setActive(undefined);
      return;
    }

    const current = enabled.findIndex((item) => keyOf(item) === activeKey.value);
    const fallback = delta === 1 ? -1 : 0;
    const next = current === -1 ? fallback + delta : current + delta;
    const index =
      options.loop === false
        ? Math.max(0, Math.min(next, enabled.length - 1))
        : (next + enabled.length) % enabled.length;
    setActive(enabled[index]);
  }

  function clearTypeahead() {
    typeahead = "";
    if (typeaheadTimer) clearTimeout(typeaheadTimer);
    typeaheadTimer = null;
  }

  function search(key: string) {
    if (typeaheadTimer) clearTimeout(typeaheadTimer);
    typeahead += key.toLocaleLowerCase();
    typeaheadTimer = setTimeout(clearTypeahead, options.typeaheadTimeout ?? 500);

    const enabled = enabledItems();
    if (enabled.length === 0) return;
    const current = enabled.findIndex((item) => keyOf(item) === activeKey.value);
    const ordered = [...enabled.slice(current + 1), ...enabled.slice(0, current + 1)];
    const first = typeahead[0] ?? "";
    const repeated = Array.from(typeahead).every((character) => character === first);
    const query = repeated ? first : typeahead;
    const match = ordered.find((item) =>
      options.getTextValue(item).trim().toLocaleLowerCase().startsWith(query),
    );
    if (match) {
      setActive(match);
      afterNavigate(false);
    }
  }

  function handled(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  const nextKey =
    orientation === "horizontal"
      ? direction === "rtl"
        ? "ArrowLeft"
        : "ArrowRight"
      : "ArrowDown";
  const previousKey =
    orientation === "horizontal"
      ? direction === "rtl"
        ? "ArrowRight"
        : "ArrowLeft"
      : "ArrowUp";

  function onKeydown(event: KeyboardEvent) {
    if (event.key === nextKey || event.key === previousKey) {
      handled(event);
      move(event.key === nextKey ? 1 : -1);
      afterNavigate(event.shiftKey);
      return;
    }

    switch (event.key) {
      case "Home":
        handled(event);
        focusBoundary("first");
        afterNavigate(event.shiftKey);
        return;
      case "End":
        handled(event);
        focusBoundary("last");
        afterNavigate(event.shiftKey);
        return;
      case " ":
      case "Enter": {
        handled(event);
        const item = activeItem();
        if (item !== undefined && !isDisabled(item)) {
          if (mode === "single") selectOnly(item);
          else toggleSelection(item);
        }
        return;
      }
      case "a":
      case "A":
        if (mode === "multiple" && (event.ctrlKey || event.metaKey)) {
          handled(event);
          toggleAll();
          return;
        }
        break;
    }

    if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      handled(event);
      search(event.key);
    }
  }

  function onFocus(event: FocusEvent) {
    if (event.target !== event.currentTarget) return;
    if (activeKey.value !== null) return;
    const enabled = enabledItems();
    const firstSelected = enabled.find((item) => isSelected(item));
    setActive(firstSelected ?? enabled[0]);
  }

  watch(
    () => enabledItems().map(keyOf),
    (keys) => {
      if (activeKey.value !== null && !keys.includes(activeKey.value)) {
        // The active option left the list: park visual focus on the first
        // enabled option without touching the selection.
        setActive(enabledItems()[0]);
      }
    },
  );

  const listboxProps: ListboxProps = {
    id,
    role: "listbox",
    tabindex: 0,
    get "aria-activedescendant"() {
      return activeKey.value === null ? undefined : optionId(activeKey.value);
    },
    ...(mode === "multiple" ? { "aria-multiselectable": "true" as const } : {}),
    ...(orientation === "horizontal" ? { "aria-orientation": "horizontal" as const } : {}),
    onKeydown,
    onFocus,
  };

  function optionProps(item: Item): ListboxOptionProps {
    const key = keyOf(item);
    const disabled = isDisabled(item);
    return {
      id: optionId(key),
      role: "option",
      "aria-selected": isSelected(item) ? "true" : "false",
      ...(disabled ? { "aria-disabled": "true" as const } : {}),
      ...(activeKey.value === key ? { "data-active": "" as const } : {}),
      onClick: (event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        setActive(item);
        if (mode === "single") selectOnly(item);
        else toggleSelection(item);
      },
    };
  }

  return {
    id,
    activeKey,
    selectedKeys,
    isSelected,
    select,
    clearSelection,
    listboxProps,
    optionProps,
  };
}
