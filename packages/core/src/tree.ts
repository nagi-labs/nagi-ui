import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  ref,
  toValue,
  useId,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import type { WritableRef } from "./model-sync.ts";

export interface TreeEntry<Item, Key extends string = string> {
  item: Item;
  key: Key;
  parentKey: Key | null;
  level: number;
  position: number;
  setSize: number;
  hasChildren: boolean;
  disabled: boolean;
  loading: boolean;
}

export interface UseTreeOptions<Item, Key extends string = string> {
  items: MaybeRefOrGetter<readonly Item[]>;
  getKey: (item: Item) => Key;
  getChildren: (item: Item) => readonly Item[] | undefined;
  hasChildren?: (item: Item) => boolean;
  getTextValue: (item: Item) => string;
  isDisabled?: (item: Item) => boolean;
  isLoading?: (item: Item) => boolean;
  selected: WritableRef<Key | null>;
  expanded: WritableRef<readonly Key[]>;
  label: MaybeRefOrGetter<string>;
  onSelect?: (item: Item) => void;
  onExpandedChange?: (keys: readonly Key[]) => void;
  typeaheadTimeout?: number;
  id?: string;
}

export interface TreeProps {
  id: string;
  role: "tree";
  tabindex: 0;
  "aria-label": string;
  "aria-activedescendant"?: string | undefined;
  onFocus: (event: FocusEvent) => void;
  onKeydown: (event: KeyboardEvent) => void;
}

export interface TreeItemProps {
  id: string;
  role: "treeitem";
  "aria-level": number;
  "aria-posinset": number;
  "aria-setsize": number;
  "aria-label": string;
  "aria-selected": "true" | "false";
  "aria-expanded"?: "true" | "false";
  "aria-disabled"?: "true";
  "aria-busy"?: "true";
  "data-active"?: "";
  onClick: (event: MouseEvent) => void;
  onPointermove: (event: PointerEvent) => void;
}

export interface TreeGroupProps { role: "group" }

export interface TreeBinding<Item, Key extends string = string> {
  activeKey: Ref<Key | null>;
  selected: Ref<Key | null>;
  expanded: Ref<readonly Key[]>;
  visibleEntries: ComputedRef<readonly TreeEntry<Item, Key>[]>;
  treeProps: TreeProps;
  groupProps: TreeGroupProps;
  entryFor: (item: Item) => TreeEntry<Item, Key>;
  treeItemProps: (item: Item) => TreeItemProps;
  focusOwner: (event: Event) => void;
  activate: (item: Item) => void;
  toggle: (item: Item) => void;
}

interface TreeComponentItem {
  readonly key: string;
  readonly label: string;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly hasChildren?: boolean;
  readonly children?: readonly TreeComponentItem[];
}
export interface TreeComponentProps<Item extends TreeComponentItem> {
  readonly items: readonly Item[];
  readonly label: string;
}
export interface TreeComponentModel {
  selected: Ref<string | null>;
  expanded: Ref<readonly string[]>;
}

let treeCount = 0;

