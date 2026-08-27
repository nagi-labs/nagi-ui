import {
  useMenu,
  useSubmenu,
  type MenuCheckboxItemProps,
  type MenuItemProps,
  type MenuRadioItemProps,
  type MenuSubmenuTriggerProps,
} from "@nagi-labs/nagi-ui";

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

const checkbox: MenuCheckboxItemProps = menu.checkboxItemProps(action, {
  checked: false,
  onCheckedChange(checked) {
    void checked;
  },
});
const radio: MenuRadioItemProps = menu.radioItemProps(action, {
  checked: true,
  onSelect() {},
});
const child = useSubmenu(menu, action, {
  items: actions,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
});
const submenuTrigger: MenuSubmenuTriggerProps = menu.submenuTriggerProps(action, child);

void role;
void activeKey;
void checkbox;
void radio;
void submenuTrigger;
