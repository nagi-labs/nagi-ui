import { expect, test, type Locator, type Page } from "@playwright/test"

export interface TabsContractOptions {
  url: string
  /** Accessible name of the tablist under test. */
  name: string
  orientation?: "horizontal" | "vertical"
  activation?: "automatic" | "manual"
  direction?: "ltr" | "rtl"
  loop?: boolean
}

function tablist(page: Page, options: TabsContractOptions): Locator {
  return page.getByRole("tablist", { name: options.name, exact: true })
}

function enabledTabs(list: Locator): Locator {
  return list.locator('[role="tab"]:not([disabled]):not([aria-disabled="true"])')
}

/** Registers APG-level relationships and keyboard invariants for an owned Tabs surface. */
export function tabsContract(options: TabsContractOptions): void {
  const orientation = options.orientation ?? "horizontal"
  const activation = options.activation ?? "automatic"
  const direction = options.direction ?? "ltr"
  const loop = options.loop ?? true

  test.describe(`Tabs contract: ${options.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(options.url)
    })

    test("has one selection, one tab stop, and reciprocal panel relationships", async ({ page }) => {
      const list = tablist(page, options)
      const tabs = list.getByRole("tab")
      await expect(list).toBeVisible()
      await expect(tabs).not.toHaveCount(0)
      await expect(list.getByRole("tab", { selected: true })).toHaveCount(1)
      expect(await tabs.evaluateAll((nodes) =>
        nodes.filter((node) => node.getAttribute("tabindex") === "0").length,
      )).toBe(1)

      for (const tab of await tabs.all()) {
        const tabId = await tab.getAttribute("id")
        const panelId = await tab.getAttribute("aria-controls")
        expect(tabId).toBeTruthy()
        expect(panelId).toBeTruthy()
        const panel = page.locator(`[id="${panelId ?? ""}"]`)
        await expect(panel).toHaveAttribute("role", "tabpanel")
        await expect(panel).toHaveAttribute("aria-labelledby", tabId ?? "")
      }
    })

    test("uses the declared arrow and activation model while skipping disabled tabs", async ({ page }) => {
      const list = tablist(page, options)
      const tabs = list.getByRole("tab")
      const enabled = enabledTabs(list)
      const count = await enabled.count()
      expect(count, "Tabs keyboard conformance needs at least two enabled tabs.").toBeGreaterThan(1)
      const first = enabled.first()
      const second = enabled.nth(1)
      const selectedBefore = await list.getByRole("tab", { selected: true }).getAttribute("id")
      await first.focus()

      const nextKey = orientation === "vertical"
        ? "ArrowDown"
        : direction === "rtl" ? "ArrowLeft" : "ArrowRight"
      await first.press(nextKey)
      await expect(second).toBeFocused()
      if (activation === "automatic") {
        await expect(second).toHaveAttribute("aria-selected", "true")
      } else {
        expect(await list.getByRole("tab", { selected: true }).getAttribute("id")).toBe(selectedBefore)
        await second.press("Enter")
        await expect(second).toHaveAttribute("aria-selected", "true")
      }

      for (const disabled of await tabs.locator("[disabled], [aria-disabled=true]").all()) {
        await expect(disabled).not.toBeFocused()
      }
    })

    test("supports Home and End and applies the declared edge policy", async ({ page }) => {
      const list = tablist(page, options)
      const enabled = enabledTabs(list)
      const first = enabled.first()
      const last = enabled.last()
      await first.focus()
      await first.press("End")
      await expect(last).toBeFocused()
      await last.press("Home")
      await expect(first).toBeFocused()

      if (loop) {
        const previousKey = orientation === "vertical"
          ? "ArrowUp"
          : direction === "rtl" ? "ArrowRight" : "ArrowLeft"
        await first.press(previousKey)
        await expect(last).toBeFocused()
      } else {
        const previousKey = orientation === "vertical"
          ? "ArrowUp"
          : direction === "rtl" ? "ArrowRight" : "ArrowLeft"
        await first.press(previousKey)
        await expect(first).toBeFocused()
      }
    })
  })
}
