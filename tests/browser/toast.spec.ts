import { expect, test } from "@playwright/test"

test("Toast region re-promotes when a modal opens after a live notification", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Fire toast" }).first().click()
  const region = page.locator(".zone.-toasts")
  await expect(region).toHaveJSProperty("popover", "manual")
  await expect(region).toHaveCSS("display", "block")

  await page.getByRole("button", { name: "Open modal dialog" }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(region).toHaveCSS("display", "block")
})

test("Toast opened from a modal stays visible without moving F6 focus outside inert content", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Open modal dialog" }).click()
  const dialog = page.getByRole("dialog")
  const fireInside = dialog.getByRole("button", { name: "Fire toast" })
  await fireInside.click()
  const region = page.locator(".zone.-toasts")
  await expect(region).toHaveCSS("display", "block")
  await expect(fireInside).toBeFocused()

  await page.keyboard.press("F6")
  await expect(fireInside).toBeFocused()
  await expect(region).not.toBeFocused()
})
