import { reactive } from "vue";

import { mergeElementProps } from "./merge-props.ts";

export interface LinkNavigationOptions {
  disabled?: boolean | undefined;
  target?: string | undefined;
  download?: string | boolean | undefined;
  navigate?: (() => void | Promise<unknown>) | undefined;
  prefetch?: (() => void | Promise<unknown>) | undefined;
}

export interface LinkInteractionProps {
  onClick: (event: MouseEvent) => void;
  onPointerenter: (event: PointerEvent) => void;
}

export interface SidebarLinkComponentProps extends LinkNavigationOptions {
  readonly href: string;
  readonly current: boolean;
  readonly rel?: string | undefined;
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

/** Compose router adaptation and intent prefetch for one native link destination. */
export function linkInteractionProps(
  item: LinkNavigationOptions,
  afterActivate?: () => void,
): LinkInteractionProps {
  return {
    onClick(event) {
      if (handleLinkClick(item, event)) afterActivate?.();
    },
    onPointerenter() {
      prefetchLink(item);
    },
  };
}

/** Connects the package SidebarLink's complete native anchor binding. */
export function useSidebarLink(
  props: SidebarLinkComponentProps,
  attrs: Readonly<Record<string, unknown>>,
) {
  const interaction = linkInteractionProps(props);

  return reactive({
    get anchorProps() {
      return mergeElementProps(
        attrs,
        {
          href: props.href,
          target: props.target,
          rel: props.rel,
          download: props.download,
          "aria-current": props.current ? "page" : undefined,
        },
        interaction,
      );
    },
  });
}
