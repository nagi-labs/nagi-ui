/**
 * Blueprint-local dropdown schema (CHARTER §3.5 / Phase 2.6).
 *
 * While DropdownMenu is consumed as a package component, this union is that
 * component's minimal props API, versioned with the component — new node
 * kinds are not added speculatively. After `own`, the union is yours: extend
 * it together with the renderer by adding a union member here, a template
 * branch in DropdownMenuItem.vue, and its CSS block, then run
 * `nagi-css check`. See docs/phase2.6-dropdown-schema.md for the full recipe.
 *
 * Keys must be unique within one menu level (radio item keys included).
 */

export interface DropdownMenuActionNode {
  type: "action";
  key: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  variant?: "danger";
  /** Defaults to true: activating an action closes the whole tree. */
  closeOnSelect?: boolean;
  onSelect: () => void;
}

export interface DropdownMenuLinkNode {
  type: "link";
  key: string;
  label: string;
  href: string;
  /** Optional SPA-router activation. The renderer still owns a real `<a href>`. */
  navigate?: () => void | Promise<unknown>;
  /** Optional intent prefetch, called on pointer entry. */
  prefetch?: () => void | Promise<unknown>;
  shortcut?: string;
  disabled?: boolean;
  /** Defaults to true: following a link closes the whole tree. */
  closeOnSelect?: boolean;
}

export interface DropdownMenuCheckboxNode {
  type: "checkbox";
  key: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  checked: boolean | "mixed";
  /** Defaults to false so several choices can be changed in one visit. */
  closeOnSelect?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export interface DropdownMenuRadioItem {
  key: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownMenuRadioGroupNode {
  type: "radio-group";
  key: string;
  label?: string;
  value: string;
  /** Defaults to false so the new choice remains visible. */
  closeOnSelect?: boolean;
  onValueChange: (value: string) => void;
  items: readonly DropdownMenuRadioItem[];
}

export interface DropdownMenuSeparatorNode {
  type: "separator";
  key: string;
}

export interface DropdownMenuGroupNode {
  type: "group";
  key: string;
  label?: string;
  items: readonly DropdownMenuGroupChildNode[];
}

export interface DropdownMenuSubmenuNode {
  type: "submenu";
  key: string;
  label: string;
  disabled?: boolean;
  items: readonly DropdownMenuNode[];
}

/** Groups do not nest: a group accepts every node type except another group. */
export type DropdownMenuGroupChildNode =
  | DropdownMenuActionNode
  | DropdownMenuLinkNode
  | DropdownMenuCheckboxNode
  | DropdownMenuRadioGroupNode
  | DropdownMenuSeparatorNode
  | DropdownMenuSubmenuNode;

export type DropdownMenuNode = DropdownMenuGroupChildNode | DropdownMenuGroupNode;

/**
 * One keyboard-selectable item handed to useMenu(). Entries are rebuilt on
 * every items recompute; core identifies items by key, so identity churn is
 * safe (menu.ts keys all state through getKey).
 */
export type DropdownMenuEntry =
  | { kind: "action"; key: string; label: string; disabled: boolean; node: DropdownMenuActionNode }
  | { kind: "link"; key: string; label: string; disabled: boolean; node: DropdownMenuLinkNode }
  | {
      kind: "checkbox";
      key: string;
      label: string;
      disabled: boolean;
      node: DropdownMenuCheckboxNode;
    }
  | {
      kind: "radio";
      key: string;
      label: string;
      disabled: boolean;
      group: DropdownMenuRadioGroupNode;
      item: DropdownMenuRadioItem;
    }
  | {
      kind: "submenu";
      key: string;
      label: string;
      disabled: boolean;
      node: DropdownMenuSubmenuNode;
    };

export function actionEntry(node: DropdownMenuActionNode): DropdownMenuEntry {
  return { kind: "action", key: node.key, label: node.label, disabled: node.disabled ?? false, node };
}

export function linkEntry(node: DropdownMenuLinkNode): DropdownMenuEntry {
  return { kind: "link", key: node.key, label: node.label, disabled: node.disabled ?? false, node };
}

export function checkboxEntry(node: DropdownMenuCheckboxNode): DropdownMenuEntry {
  return {
    kind: "checkbox",
    key: node.key,
    label: node.label,
    disabled: node.disabled ?? false,
    node,
  };
}

export function radioEntry(
  group: DropdownMenuRadioGroupNode,
  item: DropdownMenuRadioItem,
): DropdownMenuEntry {
  return {
    kind: "radio",
    key: item.key,
    label: item.label,
    disabled: item.disabled ?? false,
    group,
    item,
  };
}

export function submenuEntry(node: DropdownMenuSubmenuNode): DropdownMenuEntry {
  return {
    kind: "submenu",
    key: node.key,
    label: node.label,
    disabled: node.disabled ?? false,
    node,
  };
}

/**
 * Flattens one menu level into its keyboard-selectable entries in visual
 * order. Separators and group labels are presentational; radio groups expand
 * to their individual items; submenu children belong to the child menu and are
 * not included.
 */
export function menuEntries(nodes: readonly DropdownMenuNode[]): DropdownMenuEntry[] {
  const entries: DropdownMenuEntry[] = [];
  for (const node of nodes) {
    switch (node.type) {
      case "action":
        entries.push(actionEntry(node));
        break;
      case "link":
        entries.push(linkEntry(node));
        break;
      case "checkbox":
        entries.push(checkboxEntry(node));
        break;
      case "radio-group":
        for (const item of node.items) entries.push(radioEntry(node, item));
        break;
      case "group":
        entries.push(...menuEntries(node.items));
        break;
      case "submenu":
        entries.push(submenuEntry(node));
        break;
      case "separator":
        break;
    }
  }
  return entries;
}