function createTree<Item, Key extends string>(
  options: UseTreeOptions<Item, Key>,
): TreeBinding<Item, Key> {
  const instance = getCurrentInstance();
  const id = options.id ?? (instance ? useId() : `nagi-tree-${treeCount++}`);
  const activeKey = ref<Key | null>(null) as Ref<Key | null>;
  let ownerDocument: Document | null = typeof document === "undefined" ? null : document;
  let typeahead = "";
  let typeaheadTimer: ReturnType<typeof setTimeout> | null = null;

  const keyOf = (item: Item) => options.getKey(item);
  const childrenOf = (item: Item) => options.getChildren(item) ?? [];
  const disabled = (item: Item) => options.isDisabled?.(item) ?? false;
  const loading = (item: Item) => options.isLoading?.(item) ?? false;
  const itemId = (key: Key) => `${id}-item-${encodeURIComponent(key)}`;

  const visibleEntries = computed<readonly TreeEntry<Item, Key>[]>(() => {
    const entries: TreeEntry<Item, Key>[] = [];
    const visit = (items: readonly Item[], parentKey: Key | null, level: number) => {
      items.forEach((item, index) => {
        const key = keyOf(item);
        const children = childrenOf(item);
        const entry: TreeEntry<Item, Key> = {
          item,
          key,
          parentKey,
          level,
          position: index + 1,
          setSize: items.length,
          hasChildren: options.hasChildren?.(item) ?? children.length > 0,
          disabled: disabled(item),
          loading: loading(item),
        };
        entries.push(entry);
        if (entry.hasChildren && options.expanded.value.includes(key)) visit(children, key, level + 1);
      });
    };
    visit(toValue(options.items), null, 1);
    return entries;
  });

  const entryMap = computed(() => new Map(visibleEntries.value.map((entry) => [entry.key, entry])));
  const enabledEntries = () => visibleEntries.value.filter((entry) => !entry.disabled);

  function entryFor(item: Item): TreeEntry<Item, Key> {
    const entry = entryMap.value.get(keyOf(item));
    if (!entry) throw new Error(`Tree item "${keyOf(item)}" is not visible.`);
    return entry;
  }

  function activeEntry() {
    return activeKey.value === null ? undefined : entryMap.value.get(activeKey.value);
  }

  function setActive(key: Key, scroll = false) {
    const entry = entryMap.value.get(key);
    if (!entry || entry.disabled) return;
    activeKey.value = key;
    if (scroll) queueMicrotask(() => ownerDocument?.getElementById(itemId(key))?.scrollIntoView({ block: "nearest" }));
  }

  function writeExpanded(next: readonly Key[]) {
    options.expanded.value = next;
    options.onExpandedChange?.(next);
  }

  function toggle(item: Item) {
    const entry = entryFor(item);
    if (entry.disabled || !entry.hasChildren || entry.loading) return;
    writeExpanded(options.expanded.value.includes(entry.key)
      ? options.expanded.value.filter((key) => key !== entry.key)
      : [...options.expanded.value, entry.key]);
  }

  function select(item: Item) {
    const entry = entryFor(item);
    if (entry.disabled) return;
    options.selected.value = entry.key;
    options.onSelect?.(item);
  }

  function activate(item: Item) {
    const entry = entryFor(item);
    if (!entry.disabled) setActive(entry.key);
  }

  function move(delta: -1 | 1) {
    const candidates = enabledEntries();
    if (candidates.length === 0) return;
    const current = candidates.findIndex((entry) => entry.key === activeKey.value);
    const index = Math.max(0, Math.min(current < 0 ? 0 : current + delta, candidates.length - 1));
    const entry = candidates[index];
    if (entry) setActive(entry.key, true);
  }

  function search(character: string) {
    if (typeaheadTimer) clearTimeout(typeaheadTimer);
    typeahead += character.toLocaleLowerCase();
    typeaheadTimer = setTimeout(() => {
      typeahead = "";
      typeaheadTimer = null;
    }, options.typeaheadTimeout ?? 500);
    const candidates = enabledEntries();
    const current = candidates.findIndex((entry) => entry.key === activeKey.value);
    const ordered = [...candidates.slice(current + 1), ...candidates.slice(0, current + 1)];
    const first = typeahead[0] ?? "";
    const query = Array.from(typeahead).every((value) => value === first) ? first : typeahead;
    const match = ordered.find((entry) =>
      options.getTextValue(entry.item).trim().toLocaleLowerCase().startsWith(query),
    );
    if (match) setActive(match.key, true);
  }

  function focusOwner(event: Event) {
    const target = event.currentTarget as HTMLElement | null;
    ownerDocument = target?.ownerDocument ?? ownerDocument;
    target?.closest<HTMLElement>("[role='tree']")?.focus({ preventScroll: true });
  }

  const treeProps: TreeProps = {
    id,
    role: "tree",
    tabindex: 0,
    get "aria-label"() { return toValue(options.label); },
    get "aria-activedescendant"() { return activeKey.value ? itemId(activeKey.value) : undefined; },
    onFocus(event) {
      ownerDocument = (event.currentTarget as HTMLElement | null)?.ownerDocument ?? ownerDocument;
      if (activeKey.value !== null) return;
      const candidates = enabledEntries();
      const target = candidates.find((entry) => entry.key === options.selected.value) ?? candidates[0];
      if (target) setActive(target.key);
    },
    onKeydown(event) {
      const active = activeEntry();
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        move(event.key === "ArrowDown" ? 1 : -1);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        const candidates = enabledEntries();
        const target = event.key === "Home" ? candidates[0] : candidates.at(-1);
        if (target) setActive(target.key, true);
      } else if (event.key === "ArrowRight" && active) {
        event.preventDefault();
        if (active.hasChildren && !options.expanded.value.includes(active.key)) toggle(active.item);
        else {
          const child = visibleEntries.value.find((entry) => entry.parentKey === active.key && !entry.disabled);
          if (child) setActive(child.key, true);
        }
      } else if (event.key === "ArrowLeft" && active) {
        event.preventDefault();
        if (active.hasChildren && options.expanded.value.includes(active.key)) toggle(active.item);
        else if (active.parentKey) setActive(active.parentKey, true);
      } else if ((event.key === "Enter" || event.key === " ") && active) {
        event.preventDefault();
        select(active.item);
      } else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        search(event.key);
      }
    },
  };

  watch(
    () => visibleEntries.value.map((entry) => ({ key: entry.key, disabled: entry.disabled })),
    (current, previous = []) => {
      if (current.some((entry) => entry.key === activeKey.value && !entry.disabled)) return;
      const previousKey = activeKey.value;
      const repairFocus = previousKey !== null
        && ownerDocument?.activeElement?.id === id;
      let index = current.findIndex((entry) => entry.key === previousKey);
      if (index === -1) index = previous.findIndex((entry) => entry.key === previousKey);
      const enabled = current.filter((entry) => !entry.disabled);
      const next = current.slice(Math.max(0, index)).find((entry) => !entry.disabled)
        ?? current.slice(0, Math.max(0, index)).toReversed().find((entry) => !entry.disabled)
        ?? enabled[0];
      if (next) setActive(next.key, repairFocus);
      else activeKey.value = null;
    },
    { flush: "sync", immediate: true },
  );

  if (instance) {
    onBeforeUnmount(() => {
      if (typeaheadTimer) clearTimeout(typeaheadTimer);
      typeaheadTimer = null;
    });
  }

  return {
    activeKey,
    selected: options.selected,
    expanded: options.expanded,
    visibleEntries,
    treeProps,
    groupProps: { role: "group" },
    entryFor,
    treeItemProps(item) {
      const entry = entryFor(item);
      return {
        id: itemId(entry.key),
        role: "treeitem",
        "aria-level": entry.level,
        "aria-posinset": entry.position,
        "aria-setsize": entry.setSize,
        "aria-label": options.getTextValue(item),
        "aria-selected": options.selected.value === entry.key ? "true" : "false",
        ...(entry.hasChildren ? { "aria-expanded": options.expanded.value.includes(entry.key) ? "true" as const : "false" as const } : {}),
        ...(entry.disabled ? { "aria-disabled": "true" as const } : {}),
        ...(entry.loading ? { "aria-busy": "true" as const } : {}),
        ...(activeKey.value === entry.key ? { "data-active": "" as const } : {}),
        onClick(event) {
          event.stopPropagation();
          focusOwner(event);
          if (entry.disabled) {
            event.preventDefault();
            return;
          }
          setActive(entry.key);
          select(item);
        },
        onPointermove(event) {
          event.stopPropagation();
          if (!entry.disabled) setActive(entry.key);
        },
      };
    },
    focusOwner,
    activate,
    toggle,
  };
}

