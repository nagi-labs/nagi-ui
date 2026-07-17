import path from "node:path"
import { fileURLToPath } from "node:url"

import { expect, test, type Page } from "@playwright/test"

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const verifierUrl = `/@fs${path.join(repo, "packages/core/src/verify-dom.ts")}`

async function issueCodes(page: Page) {
  return page.evaluate(async (url) => {
    const { verifyNagiDom } = await import(url)
    return verifyNagiDom(document).map((issue) => issue.code)
  }, verifierUrl)
}

test("rendered Menu, Listbox, and Combobox relationship graphs are valid", async ({ page }) => {
  await page.goto("/dropdown.html")
  await page.getByRole("button", { name: "File actions" }).first().click()
  await page.getByRole("menuitem", { name: "Share" }).first().hover()
  await expect(page.getByRole("menu").first()).toBeVisible()
  expect(await issueCodes(page)).toEqual([])

  await page.goto("/listbox.html")
  await page.getByRole("listbox").first().press("ArrowDown")
  expect(await issueCodes(page)).toEqual([])

  await page.goto("/combobox.html")
  const input = page.getByRole("combobox", { name: "Framework" })
  await input.fill("a")
  await input.press("ArrowDown")
  expect(await issueCodes(page)).toEqual([])
})

test("runtime verifier reports corrupted relationship wiring", async ({ page }) => {
  await page.goto("/phase2.html")
  const codes = await page.evaluate(async (url) => {
    const { verifyNagiDom } = await import(url)
    const trigger = document.querySelector<HTMLElement>("[popovertarget]")
    const menu = document.querySelector<HTMLElement>("[role=menu]")
    if (!trigger || !menu) throw new Error("fixture wiring not found")

    trigger.setAttribute("popovertarget", "not-a-popover")
    trigger.setAttribute("aria-controls", "different-target")
    menu.insertAdjacentHTML("afterend", `<div id="${menu.id}"></div>`)
    menu.setAttribute("aria-activedescendant", "outside-option")
    document.body.insertAdjacentHTML("beforeend", '<div id="not-a-popover"></div>')
    document.body.insertAdjacentHTML("beforeend", '<div id="different-target"></div>')
    document.body.insertAdjacentHTML("beforeend", '<div id="outside-option"></div>')

    return verifyNagiDom(document).map((issue) => issue.code)
  }, verifierUrl)

  expect(codes).toEqual(
    expect.arrayContaining([
      "duplicate-id",
      "invalid-popover-target",
      "relationship-mismatch",
      "invalid-active-descendant",
    ]),
  )
})

test("assertNagiDom throws an aggregate error for missing ID targets", async ({ page }) => {
  await page.goto("/listbox.html")
  const result = await page.evaluate(async (url) => {
    const { assertNagiDom } = await import(url)
    document.querySelector("[role=listbox]")?.setAttribute("aria-labelledby", "missing-label")
    try {
      assertNagiDom(document)
      return null
    } catch (error) {
      return { name: (error as Error).name, message: (error as Error).message }
    }
  }, verifierUrl)

  expect(result?.name).toBe("AggregateError")
  expect(result?.message).toContain("1 issue")
})

test("observeNagiDom reports relationship issues introduced by a mutation", async ({ page }) => {
  await page.goto("/phase2.html")
  const codes = await page.evaluate(async (url) => {
    const { observeNagiDom } = await import(url)
    const menu = document.querySelector<HTMLElement>("[role=menu]")
    if (!menu) throw new Error("fixture menu not found")

    return new Promise<string[]>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        stop()
        reject(new Error("observer did not report the corrupted relationship"))
      }, 1_000)
      const stop = observeNagiDom(document, {
        initial: false,
        onIssues(issues: Array<{ code: string }>) {
          const issueCodes = issues.map((issue) => issue.code)
          if (!issueCodes.includes("missing-id-target")) return
          window.clearTimeout(timeout)
          stop()
          resolve(issueCodes)
        },
      })

      menu.setAttribute("aria-labelledby", "observer-missing-label")
    })
  }, verifierUrl)

  expect(codes).toContain("missing-id-target")
})
