import { ref } from "vue";

import {
  useTabs,
  type TabsAccessibleName,
  type TabsActivationMode,
  type TabsListProps,
  type TabsOrientation,
  type TabsPanelProps,
  type TabsTabProps,
  type UseTabsOptions,
  type UseTabsReturn,
} from "@nagi-labs/nagi-ui";

interface Section {
  key: "overview" | "security";
  label: string;
  disabled?: boolean;
}

declare const sections: readonly Section[];
declare const section: Section;

const tabs = useTabs({
  items: sections,
  getKey: (item) => item.key,
  isDisabled: (item) => item.disabled ?? false,
  label: "Account sections",
  activationMode: "automatic",
  orientation: "vertical",
  dir: "rtl",
  onSelectionChange(key) {
    const _key: "overview" | "security" | null = key;
    void _key;
  },
});

const result: UseTabsReturn<Section, "overview" | "security"> = tabs;
const options: UseTabsOptions<Section, "overview" | "security"> = {
  items: () => sections,
  getKey: (item) => item.key,
  labelledBy: "account-heading",
  selected: ref<"overview" | "security" | null>("overview"),
  defaultSelected: "security",
};
const accessibleName: TabsAccessibleName = { labelledBy: "account-heading" };
const activationMode: TabsActivationMode = "manual";
const orientation: TabsOrientation = "horizontal";
const listProps: TabsListProps = tabs.tablistProps;
const tabProps: TabsTabProps = tabs.tabProps(section);
const panelProps: TabsPanelProps = tabs.panelProps(section);
const selected: "overview" | "security" | null = tabs.selectedKey.value;
const focused: "overview" | "security" | null = tabs.focusedKey.value;

useTabs({
  items: sections,
  getKey: (item) => item.key,
  label: "Account sections",
  // @ts-expect-error activationMode is a closed vocabulary
  activationMode: "instant",
});

useTabs({
  items: sections,
  getKey: (item) => item.key,
  label: "Account sections",
  // @ts-expect-error orientation is a closed vocabulary
  orientation: "diagonal",
});

useTabs({
  items: sections,
  getKey: (item) => item.key,
  label: "Account sections",
  // @ts-expect-error dir follows the ltr/rtl menu direction vocabulary
  dir: "auto",
});

useTabs<Section, "overview" | "security">({
  items: sections,
  getKey: (item) => item.key,
  label: "Account sections",
  // @ts-expect-error controlled selection must use the declared key union
  selected: ref<string | null>("overview"),
});

useTabs<Section, "overview" | "security">({
  items: sections,
  getKey: (item) => item.key,
  label: "Account sections",
  // @ts-expect-error default selection must use the declared key union
  defaultSelected: "billing",
});

// @ts-expect-error an accessible label or labelledBy relationship is required
useTabs({ items: sections, getKey: (item: Section) => item.key });

// @ts-expect-error label and labelledBy are mutually exclusive
useTabs({
  items: sections,
  getKey: (item) => item.key,
  label: "Account sections",
  labelledBy: "account-heading",
});

useTabs({
  items: sections,
  // @ts-expect-error tab keys must be strings because they form DOM ids
  getKey: (_item) => 1,
  label: "Account sections",
});

void result;
void options;
void accessibleName;
void activationMode;
void orientation;
void listProps;
void tabProps;
void panelProps;
void selected;
void focused;
