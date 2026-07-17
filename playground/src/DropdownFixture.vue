<script setup lang="ts">
import { useId } from "vue";

import { useMenu, useSubmenu, type MenuDirection } from "@nagi-labs/nagi-ui";

export type DropdownSort = "name" | "modified";

interface DropdownItem {
  key: string;
  label: string;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    label: string;
    dir?: MenuDirection;
  }>(),
  { dir: "ltr" },
);

const showToolbar = defineModel<boolean>("showToolbar", { default: true });
const sortBy = defineModel<DropdownSort>("sortBy", { default: "name" });
const emit = defineEmits<{ action: [key: string] }>();

const duplicateItem = { key: "duplicate", label: "Duplicate" } satisfies DropdownItem;
const archiveItem = {
  key: "archive",
  label: "Archive",
  disabled: true,
} satisfies DropdownItem;
const toolbarItem = { key: "show-toolbar", label: "Show toolbar" } satisfies DropdownItem;
const sortNameItem = { key: "sort-name", label: "Sort by name" } satisfies DropdownItem;
const sortModifiedItem = {
  key: "sort-modified",
  label: "Sort by modified date",
} satisfies DropdownItem;
const shareItem = { key: "share", label: "Share" } satisfies DropdownItem;
const deleteItem = { key: "delete", label: "Delete" } satisfies DropdownItem;

const rootItems: readonly DropdownItem[] = [
  duplicateItem,
  archiveItem,
  toolbarItem,
  sortNameItem,
  sortModifiedItem,
  shareItem,
  deleteItem,
];

const copyLinkItem = { key: "copy-link", label: "Copy link" } satisfies DropdownItem;
const emailItem = { key: "email", label: "Email link" } satisfies DropdownItem;
const shareItems: readonly DropdownItem[] = [copyLinkItem, emailItem];

const menu = useMenu<DropdownItem>({
  items: rootItems,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  isDisabled: (item) => item.disabled ?? false,
  onSelect: (item) => emit("action", item.key),
  anchor: true,
  dir: props.dir,
});

const shareMenu = useSubmenu(menu, shareItem, {
  items: shareItems,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  onSelect: (item) => emit("action", item.key),
});

const fileLabelId = `${useId()}-file`;
const viewLabelId = `${useId()}-view`;

const toolbarOptions = {
  checked: () => showToolbar.value,
  onCheckedChange: (checked: boolean) => (showToolbar.value = checked),
};
const sortNameOptions = {
  checked: () => sortBy.value === "name",
  onSelect: () => (sortBy.value = "name" as const),
};
const sortModifiedOptions = {
  checked: () => sortBy.value === "modified",
  onSelect: () => (sortBy.value = "modified" as const),
};
</script>

