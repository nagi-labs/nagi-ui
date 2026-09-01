import { expect, test, type Locator, type Page } from "@playwright/test"
import { inspectAnatomy, type ComponentDefinition } from "../definition.ts"
import { contractTitle } from "./definition-contract.ts"

export interface CarouselContractOptions {
  /** The package or owned Definition that this rendered fixture claims. */
  definition: ComponentDefinition
  /** Consumer route rendering the package or owned Carousel examples. */
  url: string
  /** Accessible name of the Carousel root. */
  name: string
  /** Accessible name of its focusable native-scroll viewport. */
  slidesName: string
  /** Localized role descriptions; omitted values assert the English defaults. */
  carouselRoleDescription?: string
  slidesRoleDescription?: string
  slideRoleDescription?: string
  /** User-visible label and localized position text contributing to each name. */
  slides: readonly {
    label: string
    position: string
  }[]
  previousName?: string
  nextName?: string
  rootRole?: "group" | "region"
  /** Consumer-visible zero-based model output. */
  modelStatusName: string
  /** Announcement after moving from the first to the second slide. */
  secondAnnouncement: string
  /** A disabled instance proving that external state remains authoritative. */
  disabled?: {
    name: string
    slidesName: string
    modelStatusName: string
    externalUpdateName: string
    expectedExternalIndex: string
  }
}

function exactAttribute(value: string): string {
  return JSON.stringify(value)
}

function carouselRoot(page: Page, name: string): Locator {
  return page.locator(
    `[data-scope="carousel"][data-part="root"][aria-label=${exactAttribute(name)}]`,
  )
}

function carouselViewport(root: Locator, name: string): Locator {
  return root.locator(
    `[data-scope="carousel"][data-part="viewport"][aria-label=${exactAttribute(name)}]`,
  )
}

function namedStatus(page: Page, name: string): Locator {
  return page.getByRole("status", { name, exact: true })
}

function escapedPattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
}

export async function assertCarouselSemantics(page: Page, options: CarouselContractOptions) {
  const root = carouselRoot(page, options.name)
  await expect(root).toHaveCount(1)
  await expect(root).toHaveAttribute("role", options.rootRole ?? "group")
  await expect(root).toHaveAttribute(
    "aria-roledescription",
    options.carouselRoleDescription ?? "carousel",
  )
  await expect(root).toHaveAccessibleName(options.name)
  expect(await root.evaluate(inspectAnatomy, options.definition.anatomy)).toEqual([])

  const viewport = carouselViewport(root, options.slidesName)
  await expect(viewport).toHaveCount(1)
  await expect(viewport).toHaveAttribute("role", "group")
  await expect(viewport).toHaveAttribute(
    "aria-roledescription",
    options.slidesRoleDescription ?? "slides",
  )
  await expect(viewport).toHaveAttribute("tabindex", "0")

  const slides = viewport.locator(
    '[role="group"][data-scope="carousel"][data-part="slide"]',
  )
  await expect(slides).toHaveCount(options.slides.length)
  for (const [index, expectedSlide] of options.slides.entries()) {
    const slide = slides.nth(index)
    await expect(slide).toHaveAttribute(
      "aria-roledescription",
      options.slideRoleDescription ?? "slide",
    )
    await expect(slide).toHaveAccessibleName(
      new RegExp(
        `${escapedPattern(expectedSlide.label)}.*${escapedPattern(expectedSlide.position)}`,
        "u",
      ),
    )
  }

  await expect(root.getByRole("button", {
    name: options.previousName ?? "Previous slide",
    exact: true,
  })).toBeVisible()
  await expect(root.getByRole("button", {
    name: options.nextName ?? "Next slide",
    exact: true,
  })).toBeVisible()
}

