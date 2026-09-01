<script setup lang="ts">
import {
  useDatePicker,
  useMenu,
  useSubmenu,
} from "@nagi-labs/nagi-ui";
import {
  NDatePicker,
  NDropdownMenu,
  type DropdownMenuNode,
} from "@nagi-labs/nagi-ui/components";
import { computed, ref } from "vue";

const packageMenuAction = ref("none");
const packageGrid = ref(true);
const packageMenuItems = computed<readonly DropdownMenuNode[]>(() => [
  {
    type: "action",
    key: "new",
    label: "Package New",
    onSelect: () => (packageMenuAction.value = "new"),
  },
  {
    type: "checkbox",
    key: "grid",
    label: "Package Grid",
    checked: packageGrid.value,
    onCheckedChange: (checked) => (packageGrid.value = checked),
  },
  {
    type: "action",
    key: "archive",
    label: "Package Archive",
    disabled: true,
    onSelect: () => undefined,
  },
  {
    type: "submenu",
    key: "share",
    label: "Package Share",
    items: [
      {
        type: "action",
        key: "copy",
        label: "Package Copy link",
        onSelect: () => (packageMenuAction.value = "copy"),
      },
    ],
  },
]);

interface OwnedMenuItem {
  key: string;
  label: string;
  disabled?: boolean;
}

const ownedMenuItems: readonly OwnedMenuItem[] = [
  { key: "new", label: "Owned New" },
  { key: "grid", label: "Owned Grid" },
  { key: "archive", label: "Owned Archive", disabled: true },
  { key: "share", label: "Owned Share" },
];
const ownedSubmenuItems: readonly OwnedMenuItem[] = [
  { key: "copy", label: "Owned Copy link" },
];
const ownedMenuAction = ref("none");
const ownedGrid = ref(true);
const ownedMenu = useMenu({
  items: ownedMenuItems,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  isDisabled: (item) => item.disabled ?? false,
  anchor: true,
});
const ownedSubmenu = useSubmenu(ownedMenu, ownedMenuItems[3] as OwnedMenuItem, {
  items: ownedSubmenuItems,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
});

const packageDate = ref<string | null>("2026-07-24");
const ownedDate = ref<string | null>("2026-07-24");
const ownedDateOpen = ref(false);
const ownedDatePicker = useDatePicker({
  value: ownedDate,
  open: ownedDateOpen,
  label: "Owned delivery date",
  calendarLabel: "Owned delivery date calendar",
  locale: "en-US",
  timeZone: "UTC",
  defaultVisibleMonth: "2026-07-24",
  name: "ownedDeliveryDate",
});
</script>