export function useTree<Item, Key extends string = string>(
  options: UseTreeOptions<Item, Key>,
): TreeBinding<Item, Key>;
export function useTree<Item extends TreeComponentItem>(
  props: TreeComponentProps<Item>,
  model: TreeComponentModel,
): TreeBinding<Item, string>;
export function useTree<Item, Key extends string = string>(
  optionsOrProps: UseTreeOptions<Item, Key> | TreeComponentProps<Item & TreeComponentItem>,
  model?: TreeComponentModel,
): TreeBinding<Item, Key> {
  if (!model) return createTree(optionsOrProps as UseTreeOptions<Item, Key>);
  const props = optionsOrProps as TreeComponentProps<Item & TreeComponentItem>;
  return createTree<Item & TreeComponentItem, Key>({
    items: () => props.items,
    getKey: (item) => item.key as Key,
    getChildren: (item) => item.children as readonly (Item & TreeComponentItem)[] | undefined,
    hasChildren: (item) => item.hasChildren ?? (item.children?.length ?? 0) > 0,
    getTextValue: (item) => item.label,
    isDisabled: (item) => item.disabled ?? false,
    isLoading: (item) => item.loading ?? false,
    selected: model.selected as Ref<Key | null>,
    expanded: model.expanded as Ref<readonly Key[]>,
    label: () => props.label,
  }) as unknown as TreeBinding<Item, Key>;
}
