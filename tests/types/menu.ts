import { useMenu, type MenuItemProps } from "@nagi-labs/nagi-ui";

interface Action {
  key: "duplicate" | "rename";
  label: string;
  command: () => void;
}

declare const actions: readonly Action[];

const menu = useMenu({
  items: actions,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  onSelect(item) {
    item.command();
  },
});

declare const action: Action;
const props: MenuItemProps = menu.itemProps(action);
const role: "menuitem" = props.role;
const activeKey: "duplicate" | "rename" | null = menu.activeKey.value;

void role;
void activeKey;
