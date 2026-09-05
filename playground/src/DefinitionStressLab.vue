<script setup lang="ts">
import { useMenu, useSubmenu } from "@nagi-labs/nagi-ui";
import { NDatePicker, NDropdownMenu, type DropdownMenuNode } from "@nagi-labs/nagi-ui/components";
import { computed, ref } from "vue";

import OwnedDatePickerContractFixture from "./OwnedDatePickerContractFixture.vue";

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
const ownedSubmenuItems: readonly OwnedMenuItem[] = [{ key: "copy", label: "Owned Copy link" }];
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
const packageDateSubmission = ref("not submitted");
const ownedDateSubmission = ref("not submitted");
const packageDateInvalid = ref(false);
const ownedDateInvalid = ref(false);
const ownedDateOpen = ref(false);
const packageNavigationDate = ref<string | null>("2026-07-24");
const ownedNavigationDate = ref<string | null>("2026-07-24");
const packageDisabledDate = ref<string | null>("2026-07-24");
const ownedDisabledDate = ref<string | null>("2026-07-24");
const packageReadOnlyDate = ref<string | null>("2026-07-24");
const ownedReadOnlyDate = ref<string | null>("2026-07-24");
const packageControlledDateSource = ref<string | null>("2026-07-24");
const packageControlledOpenSource = ref(false);
const packageControlledDateRequests = ref(0);
const packageControlledOpenRequests = ref(0);
const packageControlledDate = computed({
  get: () => packageControlledDateSource.value,
  set: () => {
    packageControlledDateRequests.value += 1;
  },
});
const packageControlledOpen = computed({
  get: () => packageControlledOpenSource.value,
  set: () => {
    packageControlledOpenRequests.value += 1;
  },
});
const ownedControlledDateSource = ref<string | null>("2026-07-24");
const ownedControlledOpenSource = ref(false);
const ownedControlledDateRequests = ref(0);
const ownedControlledOpenRequests = ref(0);
const ownedControlledDate = computed({
  get: () => ownedControlledDateSource.value,
  set: () => {
    ownedControlledDateRequests.value += 1;
  },
});
const ownedControlledOpen = computed({
  get: () => ownedControlledOpenSource.value,
  set: () => {
    ownedControlledOpenRequests.value += 1;
  },
});

function submitPackageDate(event: SubmitEvent) {
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  packageDateSubmission.value = JSON.stringify(Object.fromEntries(new FormData(form)));
}

function submitOwnedDate(event: SubmitEvent) {
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  ownedDateSubmission.value = JSON.stringify(Object.fromEntries(new FormData(form)));
}
</script>

