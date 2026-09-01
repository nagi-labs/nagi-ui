import type { Ref } from "vue";

export interface PaginationBehaviorItem {
  key: string;
  disabled?: boolean;
}

export interface UsePaginationOptions<Item extends PaginationBehaviorItem> {
  onSelect?: (item: Item) => void;
}

export interface UsePaginationReturn<Item extends PaginationBehaviorItem> {
  isCurrent: (item: Item) => boolean;
  selectButton: (item: Item) => void;
  selectLink: (item: Item) => void;
}

/** Keeps controlled page selection distinct from native link navigation. */
export function usePagination<Item extends PaginationBehaviorItem>(
  options: UsePaginationOptions<Item>,
  currentKey: Ref<string>,
): UsePaginationReturn<Item> {
  const notify = (item: Item) => {
    if (!item.disabled) options.onSelect?.(item);
  };

  return {
    isCurrent: (item) => item.key === currentKey.value,
    selectButton(item) {
      if (item.disabled) return;
      currentKey.value = item.key;
      notify(item);
    },
    selectLink: notify,
  };
}