<template>
  <div class="dropdown-fixture">
    <button class="button -trigger" type="button" v-bind="menu.triggerProps">
      {{ label }}
      <span class="icon -trigger" aria-hidden="true">⌄</span>
    </button>

    <ul class="list" popover v-bind="menu.menuProps">
      <li :id="fileLabelId" class="item -category" role="presentation">File</li>
      <li class="item" role="group" :aria-labelledby="fileLabelId">
        <ul class="list -items" role="presentation">
          <li class="item" role="none">
            <button class="button" type="button" v-bind="menu.itemProps(duplicateItem)">
              <span class="icon" aria-hidden="true"></span>
              <span class="text">Duplicate</span>
              <span class="text -shortcut" aria-hidden="true">⌘D</span>
            </button>
          </li>
          <li class="item" role="none">
            <button class="button" type="button" v-bind="menu.itemProps(archiveItem)">
              <span class="icon" aria-hidden="true"></span>
              <span class="text">Archive</span>
              <span class="text -shortcut" aria-hidden="true">⇧⌘A</span>
            </button>
          </li>
        </ul>
      </li>

      <li class="item" role="separator"></li>

      <li :id="viewLabelId" class="item -category" role="presentation">View</li>
      <li class="item" role="group" :aria-labelledby="viewLabelId">
        <ul class="list -items" role="presentation">
          <li class="item" role="none">
            <button
              class="button"
              type="button"
              v-bind="menu.checkboxItemProps(toolbarItem, toolbarOptions)"
            >
              <span class="icon -check" aria-hidden="true">✓</span>
              <span class="text">Show toolbar</span>
            </button>
          </li>
          <li class="item" role="none">
            <button
              class="button"
              type="button"
              v-bind="menu.radioItemProps(sortNameItem, sortNameOptions)"
            >
              <span class="icon -dot" aria-hidden="true">●</span>
              <span class="text">Sort by name</span>
            </button>
          </li>
          <li class="item" role="none">
            <button
              class="button"
              type="button"
              v-bind="menu.radioItemProps(sortModifiedItem, sortModifiedOptions)"
            >
              <span class="icon -dot" aria-hidden="true">●</span>
              <span class="text">Sort by modified date</span>
            </button>
          </li>
        </ul>
      </li>

      <li class="item" role="separator"></li>

      <li class="item" role="none">
        <button
          class="button"
          type="button"
          v-bind="menu.submenuTriggerProps(shareItem, shareMenu)"
        >
          <span class="icon" aria-hidden="true"></span>
          <span class="text">Share</span>
          <span class="icon -submenu" aria-hidden="true">›</span>
        </button>

        <ul class="list -submenu" popover v-bind="shareMenu.menuProps">
          <li class="item" role="none">
            <button class="button" type="button" v-bind="shareMenu.itemProps(copyLinkItem)">
              <span class="icon" aria-hidden="true"></span>
              <span class="text">Copy link</span>
              <span class="text -shortcut" aria-hidden="true">⌘L</span>
            </button>
          </li>
          <li class="item" role="none">
            <button class="button" type="button" v-bind="shareMenu.itemProps(emailItem)">
              <span class="icon" aria-hidden="true"></span>
              <span class="text">Email link</span>
            </button>
          </li>
        </ul>
      </li>

      <li class="item" role="separator"></li>

      <li class="item" role="none">
        <button class="button -danger" type="button" v-bind="menu.itemProps(deleteItem)">
          <span class="icon" aria-hidden="true"></span>
          <span class="text">Delete</span>
          <span class="text -shortcut" aria-hidden="true">⌫</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.dropdown-fixture {
  display: inline-block;

  > .button {
    &.-trigger {
      display: inline-flex;
      gap: 0.5rem;
      align-items: center;
      padding: 0.5rem 0.8rem;
      border: 1px solid #b9cbd1;
      border-radius: 0.55rem;
      background: #fff;
      color: #17323b;
      font: inherit;
      font-weight: 650;
      cursor: pointer;

      &:hover,
      &[aria-expanded="true"] {
        background: #edf5f7;
      }

      > .icon {
        color: #61777e;
        line-height: 1;
      }
    }
  }

  > .list {
    min-inline-size: 16rem;
    margin: 0;
    padding: 0.4rem;
    border: 1px solid #c8d8dd;
    border-radius: 0.65rem;
    outline: none;
    background: #fff;
    box-shadow: 0 14px 36px rgb(22 48 60 / 0.2);
    color: #17323b;
    list-style: none;
    opacity: 0;
    transform: translateY(-0.35rem) scale(0.98);
    transform-origin: top;
    transition:
      opacity 0.14s,
      transform 0.14s,
      overlay 0.14s allow-discrete,
      display 0.14s allow-discrete;

    &:popover-open {
      opacity: 1;
      transform: translateY(0) scale(1);

      @starting-style {
        opacity: 0;
        transform: translateY(-0.35rem) scale(0.98);
      }
    }

    > .item {
      &.-category {
        padding: 0.35rem 0.6rem 0.25rem;
        color: #667d84;
        font-size: 0.72rem;
        font-weight: 750;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
    }

    > .item {
      &[role="separator"] {
        block-size: 1px;
        margin: 0.35rem 0.3rem;
        background: #dbe6e9;
      }
    }

    > .item {
      &[role="group"] {
        > .list {
          margin: 0;
          padding: 0;
          list-style: none;

          > .item {
            > .button {
              display: grid;
              grid-template-columns: 1rem minmax(0, 1fr) auto;
              gap: 0.55rem;
              align-items: center;
              inline-size: 100%;
              min-block-size: 2rem;
              padding: 0.35rem 0.55rem;
              border: 0;
              border-radius: 0.4rem;
              background: transparent;
              color: inherit;
              font: inherit;
              text-align: start;
              cursor: pointer;

              &[data-active] {
                background: #e5f1f4;
                outline: 2px solid #75adba;
                outline-offset: -2px;
              }

              &[aria-disabled="true"] {
                color: #91a1a6;
                cursor: not-allowed;
              }

              &[aria-checked="false"] {
                > .icon {
                  opacity: 0;
                }
              }

              > .icon {
                color: #16768b;
                font-size: 0.78rem;
                text-align: center;

                &.-dot {
                  font-size: 0.55rem;
                }
              }

              > .text {
                &.-shortcut {
                  color: #788b91;
                  font-size: 0.75rem;
                }
              }
            }
          }
        }
      }
    }

    > .item {
      > .button {
        display: grid;
        grid-template-columns: 1rem minmax(0, 1fr) auto;
        gap: 0.55rem;
        align-items: center;
        inline-size: 100%;
        min-block-size: 2rem;
        padding: 0.35rem 0.55rem;
        border: 0;
        border-radius: 0.4rem;
        background: transparent;
        color: inherit;
        font: inherit;
        text-align: start;
        cursor: pointer;

        &[data-active],
        &[aria-expanded="true"] {
          background: #e5f1f4;
          outline: 2px solid #75adba;
          outline-offset: -2px;
        }

        &.-danger {
          color: #aa3443;
        }

        > .text,
        > .icon {
          &.-shortcut,
          &.-submenu {
            color: #788b91;
            font-size: 0.75rem;
          }
        }
      }

      > .list {
        min-inline-size: 12rem;
        margin: 0;
        padding: 0.4rem;
        border: 1px solid #c8d8dd;
        border-radius: 0.65rem;
        outline: none;
        background: #fff;
        box-shadow: 0 14px 36px rgb(22 48 60 / 0.2);
        color: #17323b;
        list-style: none;
        opacity: 0;
        transform: translateX(-0.25rem) scale(0.98);
        transform-origin: left top;
        transition:
          opacity 0.14s,
          transform 0.14s,
          overlay 0.14s allow-discrete,
          display 0.14s allow-discrete;

        &:popover-open {
          opacity: 1;
          transform: translateX(0) scale(1);

          @starting-style {
            opacity: 0;
            transform: translateX(-0.25rem) scale(0.98);
          }
        }

        &[dir="rtl"] {
          transform-origin: right top;
        }

        > .item {
          > .button {
            display: grid;
            grid-template-columns: 1rem minmax(0, 1fr) auto;
            gap: 0.55rem;
            align-items: center;
            inline-size: 100%;
            min-block-size: 2rem;
            padding: 0.35rem 0.55rem;
            border: 0;
            border-radius: 0.4rem;
            background: transparent;
            color: inherit;
            font: inherit;
            text-align: start;
            cursor: pointer;

            &[data-active] {
              background: #e5f1f4;
              outline: 2px solid #75adba;
              outline-offset: -2px;
            }

            > .text {
              &.-shortcut {
                color: #788b91;
                font-size: 0.75rem;
              }
            }
          }
        }
      }
    }

    &[dir="rtl"] {
      > .item {
        > .button {
          > .icon {
            &.-submenu {
              transform: scaleX(-1);
            }
          }
        }
      }
    }
  }
}
</style>
