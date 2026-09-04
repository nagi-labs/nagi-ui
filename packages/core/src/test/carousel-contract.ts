import { expect, test, type Locator, type Page } from "@playwright/test";
import { inspectAnatomy, type ComponentDefinition } from "../definition.ts";
import {
  componentContractAnnotation,
  componentContractRequirementsAnnotation,
  componentImplementationAnnotation,
  componentImplementationRequirementsAnnotation,
} from "./definition-contract.ts";

const carouselContractRequirementIds = [
  "CAR_CONTRACT_01",
  "CAR_CONTRACT_02",
  "CAR_CONTRACT_03",
  "CAR_CONTRACT_04",
  "CAR_CONTRACT_05",
] as const;

const nativeScrollCarouselImplementationRequirementIds = [
  "CAR_IMPLEMENTATION_01",
  "CAR_IMPLEMENTATION_02",
  "CAR_IMPLEMENTATION_03",
  "CAR_IMPLEMENTATION_04",
  "CAR_IMPLEMENTATION_05",
  "CAR_IMPLEMENTATION_06",
  "CAR_IMPLEMENTATION_07",
  "CAR_IMPLEMENTATION_08",
] as const;

export interface CarouselContractOptions {
  /** The package or owned Definition that this rendered fixture claims. */
  definition: ComponentDefinition;
  /** Runner metadata used to prove the portable Contract against both forms. */
  fixture?: "package" | "owned";
  /** Set false when a custom implementation supplies its own Implementation suite. */
  includeStandardImplementation?: boolean;
  /** Consumer route rendering the package or owned Carousel examples. */
  url: string;
  /** Accessible name of the Carousel root. */
  name: string;
  /** Accessible name of the standard Implementation's focusable native-scroll viewport. */
  slidesName?: string;
  /** Localized role descriptions; omitted values assert the English defaults. */
  carouselRoleDescription?: string;
  slidesRoleDescription?: string;
  slideRoleDescription?: string;
  /** User-visible label and localized position text contributing to each name. */
  slides: readonly {
    label: string;
    position: string;
  }[];
  previousName?: string;
  nextName?: string;
  rootRole?: "group" | "region";
  /** Consumer-visible zero-based model output. */
  modelStatusName: string;
  /** Announcement after moving from the first to the second slide. */
  secondAnnouncement: string;
  /** A disabled instance proving that external state remains authoritative. */
  disabled?: {
    name: string;
    slidesName?: string;
    modelStatusName: string;
    externalUpdateName: string;
    expectedExternalIndex: string;
  };
}

export interface CarouselContractRunnerOptions extends CarouselContractOptions {
  /** Consumer control proving that an external accepted index remains authoritative. */
  externalUpdateName: string;
  expectedExternalIndex: string;
  disabled: NonNullable<CarouselContractOptions["disabled"]>;
  /** Default-group Carousel proving wrapping boundary policy. */
  looped: {
    name: string;
    modelStatusName: string;
  };
  /** Controlled Carousel whose consumer observes but rejects navigation writes. */
  rejected: {
    name: string;
    modelStatusName: string;
    requestStatusName: string;
  };
  /** Controlled Carousel proving bounded rendering without rewriting its out-of-range source. */
  outOfRange: {
    name: string;
    modelStatusName: string;
    sourceIndex: string;
    acceptedIndex: number;
  };
}

function exactAttribute(value: string): string {
  return JSON.stringify(value);
}

function carouselRoot(page: Page, name: string): Locator {
  return page.locator(
    `[data-scope="carousel"][data-part="root"][aria-label=${exactAttribute(name)}]`,
  );
}

function semanticCarouselRoot(page: Page, options: CarouselContractOptions): Locator {
  return page.getByRole(options.rootRole ?? "group", { name: options.name, exact: true });
}

function carouselViewport(root: Locator, name: string): Locator {
  return root.locator(
    `[data-scope="carousel"][data-part="viewport"][aria-label=${exactAttribute(name)}]`,
  );
}

function namedStatus(page: Page, name: string): Locator {
  return page.getByRole("status", { name, exact: true });
}

function escapedPattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

