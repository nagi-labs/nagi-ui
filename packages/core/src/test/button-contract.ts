import { expect, test, type Locator, type Page } from "@playwright/test";
import { inspectAnatomy, type ComponentDefinition } from "../definition.ts";
import {
  componentContractAnnotation,
  componentContractRequirementsAnnotation,
  componentImplementationAnnotation,
  componentImplementationRequirementsAnnotation,
} from "./definition-contract.ts";

const buttonContractRequirementIds = [
  "BTN_CONTRACT_01",
  "BTN_CONTRACT_02",
  "BTN_CONTRACT_03",
  "BTN_CONTRACT_04",
  "BTN_CONTRACT_05",
  "BTN_CONTRACT_06",
] as const;

const nativeButtonImplementationRequirementIds = [
  "BTN_IMPLEMENTATION_01",
  "BTN_IMPLEMENTATION_03",
  "BTN_IMPLEMENTATION_04",
] as const;

export interface ButtonContractOptions {
  /** The package or owned Definition that this rendered fixture claims. */
  definition: ComponentDefinition;
  /** Runner metadata used to prove the portable Contract against both forms. */
  fixture?: "package" | "owned";
  /** Set false when a custom implementation supplies its own Implementation suite. */
  includeStandardImplementation?: boolean;
  /** Consumer route rendering the package or owned Button examples. */
  url: string;
  /** Enabled Button used for native semantics and anatomy. */
  name: string;
  /** Native-disabled Button proving the unavailable policy. */
  nativeDisabledName: string;
  /** Focusable-disabled example and a consumer-visible activation counter. */
  focusableDisabled: {
    name: string;
    statusName: string;
  };
  /** Enabled native activation fixture with a consumer-owned click counter. */
  activation: {
    name: string;
    statusName: string;
    attribute: { name: string; value: string };
  };
  /** Button, submit, and reset intents observed through one owning form. */
  submission: {
    defaultName: string;
    name: string;
    resetName: string;
    inputName: string;
    initialInputValue: string;
    statusName: string;
    initialStatus: string;
    expected: string;
  };
  /** Button whose authored public CSS axes must survive compilation. */
  style: {
    name: string;
    axes: Readonly<Record<string, string>>;
    compiledAxes?: readonly string[];
  };
}

function namedButton(page: Page, name: string): Locator {
  return page.getByRole("button", { name, exact: true });
}

function namedStatus(page: Page, name: string): Locator {
  return page.getByRole("status", { name, exact: true });
}

const buttonContractReferences = [
  {
    type: "reference",
    description: "https://www.w3.org/WAI/ARIA/apg/patterns/button/",
  },
  {
    type: "reference",
    description: "https://www.w3.org/TR/accname-1.1/",
  },
];

const nativeButtonImplementationReferences = [
  {
    type: "reference",
    description: "https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element",
  },
];

export async function assertButtonSemantics(page: Page, options: ButtonContractOptions) {
  const button = namedButton(page, options.name);
  await expect(button).toBeVisible();
}

export async function assertNativeButtonSemantics(page: Page, options: ButtonContractOptions) {
  const button = namedButton(page, options.name);
  await expect(button).toHaveJSProperty("tagName", "BUTTON");
  await expect(button).toHaveAttribute("type", "button");
  const defaultAction = namedButton(page, options.submission.defaultName);
  await expect(defaultAction).toHaveJSProperty("tagName", "BUTTON");
  await expect(defaultAction).toHaveAttribute("type", "button");
  const submit = namedButton(page, options.submission.name);
  await expect(submit).toHaveJSProperty("tagName", "BUTTON");
  await expect(submit).toHaveAttribute("type", "submit");
  const reset = namedButton(page, options.submission.resetName);
  await expect(reset).toHaveJSProperty("tagName", "BUTTON");
  await expect(reset).toHaveAttribute("type", "reset");
}

export async function assertButtonAnatomy(page: Page, options: ButtonContractOptions) {
  const button = namedButton(page, options.name);
  expect(await button.evaluate(inspectAnatomy, options.definition.anatomy)).toEqual([]);
}

