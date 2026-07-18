import assert from "node:assert/strict";
import test from "node:test";

import {
  menuEntries,
  type DropdownMenuNode,
} from "../packages/core/blueprints/menu/dropdown-schema.ts";

const noop = () => {};

const nodes: readonly DropdownMenuNode[] = [
  {
    type: "group",
    key: "file",
    label: "File",
    items: [
      { type: "action", key: "duplicate", label: "Duplicate", onSelect: noop },
      { type: "action", key: "archive", label: "Archive", disabled: true, onSelect: noop },
    ],
  },
  { type: "separator", key: "s1" },
  {
    type: "checkbox",
    key: "toolbar",
    label: "Show toolbar",
    checked: true,
    onCheckedChange: noop,
  },
  {
    type: "radio-group",
    key: "sort",
    value: "name",
    onValueChange: noop,
    items: [
      { key: "name", label: "Sort by name" },
      { key: "modified", label: "Sort by modified date", disabled: true },
    ],
  },
  {
    type: "submenu",
    key: "share",
    label: "Share",
    items: [{ type: "action", key: "copy-link", label: "Copy link", onSelect: noop }],
  },
];

test("menuEntries flattens one level in visual order", () => {
  const entries = menuEntries(nodes);
  assert.deepEqual(
    entries.map((entry) => entry.key),
    ["duplicate", "archive", "toolbar", "name", "modified", "share"],
  );
});

test("menuEntries excludes separators and keeps submenu children out of the parent level", () => {
  const entries = menuEntries(nodes);
  assert.ok(!entries.some((entry) => entry.key === "s1"));
  assert.ok(!entries.some((entry) => entry.key === "copy-link"));
});

test("menuEntries expands radio groups into individual selectable items", () => {
  const entries = menuEntries(nodes);
  const radios = entries.filter((entry) => entry.kind === "radio");
  assert.equal(radios.length, 2);
  assert.deepEqual(
    radios.map((entry) => entry.label),
    ["Sort by name", "Sort by modified date"],
  );
});

test("menuEntries resolves disabled defaults per node kind", () => {
  const entries = menuEntries(nodes);
  const byKey = new Map(entries.map((entry) => [entry.key, entry]));
  assert.equal(byKey.get("duplicate")?.disabled, false);
  assert.equal(byKey.get("archive")?.disabled, true);
  assert.equal(byKey.get("modified")?.disabled, true);
  assert.equal(byKey.get("share")?.disabled, false);
});

test("menuEntries recurses through groups but not through submenus", () => {
  const nested: readonly DropdownMenuNode[] = [
    {
      type: "group",
      key: "outer",
      items: [
        {
          type: "submenu",
          key: "inner",
          label: "Inner",
          items: [{ type: "action", key: "deep", label: "Deep", onSelect: noop }],
        },
      ],
    },
  ];
  assert.deepEqual(
    menuEntries(nested).map((entry) => entry.key),
    ["inner"],
  );
});