async function assertAcceptedSlide(
  root: Locator,
  options: CarouselContractOptions,
  index: number,
): Promise<void> {
  const slide = options.slides[index];
  if (!slide) throw new Error(`Carousel Contract has no slide at index ${index}`);
  const accepted = root.getByRole("group", {
    name: new RegExp(`${escapedPattern(slide.label)}.*${escapedPattern(slide.position)}`, "u"),
  });
  await expect(accepted).toBeVisible();
  await expect(accepted).toContainText(slide.label);
  await expect(accepted).toHaveAccessibleName(
    new RegExp(`${escapedPattern(slide.label)}.*${escapedPattern(slide.position)}`, "u"),
  );
}

const carouselContractReferences = [
  {
    type: "reference",
    description: "https://www.w3.org/WAI/ARIA/apg/patterns/carousel/",
  },
  {
    type: "reference",
    description: "https://www.w3.org/TR/wai-aria-1.2/#aria-roledescription",
  },
];

const nativeScrollCarouselImplementationReferences = [
  {
    type: "reference",
    description: "https://www.w3.org/TR/css-scroll-snap-1/",
  },
];

export async function assertCarouselSemantics(page: Page, options: CarouselContractOptions) {
  const root = semanticCarouselRoot(page, options);
  await expect(root).toHaveCount(1);
  await expect(root).toHaveAttribute("role", options.rootRole ?? "group");
  await expect(root).toHaveAttribute(
    "aria-roledescription",
    options.carouselRoleDescription ?? "carousel",
  );
  await expect(root).toHaveAccessibleName(options.name);

  const slides = root.locator(
    `[role="group"][aria-roledescription="${options.slideRoleDescription ?? "slide"}"]`,
  );
  const firstSlide = options.slides[0];
  if (!firstSlide) throw new Error("Carousel Contract needs at least one slide");
  await expect(slides.first()).toHaveAttribute(
    "aria-roledescription",
    options.slideRoleDescription ?? "slide",
  );
  await expect(slides.first()).toHaveAccessibleName(
    new RegExp(`${escapedPattern(firstSlide.label)}.*${escapedPattern(firstSlide.position)}`, "u"),
  );
  await expect(slides.first()).toContainText(firstSlide.label);

  await expect(
    root.getByRole("button", {
      name: options.previousName ?? "Previous slide",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    root.getByRole("button", {
      name: options.nextName ?? "Next slide",
      exact: true,
    }),
  ).toBeVisible();
  await expect(root.getByRole("status")).toHaveCount(1);
}

export async function assertNativeScrollCarouselSemantics(
  page: Page,
  options: CarouselContractOptions,
) {
  const root = carouselRoot(page, options.name);
  const viewport = carouselViewport(root, options.slidesName ?? options.name);
  await expect(viewport).toHaveAttribute("role", "group");
  await expect(viewport).toHaveAttribute(
    "aria-roledescription",
    options.slidesRoleDescription ?? "slides",
  );
  await expect(viewport).toHaveAttribute("tabindex", "0");
}

export async function assertCarouselAnatomy(page: Page, options: CarouselContractOptions) {
  const root = carouselRoot(page, options.name);
  expect(await root.evaluate(inspectAnatomy, options.definition.anatomy)).toEqual([]);
}

export async function assertCarouselInteraction(page: Page, options: CarouselContractOptions) {
  const root = semanticCarouselRoot(page, options);
  const previous = root.getByRole("button", {
    name: options.previousName ?? "Previous slide",
    exact: true,
  });
  const next = root.getByRole("button", {
    name: options.nextName ?? "Next slide",
    exact: true,
  });
  const model = namedStatus(page, options.modelStatusName);
  const announcement = root.getByRole("status");

  await expect(model).toHaveText("0");
  await previous.focus();
  await expect(previous).toBeFocused();
  await expect(previous).toBeDisabled();
  await previous.dispatchEvent("click");
  await expect(model).toHaveText("0");
  await expect(previous).toBeFocused();
  await next.click();
  await expect(next).toBeFocused();
  await expect(model).toHaveText("1");
  await expect(announcement).toHaveText(options.secondAnnouncement);
  await assertAcceptedSlide(root, options, 1);

  for (let index = 2; index < options.slides.length; index += 1) {
    await next.click();
    await expect(next).toBeFocused();
    await expect(model).toHaveText(String(index));
    await assertAcceptedSlide(root, options, index);
  }

  await expect(next).toBeDisabled();
  await next.dispatchEvent("click");
  await expect(model).toHaveText(String(options.slides.length - 1));
  await expect(next).toBeFocused();

  for (let index = options.slides.length - 2; index >= 0; index -= 1) {
    await previous.click();
    await expect(model).toHaveText(String(index));
    await assertAcceptedSlide(root, options, index);
  }
}

export async function assertCarouselLoopPolicy(page: Page, options: CarouselContractRunnerOptions) {
  const looped = options.looped;
  const root = page.getByRole("group", { name: looped.name, exact: true }).filter({
    has: page.getByRole("button", {
      name: options.previousName ?? "Previous slide",
      exact: true,
    }),
  });
  await expect(root).toHaveAttribute("aria-roledescription", "carousel");
  const previous = root.getByRole("button", {
    name: options.previousName ?? "Previous slide",
    exact: true,
  });
  const next = root.getByRole("button", {
    name: options.nextName ?? "Next slide",
    exact: true,
  });
  const model = namedStatus(page, looped.modelStatusName);

  await expect(model).toHaveText("0");
  await previous.click();
  await expect(previous).toBeFocused();
  await expect(model).toHaveText(String(options.slides.length - 1));
  await assertAcceptedSlide(root, options, options.slides.length - 1);
  await next.click();
  await expect(next).toBeFocused();
  await expect(model).toHaveText("0");
  await assertAcceptedSlide(root, options, 0);
}

export async function assertNativeScrollCarouselInteraction(
  page: Page,
  options: CarouselContractOptions,
) {
  const root = carouselRoot(page, options.name);
  const viewport = carouselViewport(root, options.slidesName ?? options.name);
  const model = namedStatus(page, options.modelStatusName);
  const authoredKeyboard = await viewport.evaluate((element) =>
    ["ArrowLeft", "ArrowRight", "Home", "End"].map((key) => {
      const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
      element.dispatchEvent(event);
      return { key, defaultPrevented: event.defaultPrevented };
    }),
  );
  expect(authoredKeyboard).toEqual([
    { key: "ArrowLeft", defaultPrevented: false },
    { key: "ArrowRight", defaultPrevented: false },
    { key: "Home", defaultPrevented: false },
    { key: "End", defaultPrevented: false },
  ]);
  await viewport.evaluate((element) => {
    const slides = element.querySelectorAll<HTMLElement>(
      '[role="group"][data-scope="carousel"][data-part="slide"]',
    );
    const second = slides[1];
    if (!second) throw new Error("Carousel contract needs at least two slides");
    element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    element.scrollTo({ left: second.offsetLeft, behavior: "instant" });
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect(model).toHaveText("1");
  await viewport.focus();
  await expect(viewport).toBeFocused();
  await expect(model).toHaveText("1");
}

async function expectNativeViewportAtIndex(viewport: Locator, index: number): Promise<void> {
  await expect
    .poll(() =>
      viewport.evaluate((element) =>
        Math.round(element.scrollLeft / Math.max(element.clientWidth, 1)),
      ),
    )
    .toBe(index);
}

export async function assertNativeScrollCarouselControlledPosition(
  page: Page,
  options: CarouselContractRunnerOptions,
): Promise<void> {
  const mainViewport = carouselViewport(
    carouselRoot(page, options.name),
    options.slidesName ?? options.name,
  );
  await page.getByRole("button", { name: options.externalUpdateName, exact: true }).click();
  await expectNativeViewportAtIndex(mainViewport, Number(options.expectedExternalIndex));

  const disabled = options.disabled;
  const disabledViewport = carouselViewport(
    carouselRoot(page, disabled.name),
    disabled.slidesName ?? disabled.name,
  );
  await page.getByRole("button", { name: disabled.externalUpdateName, exact: true }).click();
  await expectNativeViewportAtIndex(disabledViewport, Number(disabled.expectedExternalIndex));

  const bounded = options.outOfRange;
  const boundedViewport = carouselViewport(carouselRoot(page, bounded.name), bounded.name);
  await expectNativeViewportAtIndex(boundedViewport, bounded.acceptedIndex);
}

export async function assertCarouselDisabledPolicy(
  page: Page,
  options: CarouselContractRunnerOptions,
) {
  const disabled = options.disabled;
  const root = page.getByRole(options.rootRole ?? "group", {
    name: disabled.name,
    exact: true,
  });
  const previous = root.getByRole("button", {
    name: options.previousName ?? "Previous slide",
    exact: true,
  });
  const next = root.getByRole("button", {
    name: options.nextName ?? "Next slide",
    exact: true,
  });
  const model = namedStatus(page, disabled.modelStatusName);
  expect(await root.getAttribute("aria-disabled")).toBeNull();
  await expect(previous).toBeDisabled();
  await expect(next).toBeDisabled();
  await expect(model).toHaveText("0");
  await next.click({ force: true });
  await expect(model).toHaveText("0");

  await page.getByRole("button", { name: disabled.externalUpdateName, exact: true }).click();
  await expect(model).toHaveText(disabled.expectedExternalIndex);
  const accepted = options.slides[Number(disabled.expectedExternalIndex)];
  if (!accepted) throw new Error("Disabled Carousel external index must identify a slide");
  await assertAcceptedSlide(root, options, Number(disabled.expectedExternalIndex));
  await expect(root.getByRole("status")).toHaveText(accepted.position);
}

export async function assertCarouselControlledState(
  page: Page,
  options: CarouselContractRunnerOptions,
) {
  await page.getByRole("button", { name: options.externalUpdateName, exact: true }).click();
  await expect(namedStatus(page, options.modelStatusName)).toHaveText(
    options.expectedExternalIndex,
  );
  const accepted = options.slides[Number(options.expectedExternalIndex)];
  if (!accepted) throw new Error("Carousel external index must identify a slide");
  const mainRoot = semanticCarouselRoot(page, options);
  await assertAcceptedSlide(mainRoot, options, Number(options.expectedExternalIndex));
  await expect(mainRoot.getByRole("status")).toHaveText(accepted.position);

  const rejected = options.rejected;
  const root = page.getByRole("group", { name: rejected.name, exact: true });
  const next = root.getByRole("button", {
    name: options.nextName ?? "Next slide",
    exact: true,
  });
  await expect(namedStatus(page, rejected.modelStatusName)).toHaveText("0");
  await expect(namedStatus(page, rejected.requestStatusName)).toHaveText("0");
  await next.click();
  await expect(next).toBeFocused();
  await expect(namedStatus(page, rejected.requestStatusName)).toHaveText("1");
  await expect(namedStatus(page, rejected.modelStatusName)).toHaveText("0");
  await assertAcceptedSlide(root, options, 0);
  await expect(root.getByRole("status")).toHaveText(options.slides[0]?.position ?? "");

  const outOfRange = options.outOfRange;
  const boundedRoot = page.getByRole("group", { name: outOfRange.name, exact: true }).filter({
    has: page.getByRole("button", {
      name: options.previousName ?? "Previous slide",
      exact: true,
    }),
  });
  await expect(namedStatus(page, outOfRange.modelStatusName)).toHaveText(outOfRange.sourceIndex);
  await assertAcceptedSlide(boundedRoot, options, outOfRange.acceptedIndex);
  await expect(boundedRoot.getByRole("status")).toHaveText(
    options.slides[outOfRange.acceptedIndex]?.position ?? "",
  );
}

export async function assertCarouselManualPolicy(
  page: Page,
  options: CarouselContractRunnerOptions,
) {
  await page.clock.install();
  await page.reload();
  const root = semanticCarouselRoot(page, options);
  const model = namedStatus(page, options.modelStatusName);
  const announcement = root.getByRole("status");
  await expect(announcement).toHaveAttribute("aria-live", "polite");
  await expect(announcement).toHaveAttribute("aria-atomic", "true");
  await expect(model).toHaveText("0");
  await expect(announcement).toHaveText(options.slides[0]?.position ?? "");
  await page.clock.fastForward("01:00");
  await expect(model).toHaveText("0");
  await expect(announcement).toHaveText(options.slides[0]?.position ?? "");
}

export async function assertNativeScrollCarouselDisabledProfile(
  page: Page,
  options: CarouselContractRunnerOptions,
) {
  const disabled = options.disabled;
  const root = carouselRoot(page, disabled.name);
  const viewport = carouselViewport(root, disabled.slidesName ?? disabled.name);
  await expect(root).toHaveAttribute("data-disabled", "");
  await expect(viewport).toHaveAttribute("tabindex", "-1");
  expect(await viewport.getAttribute("aria-disabled")).toBeNull();
  await viewport.evaluate((element) => {
    element.scrollLeft = element.clientWidth;
    element.dispatchEvent(new Event("scroll", { bubbles: true }));
  });
  await expect(namedStatus(page, disabled.modelStatusName)).toHaveText("0");
  await expect.poll(() => viewport.evaluate((element) => Math.round(element.scrollLeft))).toBe(0);
}

export async function assertCarouselScrollSnapStyle(page: Page, options: CarouselContractOptions) {
  const root = carouselRoot(page, options.name);
  const viewport = carouselViewport(root, options.slidesName ?? options.name);
  const slide = viewport.locator('[data-scope="carousel"][data-part="slide"]').first();
  const styles = await Promise.all([
    viewport.evaluate((element) => getComputedStyle(element).scrollSnapType),
    slide.evaluate((element) => getComputedStyle(element).scrollSnapAlign),
  ]);
  expect(styles[0]).toContain("mandatory");
  expect(styles[1]).toContain("start");
  const sizes = await Promise.all([
    viewport.evaluate((element) => element.clientWidth),
    slide.evaluate((element) => element.getBoundingClientRect().width),
  ]);
  expect(Math.abs(sizes[0] - sizes[1])).toBeLessThanOrEqual(1);
}

export async function assertCarouselReducedMotionStyle(
  page: Page,
  options: CarouselContractOptions,
) {
  const viewport = carouselViewport(
    carouselRoot(page, options.name),
    options.slidesName ?? options.name,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect
    .poll(() => viewport.evaluate((element) => getComputedStyle(element).scrollBehavior))
    .toBe("auto");
}

export async function assertCarouselForcedColorsFocus(
  page: Page,
  options: CarouselContractOptions,
) {
  const root = carouselRoot(page, options.name);
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  const next = root.getByRole("button", {
    name: options.nextName ?? "Next slide",
    exact: true,
  });
  await next.focus();
  await expect(next).toBeFocused();
  expect(await next.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
}

export async function assertCarouselStyle(page: Page, options: CarouselContractOptions) {
  await assertCarouselScrollSnapStyle(page, options);
  await assertCarouselReducedMotionStyle(page, options);
  await assertCarouselForcedColorsFocus(page, options);
}

/** Register Carousel's observable Definition against a consumer-owned route. */
export function carouselContract(options: CarouselContractRunnerOptions): void {
  test.describe(
    `Carousel / Component Contract / ${options.name}`,
    {
      tag: [
        "@definition",
        "@carousel",
        "@component-contract",
        ...(options.fixture ? [`@fixture-${options.fixture}`] : []),
      ],
      annotation: [
        ...carouselContractReferences,
        componentContractAnnotation(options.definition),
        componentContractRequirementsAnnotation(carouselContractRequirementIds),
      ],
    },
    () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(options.url);
      });

      async function CAR_CONTRACT_01({ page }: { page: Page }) {
        await assertCarouselSemantics(page, options);
      }

      async function CAR_CONTRACT_02({ page }: { page: Page }) {
        await assertCarouselInteraction(page, options);
        await assertCarouselLoopPolicy(page, options);
      }

      test(
        "Exposes a named carousel, its accepted named slide, controls, and position status",
        {
          tag: ["@semantics", `@${CAR_CONTRACT_01.name}`],
        },
        CAR_CONTRACT_01,
      );

      test(
        "Navigation visits ordered named slides, honors bounded and looping edges, announces position, and retains focus",
        {
          tag: ["@interaction", "@state", "@focus", `@${CAR_CONTRACT_02.name}`],
        },
        CAR_CONTRACT_02,
      );

      async function CAR_CONTRACT_03({ page }: { page: Page }) {
        await assertCarouselDisabledPolicy(page, options);
      }

      test(
        "Disabled blocks user navigation while accepting external state",
        {
          tag: ["@state", "@interaction", `@${CAR_CONTRACT_03.name}`],
        },
        CAR_CONTRACT_03,
      );

      async function CAR_CONTRACT_04({ page }: { page: Page }) {
        await assertCarouselControlledState(page, options);
      }

      test(
        "External state stays authoritative, derives a bounded view without write-back, and preserves rejected positions",
        {
          tag: ["@state", "@interaction", "@focus", `@${CAR_CONTRACT_04.name}`],
        },
        CAR_CONTRACT_04,
      );

      async function CAR_CONTRACT_05({ page }: { page: Page }) {
        await assertCarouselManualPolicy(page, options);
      }

      test(
        "Remains manual and exposes its accepted position through a polite atomic status",
        {
          tag: ["@semantics", "@state", `@${CAR_CONTRACT_05.name}`],
        },
        CAR_CONTRACT_05,
      );
    },
  );

  if (options.includeStandardImplementation !== false)
    test.describe(
      `Carousel / Implementation / ${options.name}`,
      {
        tag: [
          "@definition",
          "@carousel",
          "@implementation",
          ...(options.fixture ? [`@fixture-${options.fixture}`] : []),
        ],
        annotation: [
          ...nativeScrollCarouselImplementationReferences,
          componentImplementationAnnotation(options.definition),
          componentImplementationRequirementsAnnotation(
            nativeScrollCarouselImplementationRequirementIds,
          ),
        ],
      },
      () => {
        test.beforeEach(async ({ page }) => {
          await page.goto(options.url);
        });

        async function CAR_IMPLEMENTATION_01({ page }: { page: Page }) {
          await assertNativeScrollCarouselSemantics(page, options);
        }

        async function CAR_IMPLEMENTATION_02({ page }: { page: Page }) {
          await assertNativeScrollCarouselInteraction(page, options);
        }

        async function CAR_IMPLEMENTATION_04({ page }: { page: Page }) {
          await assertCarouselAnatomy(page, options);
        }

        async function CAR_IMPLEMENTATION_05({ page }: { page: Page }) {
          await assertCarouselScrollSnapStyle(page, options);
        }

        test(
          "Makes the native scroll viewport keyboard reachable",
          {
            tag: ["@semantics", "@focus", `@${CAR_IMPLEMENTATION_01.name}`],
          },
          CAR_IMPLEMENTATION_01,
        );

        test(
          "Browser scrolling reconciles the model to the nearest owned slide",
          {
            tag: ["@interaction", "@state", `@${CAR_IMPLEMENTATION_02.name}`],
          },
          CAR_IMPLEMENTATION_02,
        );

        async function CAR_IMPLEMENTATION_03({ page }: { page: Page }) {
          await assertNativeScrollCarouselDisabledProfile(page, options);
        }

        test(
          "Disables native viewport navigation and restores its accepted position",
          {
            tag: ["@semantics", "@state", "@interaction", `@${CAR_IMPLEMENTATION_03.name}`],
          },
          CAR_IMPLEMENTATION_03,
        );

        test(
          "Scopes slide discovery to the marked native scroll viewport",
          {
            tag: ["@anatomy", `@${CAR_IMPLEMENTATION_04.name}`],
          },
          CAR_IMPLEMENTATION_04,
        );

        test(
          "Preserves one-slide native scroll snap geometry",
          {
            tag: ["@style", `@${CAR_IMPLEMENTATION_05.name}`],
          },
          CAR_IMPLEMENTATION_05,
        );

        async function CAR_IMPLEMENTATION_06({ page }: { page: Page }) {
          await assertCarouselReducedMotionStyle(page, options);
        }

        test(
          "Removes smooth scrolling when reduced motion is requested",
          {
            tag: ["@style", `@${CAR_IMPLEMENTATION_06.name}`],
          },
          CAR_IMPLEMENTATION_06,
        );

        async function CAR_IMPLEMENTATION_07({ page }: { page: Page }) {
          await assertCarouselForcedColorsFocus(page, options);
        }

        test(
          "Keeps navigation focus visible in forced colors",
          {
            tag: ["@style", "@focus", `@${CAR_IMPLEMENTATION_07.name}`],
          },
          CAR_IMPLEMENTATION_07,
        );

        async function CAR_IMPLEMENTATION_08({ page }: { page: Page }) {
          await assertNativeScrollCarouselControlledPosition(page, options);
        }

        test(
          "Reconciles accepted controlled state into the native scroll position",
          {
            tag: ["@state", "@interaction", `@${CAR_IMPLEMENTATION_08.name}`],
          },
          CAR_IMPLEMENTATION_08,
        );
      },
    );
}