export async function assertCarouselInteraction(page: Page, options: CarouselContractOptions) {
  const root = carouselRoot(page, options.name)
  const viewport = carouselViewport(root, options.slidesName)
  const previous = root.getByRole("button", {
    name: options.previousName ?? "Previous slide",
    exact: true,
  })
  const next = root.getByRole("button", {
    name: options.nextName ?? "Next slide",
    exact: true,
  })
  const model = namedStatus(page, options.modelStatusName)
  const announcement = root.getByRole("status")

  await expect(model).toHaveText("0")
  await expect(previous).toBeDisabled()
  const authoredKeyboard = await viewport.evaluate((element) =>
    ["ArrowLeft", "ArrowRight", "Home", "End"].map((key) => {
      const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })
      element.dispatchEvent(event)
      return { key, defaultPrevented: event.defaultPrevented }
    }),
  )
  expect(authoredKeyboard).toEqual([
    { key: "ArrowLeft", defaultPrevented: false },
    { key: "ArrowRight", defaultPrevented: false },
    { key: "Home", defaultPrevented: false },
    { key: "End", defaultPrevented: false },
  ])
  await expect(model).toHaveText("0")
  await next.click()
  await expect(next).toBeFocused()
  await expect(model).toHaveText("1")
  await expect(announcement).toHaveText(options.secondAnnouncement)

  if (options.slides.length > 2) {
    await next.click()
    await expect(next).toBeFocused()
    await expect(model).toHaveText("2")
    await previous.click()
    await expect(model).toHaveText("1")
  }

  await previous.click()
  await expect(model).toHaveText("0")
  await viewport.evaluate((element) => {
    const slides = element.querySelectorAll<HTMLElement>(
      '[role="group"][data-scope="carousel"][data-part="slide"]',
    )
    const second = slides[1]
    if (!second) throw new Error("Carousel contract needs at least two slides")
    element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))
    element.scrollTo({ left: second.offsetLeft, behavior: "instant" })
    element.dispatchEvent(new Event("scroll", { bubbles: true }))
  })
  await expect(model).toHaveText("1")
  await viewport.focus()
  await expect(viewport).toBeFocused()
  await expect(model).toHaveText("1")
}

export async function assertCarouselDisabledPolicy(
  page: Page,
  options: CarouselContractOptions,
) {
  const disabled = options.disabled
  if (!disabled) return
  const root = carouselRoot(page, disabled.name)
  const viewport = carouselViewport(root, disabled.slidesName)
  await expect(root).toHaveAttribute("data-disabled", "")
  expect(await root.getAttribute("aria-disabled")).toBeNull()
  await expect(viewport).toHaveAttribute("tabindex", "-1")
  expect(await viewport.getAttribute("aria-disabled")).toBeNull()
  await expect(root.getByRole("button", {
    name: options.previousName ?? "Previous slide",
    exact: true,
  })).toBeDisabled()
  await expect(root.getByRole("button", {
    name: options.nextName ?? "Next slide",
    exact: true,
  })).toBeDisabled()

  await page.getByRole("button", { name: disabled.externalUpdateName, exact: true }).click()
  await expect(namedStatus(page, disabled.modelStatusName)).toHaveText(
    disabled.expectedExternalIndex,
  )
}

export async function assertCarouselStyle(page: Page, options: CarouselContractOptions) {
  const root = carouselRoot(page, options.name)
  const viewport = carouselViewport(root, options.slidesName)
  const slide = viewport.locator('[data-scope="carousel"][data-part="slide"]').first()
  const styles = await Promise.all([
    viewport.evaluate((element) => getComputedStyle(element).scrollSnapType),
    slide.evaluate((element) => getComputedStyle(element).scrollSnapAlign),
  ])
  expect(styles[0]).toContain("mandatory")
  expect(styles[1]).toContain("start")
  const sizes = await Promise.all([
    viewport.evaluate((element) => element.clientWidth),
    slide.evaluate((element) => element.getBoundingClientRect().width),
  ])
  expect(Math.abs(sizes[0] - sizes[1])).toBeLessThanOrEqual(1)

  await page.emulateMedia({ reducedMotion: "reduce" })
  await expect.poll(() => viewport.evaluate((element) =>
    getComputedStyle(element).scrollBehavior,
  )).toBe("auto")

  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" })
  const next = root.getByRole("button", {
    name: options.nextName ?? "Next slide",
    exact: true,
  })
  await next.focus()
  await expect(next).toBeFocused()
  expect(await next.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none")
}

/** Register Carousel's observable Definition against a consumer-owned route. */
export function carouselContract(options: CarouselContractOptions): void {
  test.describe(`Carousel contract: ${options.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(options.url)
    })

    test(contractTitle(options.definition, ["CAR-SEM-01", "CAR-SEM-02", "CAR-SEM-03", "CAR-SEM-04", "CAR-SEM-06", "CAR-ANAT-01"], "preserves semantic parts and scoped slide order"), async ({ page }) => {
      await assertCarouselSemantics(page, options)
    })

    test(contractTitle(options.definition, ["CAR-SEM-05", "CAR-STATE-02", "CAR-INT-01", "CAR-INT-02", "CAR-INT-03", "CAR-FOCUS-01", "CAR-FOCUS-02"], "keeps native scroll, announcements, boundary state, and focus synchronized"), async ({ page }) => {
      await assertCarouselInteraction(page, options)
    })

    if (options.disabled) {
      test(contractTitle(options.definition, ["CAR-STATE-03"], "blocks user navigation while accepting external state"), async ({ page }) => {
        await assertCarouselDisabledPolicy(page, options)
      })
    }

    test(contractTitle(options.definition, ["CAR-STYLE-01"], "preserves native scroll-snap and reduced-motion policy"), async ({ page }) => {
      await assertCarouselStyle(page, options)
    })
  })
}
