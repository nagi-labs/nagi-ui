import { expect, test, type Locator, type Page } from "@playwright/test"
import type { ComponentDefinition } from "../definition.ts"
import { inspectAnatomy } from "../definition.ts"
import { contractTitle } from "./definition-contract.ts"

export interface DialogContractOptions {
  definition: ComponentDefinition
  /** Consumer route that renders the package or owned component. */
  url: string
  /** Accessible name of the native trigger. */
  triggerName: string
  /** Accessible name of the dialog after it opens. */
  dialogName: string
  /** Accessible description expected from `aria-describedby`, when provided. */
  description?: string
  /** `alertdialog` is reserved for confirmation surfaces. */
  role?: "dialog" | "alertdialog"
  /** Anatomy namespace used by the package or owned Blueprint. */
  scope?: "dialog" | "alert-dialog"
  /** Accessible name of a close action, when the surface provides one. */
  closeName?: string
  /** A second action that must close and restore the invoker. */
  actionName?: string
  /** Exact initially focused action required by the adopted component policy. */
  initialFocusName?: string
  /** Whether Escape is part of this component's declared dismiss policy. */
  escapeCloses?: boolean
  /** Whether the adopted `closedby` policy includes native light dismissal. */
  lightDismisses?: boolean
  /** Native modal dialogs must contain sequential keyboard focus. */
  modal?: boolean
  /** Consumer-owned model output used to observe native/model synchronization. */
  modelStatusName?: string
  /** The package Blueprint's functional styling is not imposed on owned markup. */
  verifyPackageStyle?: boolean
}

function trigger(page: Page, options: DialogContractOptions): Locator {
  return page.getByRole("button", { name: options.triggerName, exact: true })
}

function surface(page: Page, options: DialogContractOptions): Locator {
  return page.getByRole(options.role ?? "dialog", { name: options.dialogName, exact: true })
}

async function open(page: Page, options: DialogContractOptions) {
  const opener = trigger(page, options)
  await opener.click()
  const dialog = surface(page, options)
  await expect(dialog).toBeVisible()
  return { dialog, opener }
}

async function rootFor(dialog: Locator, options: DialogContractOptions): Promise<Locator> {
  const scope = options.scope ?? "dialog"
  return dialog.page().locator(`[data-scope="${scope}"][data-part="root"]`).filter({
    has: dialog,
  }).first()
}

export async function assertDialogSemantics(page: Page, options: DialogContractOptions) {
  const opener = trigger(page, options)
  const targetId = await opener.getAttribute("commandfor")
  const { dialog } = await open(page, options)
  const root = await rootFor(dialog, options)
  expect(await dialog.evaluate((node) => node instanceof HTMLDialogElement)).toBe(true)
  expect(await dialog.evaluate((node) => node.matches(":modal"))).toBe(options.modal ?? true)
  if (targetId !== null) expect(targetId).toBe(await dialog.getAttribute("id"))
  if (options.description) await expect(dialog).toHaveAccessibleDescription(options.description)
  expect(await root.evaluate(inspectAnatomy, options.definition.anatomy)).toEqual([])
  if (options.modelStatusName) {
    await expect(page.getByRole("status", { name: options.modelStatusName })).toHaveText("true")
  }
}

export async function assertDialogLightDismissal(page: Page, options: DialogContractOptions) {
  const { dialog, opener } = await open(page, options)
  await page.mouse.click(4, 4)
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
  if (options.modelStatusName) {
    await expect(page.getByRole("status", { name: options.modelStatusName })).toHaveText("false")
  }
}

export async function assertDialogFocusEntry(page: Page, options: DialogContractOptions) {
  const { dialog, opener } = await open(page, options)
  await expect(opener).not.toBeFocused()
  await expect.poll(() => dialog.evaluate((node) => node.contains(document.activeElement)))
    .toBe(true)
  if (options.initialFocusName) {
    await expect(dialog.getByRole("button", { name: options.initialFocusName, exact: true }))
      .toBeFocused()
  }
}

export async function assertDialogEscapeAndRestoration(page: Page, options: DialogContractOptions) {
  const { dialog, opener } = await open(page, options)
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
  if (options.modelStatusName) {
    await expect(page.getByRole("status", { name: options.modelStatusName })).toHaveText("false")
  }
}

