import {
  getCurrentInstance,
  ref,
  toValue,
  useId,
  watch,
  type ComponentPublicInstance,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { createElementRegistry } from "./element-registry.ts";

export type ToolbarOrientation = "horizontal" | "vertical";
export type ToolbarDirection = "ltr" | "rtl";

export interface UseToolbarOptions<Item, Key extends string = string> {
  items: MaybeRefOrGetter<readonly Item[]>;
  getKey: (item: Item) => Key;
  isDisabled?: (item: Item) => boolean;
  label: MaybeRefOrGetter<string>;
  orientation?: MaybeRefOrGetter<ToolbarOrientation | undefined>;
  dir?: MaybeRefOrGetter<ToolbarDirection | undefined>;
  loop?: MaybeRefOrGetter<boolean | undefined>;
  id?: string;
}

export interface ToolbarProps {
  id: string;
  role: "toolbar";
  "aria-label": string;
  "aria-orientation"?: "vertical" | undefined;
  onKeydown: (event: KeyboardEvent) => void;
}

export interface ToolbarItemProps {
  ref: (element: Element | ComponentPublicInstance | null) => void;
  id: string;
  tabindex: 0 | -1;
  onFocus: (event: FocusEvent) => void;
}

export interface ToolbarBinding<Item, Key extends string = string> {
  activeKey: Ref<Key | null>;
  toolbarProps: ToolbarProps;
  itemProps: (item: Item) => ToolbarItemProps;
  focusFirst: () => void;
}

interface ToolbarComponentItem {
  readonly key: string;
  readonly disabled?: boolean;
}

interface ToolbarItemSnapshot<Key extends string> {
  key: Key;
  disabled: boolean;
}

export interface ToolbarComponentProps<Item extends ToolbarComponentItem> {
  readonly items: readonly Item[];
  readonly label: string;
  readonly orientation: ToolbarOrientation;
  readonly dir: ToolbarDirection;
  readonly loop: boolean;
}

let toolbarCount = 0;

function createToolbar<Item, Key extends string>(
  options: UseToolbarOptions<Item, Key>,
): ToolbarBinding<Item, Key> {
  const instance = getCurrentInstance();
  const id = options.id ?? (instance ? useId() : `nagi-toolbar-${toolbarCount++}`);
  const activeKey = ref<Key | null>(null) as Ref<Key | null>;
  const itemElements = createElementRegistry<Key>();

  const items = () => toValue(options.items);
  const disabled = (item: Item) => options.isDisabled?.(item) ?? false;
  const enabled = () => items().filter((item) => !disabled(item));
  const keyOf = (item: Item) => options.getKey(item);
  const itemId = (item: Item) => `${id}-item-${encodeURIComponent(keyOf(item))}`;

  function focus(item: Item | undefined) {
    if (!item) return;
    activeKey.value = keyOf(item);
    const key = keyOf(item);
    queueMicrotask(() => itemElements.get(key)?.focus({ preventScroll: true }));
  }

  function focusFirst() {
    focus(enabled()[0]);
  }

  function move(delta: -1 | 1) {
    const candidates = enabled();
    if (candidates.length === 0) return;
    const current = candidates.findIndex((item) => keyOf(item) === activeKey.value);
    const raw = current < 0 ? (delta > 0 ? 0 : candidates.length - 1) : current + delta;
    const index = (toValue(options.loop) ?? true)
      ? (raw + candidates.length) % candidates.length
      : Math.max(0, Math.min(raw, candidates.length - 1));
    focus(candidates[index]);
  }

  const toolbarProps: ToolbarProps = {
    id,
    role: "toolbar",
    get "aria-label"() { return toValue(options.label); },
    get "aria-orientation"() {
      return (toValue(options.orientation) ?? "horizontal") === "vertical"
        ? "vertical"
        : undefined;
    },
    onKeydown(event) {
      const orientation = toValue(options.orientation) ?? "horizontal";
      const dir = toValue(options.dir) ?? "ltr";
      const previousKey = orientation === "vertical"
        ? "ArrowUp"
        : dir === "rtl" ? "ArrowRight" : "ArrowLeft";
      const nextKey = orientation === "vertical"
        ? "ArrowDown"
        : dir === "rtl" ? "ArrowLeft" : "ArrowRight";
      if (event.key === previousKey || event.key === nextKey) {
        event.preventDefault();
        move(event.key === previousKey ? -1 : 1);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const candidates = enabled();
        focus(event.key === "Home" ? candidates[0] : candidates.at(-1));
      }
    },
  };

  function collectionSnapshot(): readonly ToolbarItemSnapshot<Key>[] {
    return items().map((item) => ({ key: keyOf(item), disabled: disabled(item) }));
  }

  function reconcileCollection(
    current: readonly ToolbarItemSnapshot<Key>[],
    previousSnapshot: readonly ToolbarItemSnapshot<Key>[] = [],
  ) {
    if (current.some((item) => item.key === activeKey.value && !item.disabled)) return;
    const previousKey = activeKey.value;
    const previousElement = previousKey === null ? null : itemElements.get(previousKey);
    const previousRoot = previousElement?.getRootNode();
    const ownedFocus = previousElement !== null
      && previousRoot !== undefined
      && "activeElement" in previousRoot
      && (previousRoot as Document | ShadowRoot).activeElement === previousElement;
    let priorIndex = current.findIndex((item) => item.key === previousKey);
    if (priorIndex === -1) priorIndex = previousSnapshot.findIndex((item) => item.key === previousKey);
    const next = current.slice(Math.max(0, priorIndex)).find((item) => !item.disabled)
      ?? current.slice(0, Math.max(0, priorIndex)).reverse().find((item) => !item.disabled)
      ?? current.find((item) => !item.disabled);
    activeKey.value = next?.key ?? null;
    itemElements.prune(current.map((item) => item.key));
    if (ownedFocus && next) {
      queueMicrotask(() => itemElements.get(next.key)?.focus({ preventScroll: true }));
    }
  }

  watch(collectionSnapshot, reconcileCollection, { flush: "sync", immediate: true });

  return {
    activeKey,
    toolbarProps,
    itemProps(item) {
      return {
        ref: itemElements.refFor(keyOf(item)),
        id: itemId(item),
        get tabindex() { return activeKey.value === keyOf(item) && !disabled(item) ? 0 : -1; },
        onFocus() {
          if (!disabled(item)) activeKey.value = keyOf(item);
        },
      };
    },
    focusFirst,
  };
}

export function useToolbar<Item, Key extends string = string>(
  options: UseToolbarOptions<Item, Key>,
): ToolbarBinding<Item, Key>;
export function useToolbar<Item extends ToolbarComponentItem>(
  props: ToolbarComponentProps<Item>,
): ToolbarBinding<Item, string>;
export function useToolbar<Item, Key extends string = string>(
  optionsOrProps: UseToolbarOptions<Item, Key> | ToolbarComponentProps<Item & ToolbarComponentItem>,
): ToolbarBinding<Item, Key> {
  if ("getKey" in optionsOrProps) return createToolbar(optionsOrProps);
  const props = optionsOrProps;
  return createToolbar({
    items: () => props.items,
    getKey: (item) => item.key as Key,
    isDisabled: (item) => item.disabled ?? false,
    label: () => props.label,
    orientation: () => props.orientation,
    dir: () => props.dir,
    loop: () => props.loop,
  }) as unknown as ToolbarBinding<Item, Key>;
}
