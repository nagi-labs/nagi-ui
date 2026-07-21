import {
  type DropdownMenuActionNode,
  type DropdownMenuCheckboxNode,
  type DropdownMenuEntry,
  type DropdownMenuLinkNode,
  type DropdownMenuRadioGroupNode,
  type DropdownMenuRadioItem,
} from "./dropdown-schema.ts";

export function actionOptions(node: DropdownMenuActionNode) {
  return {
    onSelect: () => node.onSelect(),
    ...(node.closeOnSelect === undefined ? {} : { closeOnSelect: node.closeOnSelect }),
  };
}

export function checkboxOptions(node: DropdownMenuCheckboxNode) {
  return {
    checked: node.checked,
    onCheckedChange: node.onCheckedChange,
    ...(node.closeOnSelect === undefined ? {} : { closeOnSelect: node.closeOnSelect }),
  };
}

export function linkOptions(node: DropdownMenuLinkNode) {
  return {
    onSelect: (_entry: DropdownMenuEntry, event?: Event) => {
      // Keyboard activation has no native anchor default action because DOM
      // focus stays on the aria-activedescendant menu container.
      const pointerEvent = typeof MouseEvent !== "undefined" && event instanceof MouseEvent;
      const modifiedPointer =
        pointerEvent
        && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
      if (node.navigate && !modifiedPointer) {
        event?.preventDefault();
        void node.navigate();
      } else if (!node.navigate && event?.type === "keydown" && typeof window !== "undefined") {
        window.location.assign(node.href);
      }
    },
    ...(node.closeOnSelect === undefined ? {} : { closeOnSelect: node.closeOnSelect }),
  };
}

export function prefetchLink(node: DropdownMenuLinkNode) {
  if (!node.disabled) void node.prefetch?.();
}

export function radioOptions(
  group: DropdownMenuRadioGroupNode,
  item: DropdownMenuRadioItem,
) {
  return {
    checked: group.value === item.key,
    onSelect: () => group.onValueChange(item.key),
    ...(group.closeOnSelect === undefined ? {} : { closeOnSelect: group.closeOnSelect }),
  };
}
