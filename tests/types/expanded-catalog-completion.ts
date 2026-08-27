import { computed, ref } from "vue";

import {
  useAutocomplete,
  useCarousel,
  useContextMenu,
  useMenubar,
  useMultiSelect,
  useNavigationMenu,
  useOTPField,
  useResizable,
  useTagsInput,
  useToolbar,
  useTree,
  type TreeComponentModel,
  type TreeGroupProps,
} from "@nagi-labs/nagi-ui";

const options = [{ key: "a", label: "Alpha" }, { key: "b", label: "Beta" }];
const text = ref("");
const keys = ref<readonly string[]>([]);
const open = ref(false);
const treeComponentModel: TreeComponentModel = {
  selected: ref<string | null>(null),
  expanded: keys,
};
const treeGroupProps: TreeGroupProps = { role: "group" };
void treeGroupProps;

useAutocomplete({ value: text, items: options, getKey: (item) => item.key, getTextValue: (item) => item.label });
useMultiSelect({ items: options, selected: keys, getKey: (item) => item.key, getTextValue: (item) => item.label, label: "Options" });
useTagsInput({ value: keys, label: "Tags" });
useOTPField({ value: text, label: "Code" });
useCarousel({ items: options, index: ref(0), label: "Slides" });
useResizable({ value: ref(50), label: "Panels" });
useToolbar({ items: options, getKey: (item) => item.key, label: "Tools" });
useContextMenu({ items: options, getKey: (item) => item.key, getTextValue: (item) => item.label });
useMenubar({
  menus: [{ key: "main", label: "Main", items: options }],
  getKey: (menu) => menu.key,
  getTextValue: (menu) => menu.label,
  getItems: (menu) => menu.items,
  getItemKey: (item) => item.key,
  getItemTextValue: (item) => item.label,
  label: "Application",
});
useNavigationMenu({ items: options, getKey: (item) => item.key, hasPanel: () => false, label: "Primary", open });
const treeItems = [{
  key: "root",
  label: "Root",
  children: [{ key: "child", label: "Child", children: [] }],
}];
useTree({
  items: treeItems,
  getKey: (item) => item.key,
  getChildren: (item) => item.children,
  getTextValue: (item) => item.label,
  selected: ref<string | null>(null),
  expanded: keys,
  label: "Files",
});
useTree(
  { items: treeItems, label: "Files" },
  treeComponentModel,
);

useTree({
  items: [{ key: 1, label: "Wrong" }],
  // @ts-expect-error Tree keys must be strings.
  getKey: (item) => item.key,
  getChildren: () => [],
  getTextValue: (item) => item.label,
  // @ts-expect-error The selected model must use the same string key type.
  selected: ref<number | null>(null),
  expanded: keys,
  label: "Wrong",
});

// @ts-expect-error The component overload requires an expanded string-key model.
useTree({ items: treeItems, label: "Files" }, { selected: ref<string | null>(null), expanded: ref([1]) });

// @ts-expect-error Collection models must be writable, not getter-only computed refs.
useTagsInput({ value: computed(() => keys.value), label: "Readonly" });

const contextBinding = useContextMenu({
  items: options,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
});
void contextBinding.contextTriggerProps;
// @ts-expect-error ContextMenu intentionally has no ordinary Menu trigger binding.
void contextBinding.triggerProps;

// @ts-expect-error Carousel's component overload requires a numeric model.
useCarousel({ items: options, label: "Slides", previousLabel: "Previous", nextLabel: "Next", loop: false, disabled: false }, ref("0"));

useMenubar({
  menus: [{ key: "main", label: "Main", items: options }],
  getKey: (menu) => menu.key,
  getTextValue: (menu) => menu.label,
  getItems: (menu) => menu.items,
  getItemKey: (item) => item.key,
  getItemTextValue: (item) => item.label,
  label: "Application",
  // @ts-expect-error Selection events may be non-pointer keyboard events or omitted.
  onSelect: (_item, event: MouseEvent) => void event,
});