<template>
  <main>
    <section aria-label="Package Menu Definition fixture">
      <n-dropdown-menu
        label="Package project actions"
        :items="packageMenuItems"
      />
      <output
        role="status"
        aria-label="Package menu action"
        >{{ packageMenuAction }}</output
      >
      <output
        role="status"
        aria-label="Package grid state"
        >{{ packageGrid }}</output
      >
    </section>

    <section aria-label="Owned Menu Definition fixture">
      <div
        data-scope="dropdown-menu"
        data-part="root"
      >
        <div class="owned-trigger-layout">
          <button
            v-bind="ownedMenu.triggerProps"
            data-scope="dropdown-menu"
            data-part="trigger"
            type="button"
          >
            Owned project actions
          </button>
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
                v-bind="
                  ownedMenu.itemProps(ownedMenuItems[0] as OwnedMenuItem, {
                    onSelect: () => (ownedMenuAction = 'new'),
                  })
                "
                type="button"
              >
                Owned New
              </button>
            </li>
            <li role="none">
              <button
                v-bind="
                  ownedMenu.checkboxItemProps(ownedMenuItems[1] as OwnedMenuItem, {
                    checked: ownedGrid,
                    onCheckedChange: (checked) => (ownedGrid = checked),
                  })
                "
                type="button"
              >
                Owned Grid
              </button>
            </li>
            <li role="none">
              <button
                v-bind="ownedMenu.itemProps(ownedMenuItems[2] as OwnedMenuItem)"
                type="button"
              >
                Owned Archive
              </button>
            </li>
            <li
              data-scope="dropdown-menu"
              data-part="submenu-root"
              role="none"
            >
              <div class="owned-submenu-trigger-layout">
                <button
                  v-bind="
                    ownedMenu.submenuTriggerProps(ownedMenuItems[3] as OwnedMenuItem, ownedSubmenu)
                  "
                  data-scope="dropdown-menu"
                  data-part="submenu-trigger"
                  type="button"
                >
                  Owned Share
                </button>
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
                      v-bind="
                        ownedSubmenu.itemProps(ownedSubmenuItems[0] as OwnedMenuItem, {
                          onSelect: () => (ownedMenuAction = 'copy'),
                        })
                      "
                      type="button"
                    >
                      Owned Copy link
                    </button>
                  </li>
                </ul>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <output
        role="status"
        aria-label="Owned menu action"
        >{{ ownedMenuAction }}</output
      >
      <output
        role="status"
        aria-label="Owned grid state"
        >{{ ownedGrid }}</output
      >
    </section>

    <section aria-label="Package DatePicker Definition fixture">
      <n-date-picker
        v-model="packageDate"
        label="Package delivery date"
        calendar-label="Package delivery date calendar"
        trigger-label="Choose package delivery date"
        name="packageDeliveryDate"
        form="package-date-form"
        locale="en-US"
        time-zone="UTC"
        default-visible-month="2026-07-24"
        min="2026-07-24"
        max="2026-07-27"
        :unavailable-dates="['2026-07-26']"
        required
        :invalid="packageDateInvalid"
        validation-message="Package delivery date is invalid."
      />
      <form
        id="package-date-form"
        aria-label="Package date form"
        @submit.prevent="submitPackageDate"
      >
        <button type="submit">Submit package date</button>
      </form>
      <output
        role="status"
        aria-label="Package date model"
        >{{ packageDate }}</output
      >
      <output
        role="status"
        aria-label="Package date submission"
        >{{ packageDateSubmission }}</output
      >
      <button
        type="button"
        @click="packageDate = null"
      >
        Clear package date
      </button>
      <button
        type="button"
        @click="packageDateInvalid = true"
      >
        Invalidate package date
      </button>
      <button type="button">Outside package DatePicker</button>
    </section>

    <section aria-label="Owned DatePicker Definition fixture">
      <OwnedDatePickerContractFixture
        v-model="ownedDate"
        v-model:open="ownedDateOpen"
        label="Owned delivery date"
        calendar-label="Owned delivery date calendar"
        trigger-label="Choose owned delivery date"
        name="ownedDeliveryDate"
        form="owned-date-form"
        locale="en-US"
        time-zone="UTC"
        default-visible-month="2026-07-24"
        min="2026-07-24"
        max="2026-07-27"
        :unavailable-dates="['2026-07-26']"
        required
        :invalid="ownedDateInvalid"
        validation-message="Owned delivery date is invalid."
      />
      <form
        id="owned-date-form"
        aria-label="Owned date form"
        @submit.prevent="submitOwnedDate"
      >
        <button type="submit">Submit owned date</button>
      </form>
      <output
        role="status"
        aria-label="Owned date model"
        >{{ ownedDate }}</output
      >
      <output
        role="status"
        aria-label="Owned date submission"
        >{{ ownedDateSubmission }}</output
      >
      <button
        type="button"
        @click="ownedDate = null"
      >
        Clear owned date
      </button>
      <button
        type="button"
        @click="ownedDateInvalid = true"
      >
        Invalidate owned date
      </button>
      <button type="button">Outside owned DatePicker</button>
    </section>

    <section aria-label="Package DatePicker keyboard fixture">
      <n-date-picker
        v-model="packageNavigationDate"
        label="Package keyboard date"
        calendar-label="Package keyboard date calendar"
        trigger-label="Choose package keyboard date"
        locale="en-US"
        time-zone="UTC"
        default-visible-month="2026-07-24"
      />
    </section>

    <section aria-label="Owned DatePicker keyboard fixture">
      <OwnedDatePickerContractFixture
        v-model="ownedNavigationDate"
        label="Owned keyboard date"
        calendar-label="Owned keyboard date calendar"
        trigger-label="Choose owned keyboard date"
        locale="en-US"
        time-zone="UTC"
        default-visible-month="2026-07-24"
      />
    </section>

    <section aria-label="Package DatePicker state fixtures">
      <n-date-picker
        v-model="packageDisabledDate"
        label="Package disabled date"
        calendar-label="Package disabled date calendar"
        trigger-label="Choose package disabled date"
        locale="en-US"
        time-zone="UTC"
        disabled
      />
      <output
        role="status"
        aria-label="Package disabled date model"
        >{{ packageDisabledDate }}</output
      >
      <button
        type="button"
        @click="packageDisabledDate = '2026-07-25'"
      >
        Set package disabled date to July 25
      </button>

      <n-date-picker
        v-model="packageReadOnlyDate"
        label="Package readonly date"
        calendar-label="Package readonly date calendar"
        trigger-label="Choose package readonly date"
        locale="en-US"
        time-zone="UTC"
        read-only
      />
      <output
        role="status"
        aria-label="Package readonly date model"
        >{{ packageReadOnlyDate }}</output
      >

      <n-date-picker
        v-model="packageControlledDate"
        v-model:open="packageControlledOpen"
        label="Package controlled date"
        calendar-label="Package controlled date calendar"
        trigger-label="Choose package controlled date"
        locale="en-US"
        time-zone="UTC"
      />
      <output
        role="status"
        aria-label="Package controlled date model"
        >{{ packageControlledDateSource }}</output
      >
      <output
        role="status"
        aria-label="Package controlled date open"
        >{{ packageControlledOpenSource }}</output
      >
      <output
        role="status"
        aria-label="Package controlled date requests"
        >{{ packageControlledDateRequests }}</output
      >
      <output
        role="status"
        aria-label="Package controlled open requests"
        >{{ packageControlledOpenRequests }}</output
      >
      <button
        type="button"
        @click="packageControlledOpenSource = true"
      >
        Accept package controlled date open
      </button>
      <button
        type="button"
        @click="packageControlledOpenSource = false"
      >
        Accept package controlled date close
      </button>
    </section>

    <section aria-label="Owned DatePicker state fixtures">
      <OwnedDatePickerContractFixture
        v-model="ownedDisabledDate"
        label="Owned disabled date"
        calendar-label="Owned disabled date calendar"
        trigger-label="Choose owned disabled date"
        locale="en-US"
        time-zone="UTC"
        disabled
      />
      <output
        role="status"
        aria-label="Owned disabled date model"
        >{{ ownedDisabledDate }}</output
      >
      <button
        type="button"
        @click="ownedDisabledDate = '2026-07-25'"
      >
        Set owned disabled date to July 25
      </button>

      <OwnedDatePickerContractFixture
        v-model="ownedReadOnlyDate"
        label="Owned readonly date"
        calendar-label="Owned readonly date calendar"
        trigger-label="Choose owned readonly date"
        locale="en-US"
        time-zone="UTC"
        read-only
      />
      <output
        role="status"
        aria-label="Owned readonly date model"
        >{{ ownedReadOnlyDate }}</output
      >

      <OwnedDatePickerContractFixture
        v-model="ownedControlledDate"
        v-model:open="ownedControlledOpen"
        label="Owned controlled date"
        calendar-label="Owned controlled date calendar"
        trigger-label="Choose owned controlled date"
        locale="en-US"
        time-zone="UTC"
      />
      <output
        role="status"
        aria-label="Owned controlled date model"
        >{{ ownedControlledDateSource }}</output
      >
      <output
        role="status"
        aria-label="Owned controlled date open"
        >{{ ownedControlledOpenSource }}</output
      >
      <output
        role="status"
        aria-label="Owned controlled date requests"
        >{{ ownedControlledDateRequests }}</output
      >
      <output
        role="status"
        aria-label="Owned controlled open requests"
        >{{ ownedControlledOpenRequests }}</output
      >
      <button
        type="button"
        @click="ownedControlledOpenSource = true"
      >
        Accept owned controlled date open
      </button>
      <button
        type="button"
        @click="ownedControlledOpenSource = false"
      >
        Accept owned controlled date close
      </button>
    </section>
  </main>
</template>