export async function assertButtonDisabledPolicy(page: Page, options: ButtonContractOptions) {
  await expect(namedButton(page, options.nativeDisabledName)).toBeDisabled();
  await assertFocusableDisabledButton(page, options.focusableDisabled);
}

export async function assertFocusableDisabledButton(
  page: Page,
  focusable: ButtonContractOptions["focusableDisabled"],
) {
  const button = namedButton(page, focusable.name);
  const status = namedStatus(page, focusable.statusName);
  const before = await status.textContent();
  await expect(button).toHaveAttribute("aria-disabled", "true");
  expect(await button.getAttribute("disabled")).toBeNull();
  await button.focus();
  await expect(button).toBeFocused();
  await button.click({ force: true });
  await expect(status).toHaveText(before ?? "");
}

export async function assertButtonSubmission(page: Page, options: ButtonContractOptions) {
  const submission = options.submission;
  const status = namedStatus(page, submission.statusName);
  const input = page.getByRole("textbox", { name: submission.inputName, exact: true });
  await input.fill("changed");
  await namedButton(page, submission.defaultName).click();
  await expect(status).toHaveText(submission.initialStatus);
  await expect(input).toHaveValue("changed");
  await namedButton(page, submission.resetName).click();
  await expect(status).toHaveText(submission.initialStatus);
  await expect(input).toHaveValue(submission.initialInputValue);
  await namedButton(page, submission.name).click();
  await expect(status).toHaveText(submission.expected);
}

export async function assertButtonActivation(page: Page, options: ButtonContractOptions) {
  const activation = options.activation;
  const button = namedButton(page, activation.name);
  const status = namedStatus(page, activation.statusName);
  await expect(button).toHaveAttribute(activation.attribute.name, activation.attribute.value);
  await expect(status).toHaveText("0");
  await button.click();
  await expect(status).toHaveText("1");
  await button.focus();
  await button.press("Enter");
  await expect(status).toHaveText("2");
  await expect(button).toBeFocused();
  await button.press("Space");
  await expect(status).toHaveText("3");
  await expect(button).toBeFocused();
}

export async function assertButtonStyleAxes(page: Page, options: ButtonContractOptions) {
  const style = options.style;
  const button = namedButton(page, style.name);
  const actual = await button.evaluate((element, names) => {
    const computed = getComputedStyle(element);
    return Object.fromEntries(names.map((name) => [name, computed.getPropertyValue(name).trim()]));
  }, Object.keys(style.axes));
  expect(actual).toEqual(style.axes);
}

export async function assertButtonForcedColorsFocus(page: Page, options: ButtonContractOptions) {
  const style = options.style;
  const button = namedButton(page, style.name);
  await page.emulateMedia({ forcedColors: "active" });
  await button.focus();
  const outline = await button.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outline).not.toBe("none");
}

export async function assertButtonStyle(page: Page, options: ButtonContractOptions) {
  await assertButtonStyleAxes(page, options);
  await assertButtonForcedColorsFocus(page, options);
}

