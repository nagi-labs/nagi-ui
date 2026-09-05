import {
  getCurrentInstance,
  nextTick,
  ref,
  toValue,
  useId,
  watch,
  type ComponentPublicInstance,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";

import { createElementRegistry } from "./element-registry.ts";
import type { MenuDirection } from "./menu.ts";

export type TabsOrientation = "horizontal" | "vertical";
export type TabsActivationMode = "manual" | "automatic";

export type TabsAccessibleName =
  | { label: string; labelledBy?: never }
  | { label?: never; labelledBy: string };

export type UseTabsOptions<Item, Key extends string = string> = TabsAccessibleName & {
  /** Items in visual order. Keys must be unique and stable across reorders. */
  items: MaybeRefOrGetter<readonly Item[]>;
  getKey: (item: Item) => Key;
  isDisabled?: (item: Item) => boolean;
  /** Controlled selection. Invalid values are canonicalized to an enabled tab. */
  selected?: Ref<Key | null>;
  /** Vue component model whose emitted write may precede the parent prop update. */
  model?: Ref<Key | null>;
  /** Initial uncontrolled selection. Defaults to the first enabled tab. */
  defaultSelected?: Key;
  onSelectionChange?: (key: Key | null) => void;
  /** Override the generated id (SSR-stable ids come from Vue's useId). */
  id?: string;
  /** Defaults to manual so asynchronously loaded panels do not delay arrow navigation. */
  activationMode?: TabsActivationMode;
  /** Defaults to horizontal. */
  orientation?: TabsOrientation;
  /** Logical reading direction for horizontal orientation. */
  dir?: MenuDirection;
  /** Wrap arrow focus at the ends. Defaults to true. */
  loop?: boolean;
};

export interface TabsListProps {
  ref: (element: Element | ComponentPublicInstance | null) => void;
  id: string;
  dir: MenuDirection;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-orientation"?: "vertical";
  onFocusout: (event: FocusEvent) => void;
}

export interface TabsTabProps {
  ref: (element: Element | ComponentPublicInstance | null) => void;
  id: string;
  type: "button";
  role: "tab";
  disabled: boolean;
  tabindex: 0 | -1;
  "aria-selected": "true" | "false";
  "aria-controls": string;
  onFocus: (event: FocusEvent) => void;
  onClick: (event: MouseEvent) => void;
  onKeydown: (event: KeyboardEvent) => void;
}

export interface TabsPanelProps {
  id: string;
  role: "tabpanel";
  tabindex: 0;
  hidden: boolean;
  "aria-labelledby": string;
}

export interface UseTabsReturn<Item, Key extends string = string> {
  id: string;
  /** Selection source of truth (the controlled ref when provided). */
  selectedKey: Ref<Key | null>;
  /** Current roving-focus target; differs from selection in manual mode. */
  focusedKey: Ref<Key | null>;
  select: (item: Item) => void;
  isSelected: (item: Item) => boolean;
  tablistProps: TabsListProps;
  tabProps: (item: Item) => TabsTabProps;
  panelProps: (item: Item) => TabsPanelProps;
}

interface TabsComponentItem {
  readonly key: string;
  readonly disabled?: boolean;
}

interface TabsComponentProps<Item extends TabsComponentItem> {
  readonly label: string;
  readonly id?: string | undefined;
  readonly items: readonly Item[];
  readonly activationMode: TabsActivationMode;
  readonly orientation: TabsOrientation;
  readonly dir: MenuDirection;
  readonly loop: boolean;
}

/**
 * Buffers a Vue component model so behavior code can write synchronously even
 * while a controlled parent still exposes the previous prop snapshot.
 */
function createTabsModelBridge<Key extends string>(model: Ref<Key | null>): Ref<Key | null> {
  const selected = ref<Key | null>(model.value) as Ref<Key | null>;

  function syncSelectedFromModel(value: Key | null) {
    selected.value = value;
  }

  function syncModelFromSelected(value: Key | null) {
    if (model.value !== value) model.value = value;
  }

  watch(model, syncSelectedFromModel, { flush: "sync" });
  watch(selected, syncModelFromSelected, { flush: "sync" });

  return selected;
}

interface ItemSnapshot<Key extends string> {
  key: Key;
  disabled: boolean;
}

let tabsCount = 0;

/**
 * Attribute-injection Tabs following the APG roving-tabindex pattern.
 * DOM focus lives on caller-owned native buttons; selection and panel
 * visibility stay distinct so manual activation remains possible.
 */
function createTabs<Item, Key extends string = string>(
  options: UseTabsOptions<Item, Key>,
): UseTabsReturn<Item, Key> {
  const instance = getCurrentInstance();
  const id = options.id ?? (instance ? useId() : `nagi-tabs-${tabsCount++}`);
  const activationMode = options.activationMode ?? "manual";
  const orientation = options.orientation ?? "horizontal";
  const direction = options.dir ?? "ltr";
  let tablistElement: HTMLElement | null = null;
  const tabElements = createElementRegistry<Key>();

  function items(): readonly Item[] {
    return toValue(options.items);
  }

  function keyOf(item: Item): Key {
    return options.getKey(item);
  }

  function isDisabled(item: Item): boolean {
    return options.isDisabled?.(item) ?? false;
  }

  function snapshot(): readonly ItemSnapshot<Key>[] {
    return items().map((item) => ({ key: keyOf(item), disabled: isDisabled(item) }));
  }

  function enabledItems(): readonly Item[] {
    return items().filter((item) => !isDisabled(item));
  }

  function enabledKeys(): readonly Key[] {
    return enabledItems().map(keyOf);
  }

  function tabId(key: Key): string {
    return `${id}-tab-${encodeURIComponent(key)}`;
  }

  function panelId(key: Key): string {
    return `${id}-panel-${encodeURIComponent(key)}`;
  }

  function initialSelection(): Key | null {
    const enabled = enabledKeys();
    if (options.defaultSelected !== undefined && enabled.includes(options.defaultSelected)) {
      return options.defaultSelected;
    }
    return enabled[0] ?? null;
  }

  const internalSelection = ref<Key | null>(initialSelection()) as Ref<Key | null>;
  const selectedKey = options.model
    ? createTabsModelBridge(options.model)
    : (options.selected ?? internalSelection);
  const focusedKey = ref<Key | null>(
    selectedKey.value !== null && enabledKeys().includes(selectedKey.value)
      ? selectedKey.value
      : (enabledKeys()[0] ?? null),
  ) as Ref<Key | null>;

  function writeSelection(next: Key | null) {
    if (selectedKey.value === next) return;
    selectedKey.value = next;
    options.onSelectionChange?.(next);
  }

  function isSelected(item: Item): boolean {
    return !isDisabled(item) && selectedKey.value === keyOf(item);
  }

  function select(item: Item) {
    if (isDisabled(item)) return;
    writeSelection(keyOf(item));
  }

  function tablistHasFocus(): boolean {
    if (!tablistElement) return false;
    const root = tablistElement.getRootNode();
    const active = "activeElement" in root ? (root as Document | ShadowRoot).activeElement : null;
    return active !== null && tablistElement.contains(active);
  }

  function focusItem(item: Item) {
    const key = keyOf(item);
    focusedKey.value = key;
    tabElements.get(key)?.focus({ preventScroll: true });
  }

  function handled(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  function moveFrom(item: Item, delta: -1 | 1): Item | undefined {
    const enabled = enabledItems();
    if (enabled.length === 0) return undefined;
    const current = enabled.findIndex((candidate) => keyOf(candidate) === keyOf(item));
    if (current === -1) return enabled[0];
    const candidate = current + delta;
    const index =
      options.loop === false
        ? Math.max(0, Math.min(candidate, enabled.length - 1))
        : (candidate + enabled.length) % enabled.length;
    return enabled[index];
  }

  function navigate(item: Item, next: Item | undefined) {
    if (!next || keyOf(next) === keyOf(item)) return;
    focusItem(next);
    if (activationMode === "automatic") select(next);
  }

  function fallbackKey(
    missing: Key | null,
    current: readonly ItemSnapshot<Key>[],
    previous: readonly ItemSnapshot<Key>[],
  ): Key | null {
    const enabled = current.filter((entry) => !entry.disabled);
    if (enabled.length === 0) return null;
    if (missing === null) return enabled[0]?.key ?? null;

    let index = current.findIndex((entry) => entry.key === missing);
    if (index === -1) index = previous.findIndex((entry) => entry.key === missing);
    if (index === -1) return enabled[0]?.key ?? null;

    const after = current.slice(index).find((entry) => !entry.disabled);
    if (after) return after.key;
    return (
      current
        .slice(0, index)
        .reverse()
        .find((entry) => !entry.disabled)?.key ?? null
    );
  }

  function reconcileCollection(
    current: readonly ItemSnapshot<Key>[],
    previous: readonly ItemSnapshot<Key>[] = [],
  ) {
    const enabled = current.filter((entry) => !entry.disabled).map((entry) => entry.key);
    const selected = selectedKey.value;
    const selectedIsValid = selected !== null && enabled.includes(selected);
    const focused = focusedKey.value;
    const focusedIsValid = focused !== null && enabled.includes(focused);
    const repairDomFocus = focused !== null && tabElements.get(focused)?.matches(":focus") === true;

    // Vue defineModel refs emit to the parent synchronously but may keep
    // exposing the old prop until the parent render returns. Keep using the
    // fallback calculated from this snapshot instead of re-reading the ref;
    // otherwise focus repair can activate the wrong tab in automatic mode.
    const canonicalSelection = selectedIsValid
      ? selected
      : fallbackKey(selected, current, previous);
    if (!selectedIsValid) writeSelection(canonicalSelection);
    const nextFocus =
      canonicalSelection !== null && enabled.includes(canonicalSelection)
        ? canonicalSelection
        : (enabled[0] ?? null);
    if (!focusedIsValid) focusedKey.value = nextFocus;
    tabElements.prune(current.map((entry) => entry.key));

    if (repairDomFocus && nextFocus !== null) {
      void nextTick(() => {
        tabElements.get(nextFocus)?.focus({ preventScroll: true });
      });
    }
  }

  function reconcileSelection(selected: Key | null) {
    const enabled = enabledKeys();
    if (selected === null || !enabled.includes(selected)) {
      writeSelection(fallbackKey(selected, snapshot(), snapshot()));
      return;
    }
    if (!tablistHasFocus()) focusedKey.value = selected;
  }

  watch(snapshot, reconcileCollection, { immediate: true, flush: "sync" });
  watch(selectedKey, reconcileSelection, { flush: "sync" });

  const tablistProps: TabsListProps = {
    ref: (element) => {
      tablistElement = element as HTMLElement | null;
    },
    id,
    dir: direction,
    ...(options.label === undefined ? {} : { "aria-label": options.label }),
    ...(options.labelledBy === undefined ? {} : { "aria-labelledby": options.labelledBy }),
    ...(orientation === "vertical" ? { "aria-orientation": "vertical" as const } : {}),
    onFocusout(event) {
      const list = event.currentTarget as HTMLElement | null;
      if (typeof list?.contains !== "function") return;
      if (event.relatedTarget && list.contains(event.relatedTarget as Node)) return;
      const selected = selectedKey.value;
      focusedKey.value =
        selected !== null && enabledKeys().includes(selected)
          ? selected
          : (enabledKeys()[0] ?? null);
    },
  };

  function tabProps(item: Item): TabsTabProps {
    const key = keyOf(item);
    const disabled = isDisabled(item);
    return {
      ref: tabElements.refFor(key),
      id: tabId(key),
      type: "button",
      role: "tab",
      disabled,
      tabindex: !disabled && focusedKey.value === key ? 0 : -1,
      "aria-selected": isSelected(item) ? "true" : "false",
      "aria-controls": panelId(key),
      onFocus() {
        if (disabled) return;
        focusedKey.value = key;
        if (activationMode === "automatic") select(item);
      },
      onClick(event) {
        if (disabled) {
          event.preventDefault();
          return;
        }
        focusedKey.value = key;
        select(item);
      },
      onKeydown(event) {
        if (disabled || event.altKey || event.ctrlKey || event.metaKey) return;

        const nextKey =
          orientation === "vertical"
            ? "ArrowDown"
            : direction === "rtl"
              ? "ArrowLeft"
              : "ArrowRight";
        const previousKey =
          orientation === "vertical" ? "ArrowUp" : direction === "rtl" ? "ArrowRight" : "ArrowLeft";

        if (event.key === nextKey || event.key === previousKey) {
          handled(event);
          navigate(item, moveFrom(item, event.key === nextKey ? 1 : -1));
          return;
        }
        if (event.key === "Home" || event.key === "End") {
          handled(event);
          const enabled = enabledItems();
          navigate(item, event.key === "Home" ? enabled[0] : enabled.at(-1));
          return;
        }
        if (activationMode === "manual" && (event.key === " " || event.key === "Enter")) {
          handled(event);
          select(item);
        }
      },
    };
  }

  function panelProps(item: Item): TabsPanelProps {
    const key = keyOf(item);
    return {
      id: panelId(key),
      role: "tabpanel",
      tabindex: 0,
      hidden: !isSelected(item),
      "aria-labelledby": tabId(key),
    };
  }

  return {
    id,
    selectedKey,
    focusedKey,
    select,
    isSelected,
    tablistProps,
    tabProps,
    panelProps,
  };
}

export function useTabs<Item, Key extends string = string>(
  options: UseTabsOptions<Item, Key>,
): UseTabsReturn<Item, Key>;
export function useTabs<Item extends TabsComponentItem>(
  props: TabsComponentProps<Item>,
  model: Ref<string | null>,
): UseTabsReturn<Item>;
/**
 * Uses either complete headless options, or the shipped flat-item contract.
 */
export function useTabs(
  optionsOrProps: UseTabsOptions<unknown> | TabsComponentProps<TabsComponentItem>,
  model?: Ref<string | null>,
): unknown {
  if (model === undefined) {
    return createTabs(optionsOrProps as UseTabsOptions<unknown>);
  }

  const props = optionsOrProps as TabsComponentProps<TabsComponentItem>;
  return createTabs<TabsComponentItem>({
    getKey: (item) => item.key,
    isDisabled: (item) => item.disabled ?? false,
    activationMode: props.activationMode,
    orientation: props.orientation,
    dir: props.dir,
    loop: props.loop,
    items: () => props.items,
    model,
    label: props.label,
    ...(props.id ? { id: props.id } : {}),
  });
}
