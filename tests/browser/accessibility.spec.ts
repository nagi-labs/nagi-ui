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
