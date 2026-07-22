import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]

async function expectAxeClean(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze()
  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.map((node) => node.target.join(" ")),
  }))
  expect(summary).toEqual([])
}

test("Action Menu is axe-clean while open", async ({ page }) => {
  await page.goto("/phase2.html")
  await page.getByRole("button", { name: "Actions" }).click()
  await expect(page.getByRole("menu")).toBeVisible()
  await expectAxeClean(page)
})

test("complete Dropdown is axe-clean with a submenu open", async ({ page }) => {
  await page.goto("/dropdown.html")
  await page.getByRole("button", { name: "File actions" }).first().click()
  await page.getByRole("menuitem", { name: "Share" }).first().hover()
  await expect(page.getByRole("menu")).toHaveCount(2)
  await expectAxeClean(page)
})

test("token-themed Dropdown stays axe-clean while open", async ({ page }) => {
  await page.goto("/dropdown.html")
  await page.getByRole("button", { name: "Themed actions" }).click()
  await expect(page.getByRole("menu")).toBeVisible()
  await expectAxeClean(page)
})

test("single and multiple Listboxes are axe-clean after keyboard navigation", async ({ page }) => {
  await page.goto("/listbox.html")
  const listboxes = page.getByRole("listbox")
  await listboxes.first().press("ArrowDown")
  await listboxes.nth(1).press("ArrowDown")
  await listboxes.nth(1).press(" ")
  await expectAxeClean(page)
})

test("Combobox is axe-clean with its popup and active descendant", async ({ page }) => {
  await page.goto("/combobox.html")
  const input = page.getByRole("combobox", { name: "Framework" })
  await input.fill("a")
  await input.press("ArrowDown")
  await expect(page.getByRole("listbox", { name: "Framework" })).toBeVisible()
  await expectAxeClean(page)
})

test("native form catalog is axe-clean with an empty Combobox open", async ({ page }) => {
  await page.goto("/forms.html")
  await page.getByRole("combobox", { name: "Empty choices" }).click()
  await expect(page.getByText("No matching framework", { exact: true })).toBeVisible()
  await expectAxeClean(page)
})

test("Unovis recipe is axe-clean with its chart summary and data table", async ({ page }) => {
  await page.goto("/chart.html")
  await expect(
    page.getByRole("figure", { name: /current period rises from 118 to 184/u }),
  ).toBeVisible()
  await expectAxeClean(page)

  await page.getByTestId("chart-theme-toggle").click()
  await expectAxeClean(page)
})

test("Dialog and Tooltip are axe-clean in their opened states", async ({ page }) => {
  await page.goto("/phase1.html")
  await page.getByRole("button", { name: "Open dialog" }).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await expectAxeClean(page)

  await page.getByRole("button", { name: "Close" }).click()
  const tooltipTrigger = page.getByRole("button", { name: "Hover or focus me" })
  await tooltipTrigger.hover()
  await expect(page.getByRole("tooltip")).toBeVisible()
  await expectAxeClean(page)
})

test("package overlay Blueprints are axe-clean in opened states", async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto("/catalog.html")

  await page.getByRole("button", { name: "Open package popover" }).click()
  await expectAxeClean(page)
  await page.keyboard.press("Escape")

  await page.getByRole("button", { name: "Open package dialog" }).click()
  await expect(page.getByRole("dialog", { name: "Package dialog" })).toBeVisible()
  await expectAxeClean(page)
  await page.getByRole("dialog").getByRole("button", { name: "Close" }).click()

  await page.getByRole("button", { name: "Delete package", exact: true }).click()
  await expect(page.getByRole("alertdialog", { name: "Delete this package?" })).toBeVisible()
  await expectAxeClean(page)
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click()
})

test("package disclosure and notification Blueprints are axe-clean", async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto("/catalog.html")

  await page.getByRole("button", { name: "More information" }).focus()
  await expect(page.getByRole("tooltip")).toBeVisible()
  await expectAxeClean(page)
  await page.getByRole("button", { name: "More information" }).blur()

  await page.locator("summary", { hasText: "What does native mean?" }).click()
  await page.locator(".n-accordion").first().getByText("Can I return an order?").click()
  await page.getByRole("button", { name: "Show toast" }).click()
  await expect(page.getByText("Catalog notification 1", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Show undo toast" }).click()
  await page.getByRole("button", { name: "Show urgent toast" }).click()
  await expect(page.getByRole("region", { name: "Notifications" })).toBeVisible()
  await expect(page.getByRole("alert").filter({ hasText: "Connection lost" })).toHaveCount(1)
  await expectAxeClean(page)
})