/** Register Button's observable Definition against a consumer-owned route. */
export function buttonContract(options: ButtonContractOptions): void {
  test.describe(
    `Button / Component Contract / ${options.name}`,
    {
      tag: [
        "@definition",
        "@button",
        "@component-contract",
        ...(options.fixture ? [`@fixture-${options.fixture}`] : []),
      ],
      annotation: [
        ...buttonContractReferences,
        componentContractAnnotation(options.definition),
        componentContractRequirementsAnnotation(buttonContractRequirementIds),
      ],
    },
    () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(options.url);
      });

      async function BTN_CONTRACT_01({ page }: { page: Page }) {
        await assertButtonSemantics(page, options);
      }

      test(
        "Exposes one visible, named button",
        {
          tag: ["@semantics", `@${BTN_CONTRACT_01.name}`],
        },
        BTN_CONTRACT_01,
      );

      async function BTN_CONTRACT_02({ page }: { page: Page }) {
        await assertButtonDisabledPolicy(page, options);
      }

      test(
        "Exposes unavailable controls and suppresses their activation",
        {
          tag: ["@semantics", "@state", "@interaction", `@${BTN_CONTRACT_02.name}`],
        },
        BTN_CONTRACT_02,
      );

      async function BTN_CONTRACT_03({ page }: { page: Page }) {
        await assertButtonActivation(page, options);
      }

      test(
        "Accepts pointer, Enter, and Space activation while keyboard focus remains on the control",
        {
          tag: ["@interaction", "@focus", `@${BTN_CONTRACT_03.name}`],
        },
        BTN_CONTRACT_03,
      );

      async function BTN_CONTRACT_06({ page }: { page: Page }) {
        await assertButtonSubmission(page, options);
      }

      test(
        "Preserves button, submit, and reset intent in the owning form",
        {
          tag: ["@interaction", "@state", `@${BTN_CONTRACT_06.name}`],
        },
        BTN_CONTRACT_06,
      );

      async function BTN_CONTRACT_04({ page }: { page: Page }) {
        await assertButtonStyleAxes(page, options);
      }

      test(
        "Exposes the authored style axes as computed properties",
        {
          tag: ["@style", `@${BTN_CONTRACT_04.name}`],
        },
        BTN_CONTRACT_04,
      );

      async function BTN_CONTRACT_05({ page }: { page: Page }) {
        await assertButtonForcedColorsFocus(page, options);
      }

      test(
        "Keeps keyboard focus visible in forced colors",
        {
          tag: ["@style", "@focus", `@${BTN_CONTRACT_05.name}`],
        },
        BTN_CONTRACT_05,
      );
    },
  );

  if (options.includeStandardImplementation !== false)
    test.describe(
      `Button / Implementation / ${options.name}`,
      {
        tag: [
          "@definition",
          "@button",
          "@implementation",
          ...(options.fixture ? [`@fixture-${options.fixture}`] : []),
        ],
        annotation: [
          ...nativeButtonImplementationReferences,
          componentImplementationAnnotation(options.definition),
          componentImplementationRequirementsAnnotation(nativeButtonImplementationRequirementIds),
        ],
      },
      () => {
        test.beforeEach(async ({ page }) => {
          await page.goto(options.url);
        });

        async function BTN_IMPLEMENTATION_01({ page }: { page: Page }) {
          await assertNativeButtonSemantics(page, options);
        }

        async function BTN_IMPLEMENTATION_03({ page }: { page: Page }) {
          await assertButtonAnatomy(page, options);
        }

        test(
          "Uses native button elements with explicit types",
          {
            tag: ["@semantics", `@${BTN_IMPLEMENTATION_01.name}`],
          },
          BTN_IMPLEMENTATION_01,
        );

        test(
          "Binds behavior and the root part to the same element",
          {
            tag: ["@anatomy", `@${BTN_IMPLEMENTATION_03.name}`],
          },
          BTN_IMPLEMENTATION_03,
        );

        {
          async function BTN_IMPLEMENTATION_04({ page }: { page: Page }) {
            const button = namedButton(page, options.style.name);
            for (const name of options.style.compiledAxes ?? []) {
              await expect
                .poll(() =>
                  button.evaluate(
                    (element, property) =>
                      getComputedStyle(element).getPropertyValue(property).trim(),
                    name,
                  ),
                )
                .not.toBe("");
            }
            expect(await button.getAttribute("data-variant")).toBeNull();
            expect(await button.getAttribute("data-size")).toBeNull();
            expect((await button.getAttribute("class")) ?? "").not.toMatch(/n-button--/u);
          }

          test(
            "Compiles local axes without modifier attributes or classes",
            {
              tag: ["@style", `@${BTN_IMPLEMENTATION_04.name}`],
            },
            BTN_IMPLEMENTATION_04,
          );
        }
      },
    );
}
