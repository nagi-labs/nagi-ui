import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/date-time.html");
});

test("calendar grids move roving focus and enforce unavailable dates", async ({ page }) => {
  const grid = page.getByRole("grid", { name: "Inline date calendar" });
  const selected = grid.getByRole("button", { name: "Thursday, July 23, 2026" });
  await selected.focus();
  await selected.press("ArrowRight");
  await expect(grid.getByRole("button", { name: "Friday, July 24, 2026" })).toBeDisabled();
  await expect(grid.getByRole("button", { name: "Saturday, July 25, 2026" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(grid.getByRole("gridcell", { selected: true })).toContainText("25");
});

test("[DTP-INT-01] segmented fields edit ISO values and reset through native forms", async ({
  page,
}) => {
  const date = page.getByRole("group", { name: "Field date" });
  const day = date.getByRole("spinbutton", { name: "Day" });
  await day.focus();
  await day.press("Delete");
  await day.press("2");
  await day.press("8");
  await expect(page.locator("#date-model")).toHaveText("2026-07-28");

  const time = page.getByRole("group", { name: "Field time" });
  const minute = time.getByRole("spinbutton", { name: "Minute" });
  await minute.focus();
  await minute.press("ArrowUp");
  await expect(page.locator("#time-model")).toHaveText("13:46");

  await page.getByRole("button", { name: "Reset dates" }).click();
  await expect(page.locator("#date-model")).toHaveText("2026-07-23");
  await expect(page.locator("#time-model")).toHaveText("13:45");

  const emptyDate = page.locator(".n-date-field").filter({ hasText: "Initially empty date" });
  const emptyYear = emptyDate.getByRole("spinbutton", { name: "Year" });
  await emptyYear.focus();
  await emptyYear.press("2");
  await page.getByRole("heading", { name: "Date and time components" }).click();
  await expect(emptyDate.locator(".field")).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Reset dates" }).click();
  await expect(emptyYear).toHaveText("yyyy");
  await expect(page.locator("#empty-date-model")).toHaveText("");
});

test("pickers use native popovers, commit selections, and submit ISO FormData", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Choose picked date" }).click();
  const dateDialog = page.getByRole("dialog", { name: "Picked date calendar" });
  await expect(dateDialog).toBeVisible();
  await expect(dateDialog.getByRole("button", { name: "Friday, July 24, 2026" })).toBeFocused();
  await dateDialog.getByRole("button", { name: "Tuesday, July 28, 2026" }).click();
  await expect(dateDialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Choose picked date" })).toBeFocused();

  await page.getByRole("button", { name: "Choose picked range" }).click();
  const rangeDialog = page.getByRole("dialog", { name: "Picked range calendar" });
  await rangeDialog.getByRole("button", { name: "Wednesday, July 29, 2026" }).click();
  await expect(rangeDialog).toBeVisible();
  await expect(rangeDialog.getByRole("status")).toContainText("Wednesday, July 29, 2026");
  await rangeDialog.getByRole("button", { name: "Wednesday, July 29, 2026" }).press("ArrowRight");
  await expect(rangeDialog.getByRole("button", { name: "Thursday, July 30, 2026" })).toBeFocused();
  await expect(rangeDialog.getByRole("status")).toContainText("Thursday, July 30, 2026");
  await rangeDialog.getByRole("button", { name: "Friday, July 31, 2026" }).click();
  await expect(rangeDialog).toBeHidden();

  await page.getByRole("button", { name: "Submit dates" }).click();
  await expect(page.locator("#submission")).toHaveText(
    JSON.stringify({
      fieldDate: "2026-07-23",
      fieldTime: "13:45",
      pickedDate: "2026-07-28",
      pickedStart: "2026-07-29",
      pickedEnd: "2026-07-31",
      inlineDate: "2026-07-23",
      inlineStart: "2026-07-20",
      inlineEnd: "2026-07-22",
    }),
  );
});

test("[DTP-STATE-02] picker Escape restores focus and invalid typed ranges block native submission", async ({
  page,
}) => {
  const trigger = page.getByRole("button", { name: "Choose picked date" });
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Picked date calendar" })).toBeHidden();
  await expect(trigger).toBeFocused();

  const range = page.locator(".n-date-range-picker");
  const startDay = range.locator(".field.-start").getByRole("spinbutton", { name: "Day" });
  await startDay.focus();
  await startDay.press("Delete");
  await startDay.press("3");
  await startDay.press("0");
  await page.getByRole("button", { name: "Submit dates" }).click();
  await expect(page.locator("#submission")).toHaveText("No submission yet");
  await expect(range.locator(".field.-start input[type=date]")).toHaveJSProperty(
    "validationMessage",
    "Choose an available date range.",
  );
});

test("date and time family is axe-clean with picker popovers open", async ({ page }) => {
  await page.getByRole("button", { name: "Choose picked date" }).click();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => node.target.join(" ")),
    })),
  ).toEqual([]);
});

test("initially controlled-open picker focuses its date, light dismisses, and rejected fields roll back", async ({
  page,
}) => {
  await page.goto("/date-time.html?qa=1");
  const dialog = page.getByRole("dialog", { name: "Initially open date calendar" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Friday, July 24, 2026" })).toBeFocused();

  const outside = page.getByRole("button", { name: "Outside picker target" });
  await outside.click();
  await expect(dialog).toBeHidden();
  await expect(outside).toBeFocused();

  const field = page.getByRole("group", { name: "Rejected controlled date" });
  const day = field.getByRole("spinbutton", { name: "Day" });
  await day.focus();
  await day.press("Delete");
  await day.press("2");
  await day.press("8");
  await expect(page.locator("#qa-controlled-date")).toHaveText("2026-07-23");
  await expect(day).toHaveText("23");

  const readonlyDate = page.locator(".n-calendar").filter({
    has: page.getByRole("grid", { name: "Readonly date calendar" }),
  });
  const readonlyDateInput = readonlyDate.locator("input[type=date]");
  await expect(readonlyDateInput).toHaveJSProperty("readOnly", true);
  expect(await readonlyDateInput.evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(
    true,
  );

  const readonlyRange = page.locator(".n-range-calendar").filter({
    has: page.getByRole("grid", { name: "Readonly range calendar" }),
  });
  const readonlyRangeInputs = readonlyRange.locator("input[type=date]");
  await expect(readonlyRangeInputs).toHaveCount(2);
  for (const input of await readonlyRangeInputs.all()) {
    await expect(input).toHaveJSProperty("readOnly", true);
    expect(await input.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(true);
  }

  const partialRange = page.locator(".n-range-calendar").filter({
    has: page.getByRole("grid", { name: "Optional partial range" }),
  });
  await partialRange.getByRole("button", { name: "Monday, July 20, 2026" }).click();
  await expect(partialRange.getByRole("alert")).toContainText("Choose an available date range.");
  await page.getByRole("button", { name: "Submit dates" }).click();
  await expect(page.locator("#submission")).toHaveText("No submission yet");
  await expect(partialRange.locator("input[type=date]").first()).toHaveJSProperty(
    "validationMessage",
    "Choose an available date range.",
  );
});
