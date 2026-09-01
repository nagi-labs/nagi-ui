import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/listbox.html");
});

function section(page: Page, heading: "Single" | "Multiple") {
  const root = page
    .locator(".section")
    .filter({ has: page.getByRole("heading", { name: heading }) });
  return { root, listbox: root.getByRole("listbox") };
}

test("[LST-SEM-01][LST-SEM-02][LST-INT-01][LST-FOCUS-01][LST-ANAT-01] single mode: selection follows keyboard focus and skips disabled options", async ({
  page,
}) => {
  const single = section(page, "Single");

  await single.listbox.press("ArrowDown");
  await expect(single.listbox.getByRole("option", { name: "Cherry" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.locator("#single-state")).toHaveText("cherry");

  await single.listbox.press("Home");
  await expect(page.locator("#single-state")).toHaveText("apple");

  await single.listbox.press("d");
  await expect(page.locator("#single-state")).toHaveText("date");

  const active = single.listbox.getByRole("option", { name: "Date" });
  await expect(active).toHaveAttribute("data-active", "");
  const activeId = await active.getAttribute("id");
  await expect(single.listbox).toHaveAttribute("aria-activedescendant", activeId ?? "");
});

test("single mode: click selects exactly one option", async ({ page }) => {
  const single = section(page, "Single");

  await single.listbox.getByRole("option", { name: "Apple" }).click();
  await single.listbox.getByRole("option", { name: "Cherry" }).click();
  await expect(page.locator("#single-state")).toHaveText("cherry");
  await expect(single.listbox.getByRole("option", { name: "Apple" })).toHaveAttribute(
    "aria-selected",
    "false",
  );

  await single.listbox.getByRole("option", { name: "Banana" }).click({ force: true });
  await expect(page.locator("#single-state")).toHaveText("cherry");
});

test("[LST-STATE-01][LST-INT-02] multiple mode: Space toggles, Shift+Arrow extends, Ctrl+A toggles all", async ({
  page,
}) => {
  const multiple = section(page, "Multiple");

  await expect(multiple.listbox).toHaveAttribute("aria-multiselectable", "true");
  await expect(page.locator("#multi-state")).toHaveText("mushrooms");

  await multiple.listbox.press("ArrowDown");
  await expect(page.locator("#multi-state")).toHaveText("mushrooms");

  await multiple.listbox.press(" ");
  await expect(page.locator("#multi-state")).toHaveText("mushrooms,anchovies");

  await multiple.listbox.press("Shift+ArrowDown");
  await expect(page.locator("#multi-state")).toHaveText("mushrooms,anchovies,onions");

  await multiple.listbox.press("ControlOrMeta+a");
  await expect(page.locator("#multi-state")).toHaveText(
    "olives,mushrooms,anchovies,onions",
  );
  await multiple.listbox.press("ControlOrMeta+a");
  await expect(page.locator("#multi-state")).toHaveText("none");
});

test("[LST-STATE-02] filtering hides options without dropping their selection", async ({ page }) => {
  const multiple = section(page, "Multiple");
  const filter = page.getByLabel("Filter toppings");

  await multiple.listbox.getByRole("option", { name: "Olives" }).click();
  await expect(page.locator("#multi-state")).toHaveText("mushrooms,olives");

  await filter.fill("an");
  await expect(multiple.listbox.getByRole("option")).toHaveCount(1);
  await expect(page.locator("#multi-state")).toHaveText("mushrooms,olives");

  await filter.fill("");
  await expect(multiple.listbox.getByRole("option", { name: "Olives" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(multiple.listbox.getByRole("option", { name: "Mushrooms" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});