<template>
  <main>
    <section aria-label="Package Menu Definition fixture">
      <n-dropdown-menu label="Package project actions" :items="packageMenuItems" />
      <output role="status" aria-label="Package menu action">{{ packageMenuAction }}</output>
      <output role="status" aria-label="Package grid state">{{ packageGrid }}</output>
    </section>

    <section aria-label="Owned Menu Definition fixture">
      <div data-scope="dropdown-menu" data-part="root">
        <div class="owned-trigger-layout">
          <button
            v-bind="ownedMenu.triggerProps"
            data-scope="dropdown-menu"
            data-part="trigger"
            type="button"
          >Owned project actions</button>
        </div>
        <div class="owned-popup-layout">
          <ul
            v-bind="ownedMenu.menuProps"
            data-scope="dropdown-menu"
            data-part="menu"
            popover
          >
            <li role="none">
              <button
                v-bind="ownedMenu.itemProps(ownedMenuItems[0] as OwnedMenuItem, {
                  onSelect: () => (ownedMenuAction = 'new'),
                })"
                type="button"
              >Owned New</button>
            </li>
            <li role="none">
              <button
                v-bind="ownedMenu.checkboxItemProps(ownedMenuItems[1] as OwnedMenuItem, {
                  checked: ownedGrid,
                  onCheckedChange: (checked) => (ownedGrid = checked),
                })"
                type="button"
              >Owned Grid</button>
            </li>
            <li role="none">
              <button
                v-bind="ownedMenu.itemProps(ownedMenuItems[2] as OwnedMenuItem)"
                type="button"
              >Owned Archive</button>
            </li>
            <li data-scope="dropdown-menu" data-part="submenu-root" role="none">
              <div class="owned-submenu-trigger-layout">
                <button
                  v-bind="ownedMenu.submenuTriggerProps(
                    ownedMenuItems[3] as OwnedMenuItem,
                    ownedSubmenu,
                  )"
                  data-scope="dropdown-menu"
                  data-part="submenu-trigger"
                  type="button"
                >Owned Share</button>
              </div>
              <div class="owned-submenu-layout">
                <ul
                  v-bind="ownedSubmenu.menuProps"
                  data-scope="dropdown-menu"
                  data-part="submenu"
                  popover
                >
                  <li role="none">
                    <button
                      v-bind="ownedSubmenu.itemProps(ownedSubmenuItems[0] as OwnedMenuItem, {
                        onSelect: () => (ownedMenuAction = 'copy'),
                      })"
                      type="button"
                    >Owned Copy link</button>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <output role="status" aria-label="Owned menu action">{{ ownedMenuAction }}</output>
      <output role="status" aria-label="Owned grid state">{{ ownedGrid }}</output>
    </section>

    <section aria-label="Package DatePicker Definition fixture">
      <n-date-picker
        v-model="packageDate"
        label="Package delivery date"
        calendar-label="Package delivery date calendar"
        trigger-label="Choose package delivery date"
        name="packageDeliveryDate"
        locale="en-US"
        time-zone="UTC"
        default-visible-month="2026-07-24"
      />
      <output role="status" aria-label="Package date model">{{ packageDate }}</output>
      <button type="button">Outside package DatePicker</button>
    </section>

    <section aria-label="Owned DatePicker Definition fixture">
      <div data-scope="date-picker" data-part="root">
        <div class="owned-field-layout">
          <div v-bind="ownedDatePicker.field.fieldProps" data-scope="date-picker" data-part="field">
            <span
              v-for="segment in ownedDatePicker.field.segments.value"
              :key="segment.key"
              v-bind="ownedDatePicker.field.segmentProps(segment)"
              data-scope="date-picker"
              data-part="segment"
            >{{ segment.text }}</span>
            <span class="owned-trigger-wrapper">
              <button
                v-bind="ownedDatePicker.popover.triggerProps"
                data-scope="date-picker"
                data-part="trigger"
                type="button"
                aria-label="Choose owned delivery date"
              >▦</button>
            </span>
            <input
              v-bind="ownedDatePicker.field.formValueProps"
              data-scope="date-picker"
              data-part="form-control"
            />
          </div>
        </div>
        <div class="owned-popup-wrapper">
          <div
            v-bind="ownedDatePicker.popover.popoverProps"
            data-scope="date-picker"
            data-part="popup"
            role="dialog"
            aria-label="Owned delivery date calendar"
            popover
          >
            <header>
              <button v-bind="ownedDatePicker.calendar.previousButtonProps">‹</button>
              <h2 aria-live="polite">{{ ownedDatePicker.calendar.monthLabel.value }}</h2>
              <button v-bind="ownedDatePicker.calendar.nextButtonProps">›</button>
            </header>
            <table
              v-bind="ownedDatePicker.calendar.gridProps"
              data-scope="date-picker"
              data-part="grid"
            >
              <thead><tr>
                <th
                  v-for="weekday in ownedDatePicker.calendar.weekdayLabels.value"
                  :key="weekday"
                  scope="col"
                >{{ weekday }}</th>
              </tr></thead>
              <tbody>
                <tr v-for="(week, index) in ownedDatePicker.calendar.weeks.value" :key="index">
                  <td
                    v-for="cell in week"
                    :key="cell.key"
                    v-bind="ownedDatePicker.calendar.gridCellProps(cell)"
                  ><button
                    v-bind="ownedDatePicker.calendar.cellButtonProps(cell)"
                    data-scope="date-picker"
                    data-part="day"
                  >{{ cell.day }}</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <output role="status" aria-label="Owned date model">{{ ownedDate }}</output>
      <button type="button">Outside owned DatePicker</button>
    </section>
  </main>
</template>
