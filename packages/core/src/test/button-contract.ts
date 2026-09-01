import { expect, test, type Locator, type Page } from "@playwright/test"
import { inspectAnatomy, type ComponentDefinition } from "../definition.ts"
import { contractTitle } from "./definition-contract.ts"

export interface ButtonContractOptions {
  /** The package or owned Definition that this rendered fixture claims. */
  definition: ComponentDefinition
  /** Consumer route rendering the package or owned Button examples. */
  url: string
  /** Enabled Button used for native semantics and anatomy. */
  name: string
  /** Native-disabled Button, when the application uses that state. */
  nativeDisabledName?: string
  /** Focusable-disabled example and a consumer-visible activation counter. */
  focusableDisabled?: {
    name: string
    statusName: string
  }
  /** Enabled native activation fixture with a consumer-owned click counter. */
  activation?: {
    name: string
    statusName: string
    attribute: { name: string; value: string }
  }
  /** Native submit example and the result exposed by its real form. */
  submission?: {
    name: string
    statusName: string
    expected: string
  }
  /** Button whose authored public CSS axes must survive compilation. */
  style?: {
    name: string
    axes: Readonly<Record<string, string>>
    compiledAxes?: readonly string[]
  }
}

function namedButton(page: Page, name: string): Locator {
  return page.getByRole("button", { name, exact: true })
}

function namedStatus(page: Page, name: string): Locator {
  return page.getByRole("status", { name, exact: true })
}

export async function assertButtonSemantics(page: Page, options: ButtonContractOptions) {
  const button = namedButton(page, options.name)
  await expect(button).toBeVisible()
  await expect(button).toHaveJSProperty("tagName", "BUTTON")
  await expect(button).toHaveAttribute("type", "button")
  expect(await button.evaluate(inspectAnatomy, options.definition.anatomy)).toEqual([])
}

export async function assertButtonDisabledPolicy(page: Page, options: ButtonContractOptions) {
  if (options.nativeDisabledName) {
    await expect(namedButton(page, options.nativeDisabledName)).toBeDisabled()
  }

  const focusable = options.focusableDisabled
  if (!focusable) return
  const button = namedButton(page, focusable.name)
  const status = namedStatus(page, focusable.statusName)
  const before = await status.textContent()
  await expect(button).toHaveAttribute("aria-disabled", "true")
  expect(await button.getAttribute("disabled")).toBeNull()
  await button.focus()
  await expect(button).toBeFocused()
  await button.click({ force: true })
  await expect(status).toHaveText(before ?? "")
}

export async function assertButtonSubmission(page: Page, options: ButtonContractOptions) {
  const submission = options.submission
  if (!submission) return
  const button = namedButton(page, submission.name)
  await expect(button).toHaveAttribute("type", "submit")
  await button.click()
  await expect(namedStatus(page, submission.statusName)).toHaveText(submission.expected)
}

export async function assertButtonActivation(page: Page, options: ButtonContractOptions) {
  const activation = options.activation
  if (!activation) return
  const button = namedButton(page, activation.name)
  const status = namedStatus(page, activation.statusName)
  await expect(button).toHaveAttribute(activation.attribute.name, activation.attribute.value)
  await expect(status).toHaveText("0")
  await button.click()
  await expect(status).toHaveText("1")
  await button.focus()
  await button.press("Enter")
  await expect(status).toHaveText("2")
  await expect(button).toBeFocused()
  await button.press("Space")
  await expect(status).toHaveText("3")
  await expect(button).toBeFocused()
}

export async function assertButtonStyle(page: Page, options: ButtonContractOptions) {
  const style = options.style
  if (!style) return
  const button = namedButton(page, style.name)
  const actual = await button.evaluate((element, names) => {
    const computed = getComputedStyle(element)
    return Object.fromEntries(names.map((name) => [name, computed.getPropertyValue(name).trim()]))
  }, Object.keys(style.axes))
  expect(actual).toEqual(style.axes)
  for (const name of style.compiledAxes ?? []) {
    await expect.poll(() => button.evaluate(
      (element, property) => getComputedStyle(element).getPropertyValue(property).trim(),
      name,
    )).not.toBe("")
  }
  expect(await button.getAttribute("data-variant")).toBeNull()
  expect(await button.getAttribute("data-size")).toBeNull()
  expect((await button.getAttribute("class")) ?? "").not.toMatch(/n-button--/u)

  await page.emulateMedia({ forcedColors: "active" })
  await button.focus()
  const outline = await button.evaluate((element) => getComputedStyle(element).outlineStyle)
  expect(outline).not.toBe("none")
}

/** Register Button's observable Definition against a consumer-owned route. */
export function buttonContract(options: ButtonContractOptions): void {
  test.describe(`Button contract: ${options.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(options.url)
    })

    test(contractTitle(options.definition, ["BTN-SEM-01", "BTN-SEM-02", "BTN-ANAT-01"], "remains a named native button with explicit anatomy"), async ({ page }) => {
      await assertButtonSemantics(page, options)
    })

    if (options.nativeDisabledName || options.focusableDisabled) {
      test(contractTitle(options.definition, ["BTN-STATE-01", "BTN-STATE-02", "BTN-INT-02", "BTN-FOCUS-01"], "preserves native and focusable-disabled policy"), async ({ page }) => {
        await assertButtonDisabledPolicy(page, options)
      })
    }

    if (options.submission) {
      test(contractTitle(options.definition, ["BTN-SEM-02", "BTN-INT-03"], "keeps native submission and the authored attribute destination"), async ({ page }) => {
        await assertButtonSubmission(page, options)
      })
    }

    if (options.activation) {
      test(contractTitle(options.definition, ["BTN-INT-01", "BTN-FOCUS-01"], "keeps pointer and keyboard activation browser-owned"), async ({ page }) => {
        await assertButtonActivation(page, options)
      })
    }

    if (options.style) {
      test(contractTitle(options.definition, ["BTN-STYLE-01", "BTN-STYLE-02", "BTN-STYLE-03"], "preserves CSS axes and forced-colors focus"), async ({ page }) => {
        await assertButtonStyle(page, options)
      })
    }
  })
}
