export interface LinkNavigationOptions {
  disabled?: boolean | undefined;
  target?: string | undefined;
  download?: string | boolean | undefined;
  navigate?: (() => void | Promise<unknown>) | undefined;
  prefetch?: (() => void | Promise<unknown>) | undefined;
}

/** Preserve modified/native link activation while adapting a plain self-navigation to a router. */
export function handleLinkClick(item: LinkNavigationOptions, event: MouseEvent): boolean {
  if (item.disabled) return false;
  const modified =
    event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
  if (modified) return false;
  if (item.navigate && (!item.target || item.target === "_self") && item.download === undefined) {
    event.preventDefault();
    void item.navigate();
  }
  return true;
}

export function prefetchLink(item: LinkNavigationOptions) {
  if (!item.disabled) void item.prefetch?.();
}