export async function assertDialogFocusContainment(page: Page, options: DialogContractOptions) {
  const { dialog } = await open(page, options)
  const focusable = dialog.locator(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  const count = await focusable.count()
  expect(count, "A modal dialog needs at least one sequential focus target.").toBeGreaterThan(0)
  for (const key of ["Tab", "Shift+Tab"] as const) {
    for (let index = 0; index <= count; index += 1) {
      await page.keyboard.press(key)
      expect(await dialog.evaluate((node) => {
        const active = document.activeElement
        return active === document.body || active === node || node.contains(active)
      })).toBe(true)
    }
  }
}

export async function assertDialogCloseAction(page: Page, options: DialogContractOptions) {
  if (!options.closeName) return
  const { dialog, opener } = await open(page, options)
  await dialog.getByRole("button", { name: options.closeName, exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
}

export async function assertDialogPrimaryAction(page: Page, options: DialogContractOptions) {
  if (!options.actionName) return
  const { dialog, opener } = await open(page, options)
  await dialog.getByRole("button", { name: options.actionName, exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()
}

export async function assertDialogRejectsLightDismissal(
  page: Page,
  options: DialogContractOptions,
) {
  const { dialog } = await open(page, options)
  await page.mouse.click(4, 4)
  await expect(dialog).toBeVisible()
  if (options.modelStatusName) {
    await expect(page.getByRole("status", { name: options.modelStatusName })).toHaveText("true")
  }
}

export async function assertDialogStyle(page: Page, options: DialogContractOptions) {
  const { dialog } = await open(page, options)
  const size = await dialog.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    viewport: document.documentElement.clientWidth,
    backdrop: getComputedStyle(element, "::backdrop").backgroundColor,
  }))
  expect(size.width).toBeLessThanOrEqual(size.viewport)
  expect(size.backdrop).not.toBe("rgba(0, 0, 0, 0)")

  await page.emulateMedia({ forcedColors: "active" })
  const close = dialog.getByRole("button", { name: options.closeName ?? "Close", exact: true })
  await page.keyboard.press("Tab")
  await page.keyboard.press("Shift+Tab")
  await expect(close).toBeFocused()
  expect(await close.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none")
}

/**
 * Registers the minimum observable dialog contract against a real browser.
 * It intentionally discovers the surface by role/name and never by Nagi class
 * or fixed DOM position, so an owned SFC may rearrange its visible structure.
 */
interface DialogContractRequirementIds {
  semantics: readonly string[]
  focusEntry: readonly string[]
  escape: readonly string[]
  lightDismiss: readonly string[]
  focusContainment: readonly string[]
  closeAction: readonly string[]
  primaryAction?: readonly string[]
  style: readonly string[]
}

const dialogRequirementIds: DialogContractRequirementIds = {
  semantics: [
    "DLG-SEM-01",
    "DLG-SEM-02",
    "DLG-SEM-03",
    "DLG-STATE-01",
    "DLG-STATE-02",
    "DLG-ANAT-01",
  ],
  focusEntry: ["DLG-FOCUS-01"],
  escape: ["DLG-INT-01", "DLG-FOCUS-02"],
  lightDismiss: ["DLG-INT-01", "DLG-FOCUS-02"],
  focusContainment: ["DLG-FOCUS-01"],
  closeAction: ["DLG-INT-01", "DLG-FOCUS-02"],
  style: ["DLG-STYLE-01"],
}

const alertDialogRequirementIds: DialogContractRequirementIds = {
  semantics: [
    "ALD-DIALOG-SEM-01",
    "ALD-DIALOG-SEM-02",
    "ALD-DIALOG-SEM-03",
    "ALD-DIALOG-STATE-01",
    "ALD-DIALOG-STATE-02",
    "ALD-ANAT-01",
  ],
  focusEntry: ["ALD-DIALOG-FOCUS-01", "ALD-FOCUS-01"],
  escape: ["ALD-DIALOG-INT-01", "ALD-DIALOG-FOCUS-02"],
  lightDismiss: ["ALD-DIALOG-INT-01"],
  focusContainment: ["ALD-DIALOG-FOCUS-01"],
  closeAction: ["ALD-DIALOG-INT-01", "ALD-DIALOG-FOCUS-02", "ALD-INT-01"],
  primaryAction: ["ALD-DIALOG-INT-01", "ALD-DIALOG-FOCUS-02", "ALD-INT-01"],
  style: ["ALD-STYLE-01"],
}

function registerDialogContract(
  options: DialogContractOptions,
  requirements: DialogContractRequirementIds,
): void {
  const escapeCloses = options.escapeCloses ?? true
  const lightDismisses = options.lightDismisses ?? true
  const modal = options.modal ?? true
  const closeName = options.closeName

  test.describe(`Dialog contract: ${options.dialogName}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(options.url)
    })

    test(contractTitle(options.definition, requirements.semantics, "uses one named native surface with executable anatomy"), async ({ page }) => {
      await assertDialogSemantics(page, options)
    })

    test(contractTitle(options.definition, requirements.focusEntry, "moves focus to its declared initial destination"), async ({ page }) => {
      await assertDialogFocusEntry(page, options)
    })

    if (escapeCloses) {
      test(contractTitle(options.definition, requirements.escape, "closes with Escape and restores trigger focus"), async ({ page }) => {
        await assertDialogEscapeAndRestoration(page, options)
      })
    }

    if (lightDismisses) {
      test(contractTitle(options.definition, requirements.lightDismiss, "light dismisses through the native close policy"), async ({ page }) => {
        await assertDialogLightDismissal(page, options)
      })
    } else {
      test(contractTitle(options.definition, requirements.lightDismiss, "rejects light dismissal under its native close policy"), async ({ page }) => {
        await assertDialogRejectsLightDismissal(page, options)
      })
    }

    if (modal) {
      test(contractTitle(options.definition, requirements.focusContainment, "contains sequential focus while open"), async ({ page }) => {
        await assertDialogFocusContainment(page, options)
      })
    }

    if (closeName) {
      test(contractTitle(options.definition, requirements.closeAction, "restores trigger focus after its close action"), async ({ page }) => {
        await assertDialogCloseAction(page, options)
      })
    }

    if (options.actionName && requirements.primaryAction) {
      test(contractTitle(options.definition, requirements.primaryAction, "closes through its primary action and restores the trigger"), async ({ page }) => {
        await assertDialogPrimaryAction(page, options)
      })
    }

    if (options.verifyPackageStyle) {
      test(contractTitle(options.definition, requirements.style, "preserves modal and forced-colors functional styling"), async ({ page }) => {
        await assertDialogStyle(page, options)
      })
    }
  })
}

export function dialogContract(options: DialogContractOptions): void {
  registerDialogContract(options, dialogRequirementIds)
}

export function alertDialogContract(options: DialogContractOptions): void {
  registerDialogContract(
    {
      ...options,
      role: "alertdialog",
      scope: "alert-dialog",
      modal: true,
      lightDismisses: false,
    },
    alertDialogRequirementIds,
  )
}
