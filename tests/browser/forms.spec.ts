import { expect, test, type Locator, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/forms.html");
});

async function json(locator: Locator): Promise<Record<string, unknown>> {
  return JSON.parse((await locator.textContent()) ?? "{}");
}

async function dragRangeThumb(
  page: Page,
  input: Locator,
  fromRatio: number,
  toRatio: number,
) {
  const box = await input.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * fromRatio, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * toRatio, y, { steps: 5 });
  await page.mouse.up();
}

test("native controls expose initial state and submit browser FormData", async ({ page }) => {
  const form = page.locator("#alignment-form");
  const external = page.getByLabel("External note");

  await expect(page.getByLabel("Full name")).toHaveValue("Ada Lovelace");
  await expect(page.getByRole("checkbox", { name: "Accept the agreement" })).not.toBeChecked();
  await expect(page.getByRole("switch", { name: "Product updates" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Email" })).toBeChecked();
  await expect(page.getByRole("combobox", { name: "Plan", exact: true })).toHaveValue(
    "standard",
  );
  await expect(page.getByRole("slider", { name: "Volume", exact: true })).toHaveValue("40");
  await expect(page.getByRole("combobox", { name: "Framework", exact: true })).toHaveValue("v");
  await expect(page.getByTestId("framework-key")).toHaveText("vue");
  await expect(page.getByRole("combobox", { name: "Disabled framework" })).toBeDisabled();

  expect(await external.evaluate((element) => element.closest("form"))).toBeNull();
  await expect(external).toHaveAttribute("form", "alignment-form");

  await form.getByRole("button", { name: "Submit form" }).click();
  expect(await json(page.getByTestId("submission"))).toEqual({
    fullName: "Ada Lovelace",
    marketing: "enabled",
    contact: "email",
    plan: "standard",
    volume: "40",
    framework: "vue",
    externalNote: "outside the form tree",
  });
});

test("native checkbox, radio, select, and slider keep platform behavior", async ({ page }) => {
  const agreement = page.getByRole("checkbox", { name: "Accept the agreement" });
  expect(await agreement.evaluate((element) => (element as HTMLInputElement).indeterminate)).toBe(true);

  await agreement.click();
  await expect(agreement).toBeChecked();
  expect(await agreement.evaluate((element) => (element as HTMLInputElement).indeterminate)).toBe(false);

  await page.getByRole("radio", { name: "SMS" }).check();
  await expect(page.getByRole("radio", { name: "SMS" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Email" })).not.toBeChecked();

  const plan = page.getByRole("combobox", { name: "Plan", exact: true });
  await expect(plan.locator('option[value="legacy"]')).toBeDisabled();
  await plan.selectOption("pro");
  await expect(plan).toHaveValue("pro");

  const slider = page.getByRole("slider", { name: "Volume", exact: true });
  await slider.focus();
  await slider.press("ArrowRight");
  await expect(slider).toHaveValue("50");

  const state = await json(page.getByTestId("model-state"));
  expect(state).toMatchObject({
    agreement: true,
    agreementIndeterminate: false,
    contact: "sms",
    plan: "pro",
    volume: 50,
  });
});

test("Rating and FileInput keep keyboard, FormData, and reset browser-owned", async ({
  page,
}) => {
  const form = page.locator("#interactive-form");
  const rating3 = page.getByRole("radio", { name: "3 stars" });
  const rating4 = page.getByRole("radio", { name: "4 stars" });
  const fileInput = page.getByLabel("Release attachment");

  await expect(rating3).toBeChecked();
  await rating3.focus();
  await rating3.press("ArrowRight");
  await expect(rating4).toBeChecked();
  await expect(page.getByTestId("rating-value")).toHaveText("rating: 4");

  await fileInput.setInputFiles({
    name: "release-notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Nagi UI release"),
  });
  expect(
    await fileInput.evaluate((input: HTMLInputElement) => ({
      count: input.files?.length ?? 0,
      name: input.files?.[0]?.name ?? "",
    })),
  ).toEqual({ count: 1, name: "release-notes.txt" });
  expect(
    await form.evaluate((element: HTMLFormElement) => {
      const data = new FormData(element);
      const file = data.get("attachment");
      return {
        rating: data.get("rating"),
        fileName: file instanceof File ? file.name : "",
      };
    }),
  ).toEqual({ rating: "4", fileName: "release-notes.txt" });

  await form.getByRole("button", { name: "Reset interactive controls" }).click();
  await expect(rating3).toBeChecked();
  await expect(page.getByTestId("rating-value")).toHaveText("rating: 3");
  expect(
    await fileInput.evaluate((input: HTMLInputElement) => input.files?.length ?? 0),
  ).toBe(0);
});

test("Rating keeps the native selected control visible in forced colors", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });

  const selected = page.getByRole("radio", { name: "3 stars" });
  await expect(selected).toBeVisible();
  await expect(selected).toBeChecked();
  await expect(page.locator(".n-rating .icon").first()).toBeHidden();
});

test("native form controls retain visible focus outlines in forced colors", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });

  const controls = [
    page.getByLabel("Full name"),
    page.getByLabel("External note"),
    page.getByRole("checkbox", { name: "Accept the agreement" }),
    page.getByRole("combobox", { name: "Plan", exact: true }),
    page.getByRole("combobox", { name: "Framework", exact: true }),
    page.getByRole("radio", { name: "Email" }),
    page.getByRole("slider", { name: "Volume", exact: true }),
    page.getByRole("slider", { name: "Minimum price" }),
    page.getByRole("slider", { name: "Maximum price" }),
    page.getByTestId("release-file"),
    page.getByRole("switch", { name: "Product updates" }),
  ];

  for (const control of controls) {
    await control.focus();
    expect(
      await control.evaluate((element) => {
        const style = getComputedStyle(element);
        return { style: style.outlineStyle, width: style.outlineWidth };
      }),
    ).toEqual({ style: "solid", width: "2px" });
  }
});

test("FileInput presents one native chooser button instead of a split field", async ({
  page,
}) => {
  const fileInput = page.getByTestId("release-file");
  const styles = await fileInput.evaluate((element) => ({
    inputBorder: getComputedStyle(element).borderTopWidth,
    inputBackground: getComputedStyle(element).backgroundColor,
    buttonBorder: getComputedStyle(element, "::file-selector-button").borderTopWidth,
  }));

  expect(styles).toEqual({
    inputBorder: "0px",
    inputBackground: "rgba(0, 0, 0, 0)",
    buttonBorder: "1px",
  });
});

test("NumberField and InputGroup preserve native step, form, and reset behavior", async ({
  page,
}) => {
  const form = page.locator("#interactive-form");
  const seats = page.getByRole("spinbutton", { name: "Seats" });
  const projectUrl = page.getByRole("textbox", { name: "Project URL" });

  await expect(seats).toHaveValue("2");
  await page.getByRole("button", { name: "Increase seats" }).click();
  await expect(seats).toHaveValue("3");
  await seats.press("ArrowUp");
  await expect(seats).toHaveValue("4");
  await expect(page.getByTestId("seats-value")).toHaveText("seats: 4");
  await page.getByRole("button", { name: "Decrease seats" }).click();
  await expect(seats).toHaveValue("3");

  await expect(projectUrl).toHaveValue("nagi-ui");
  await projectUrl.fill("owned-source");
  expect(
    await form.evaluate((element: HTMLFormElement) =>
      Object.fromEntries(new FormData(element).entries()),
    ),
  ).toMatchObject({ seats: "3", projectUrl: "owned-source" });

  await form.getByRole("button", { name: "Reset interactive controls" }).click();
  await expect(seats).toHaveValue("2");
  await expect(page.getByTestId("seats-value")).toHaveText("seats: 2");
  await expect(projectUrl).toHaveValue("nagi-ui");
});

test("RangeSlider keeps two native thumbs ordered, form-associated, and resettable", async ({
  page,
}) => {
  const form = page.locator("#interactive-form");
  const lower = page.getByRole("slider", { name: "Minimum price" });
  const upper = page.getByRole("slider", { name: "Maximum price" });

  await expect(lower).toHaveValue("25");
  await expect(upper).toHaveValue("75");
  const rangeFieldset = page.locator(".n-range-slider");
  await rangeFieldset.evaluate((element) => {
    element.setAttribute("data-input-events", "0");
    element.setAttribute("data-change-events", "0");
    element.addEventListener("input", (event) => {
      const count = Number(element.getAttribute("data-input-events")) + 1;
      element.setAttribute("data-input-events", String(count));
      element.setAttribute("data-last-input-target", (event.target as HTMLInputElement).id);
    });
    element.addEventListener("change", (event) => {
      const count = Number(element.getAttribute("data-change-events")) + 1;
      element.setAttribute("data-change-events", String(count));
      element.setAttribute("data-last-change-target", (event.target as HTMLInputElement).id);
    });
  });
  await lower.focus();
  await page.keyboard.press("Tab");
  await expect(upper).toBeFocused();

  await dragRangeThumb(page, lower, 0.25, 0.35);
  await dragRangeThumb(page, upper, 0.75, 0.65);
  await expect(lower).toHaveValue("35");
  await expect(upper).toHaveValue("65");
  await expect(page.getByTestId("price-range-value")).toHaveText("price range: 35–65");
  expect(Number(await rangeFieldset.getAttribute("data-input-events"))).toBeGreaterThan(1);
  await expect(rangeFieldset).toHaveAttribute("data-change-events", "2");
  await expect(rangeFieldset).toHaveAttribute(
    "data-last-input-target",
    await upper.getAttribute("id") ?? "",
  );
  await expect(rangeFieldset).toHaveAttribute(
    "data-last-change-target",
    await upper.getAttribute("id") ?? "",
  );
  expect(
    await form.evaluate((element: HTMLFormElement) =>
      Object.fromEntries(new FormData(element).entries()),
    ),
  ).toMatchObject({ priceMin: "35", priceMax: "65" });

  await lower.focus();
  await lower.press("End");
  await expect(lower).toHaveValue("65");
  await expect(upper).toHaveValue("65");
  await expect(page.getByTestId("price-range-value")).toHaveText("price range: 65–65");

  await dragRangeThumb(page, lower, 0.6, 0.45);
  await expect(lower).toHaveValue("45");
  await expect(upper).toHaveValue("65");

  await form.getByRole("button", { name: "Reset interactive controls" }).click();
  await expect(lower).toHaveValue("25");
  await expect(upper).toHaveValue("75");
  await expect(page.getByTestId("price-range-value")).toHaveText("price range: 25–75");

  await rangeFieldset.evaluate((element: HTMLFieldSetElement) => {
    element.disabled = true;
  });
  await dragRangeThumb(page, lower, 0.25, 0.5);
  await expect(lower).toHaveValue("25");
  await expect(upper).toHaveValue("75");
  await rangeFieldset.evaluate((element: HTMLFieldSetElement) => {
    element.disabled = false;
  });

  await form.getByRole("button", { name: "Narrow price bounds" }).click();
  await expect(lower).toHaveValue("40");
  await expect(upper).toHaveValue("60");
  await expect(lower).toHaveAttribute("min", "40");
  await expect(lower).toHaveAttribute("max", "60");
  await expect(upper).toHaveAttribute("min", "40");
  await expect(upper).toHaveAttribute("max", "60");
  await expect(page.getByTestId("price-range-value")).toHaveText("price range: 40–60");
  await lower.focus();
  await page.keyboard.press("Tab");
  await expect(upper).toBeFocused();

  await form.getByRole("button", { name: "Reset interactive controls" }).click();
  await expect(lower).toHaveValue("40");
  await expect(upper).toHaveValue("60");
});

test("Select and Slider adopt native initial sanitization and reset their canonical models", async ({
  page,
}) => {
  const form = page.locator("#interactive-form");
  const plan = page.getByRole("combobox", { name: "Native default plan" });
  const slider = page.getByRole("slider", { name: "Constrained volume" });

  await expect(plan).toHaveValue("standard");
  await expect(page.getByTestId("native-default-plan-value")).toHaveText(
    "native plan: standard",
  );
  await expect(slider).toHaveValue("19");
  await expect(page.getByTestId("constrained-volume-value")).toHaveText(
    "constrained volume: 19",
  );

  await page.getByRole("button", { name: "Remove initial plan option" }).click();
  await expect(plan).toHaveValue("pro");
  await expect(page.getByTestId("native-default-plan-value")).toHaveText("native plan: pro");
  await form.getByRole("button", { name: "Reset interactive controls" }).click();
  await expect(plan).toHaveValue("pro");
  await expect(page.getByTestId("native-default-plan-value")).toHaveText("native plan: pro");

  await page.reload();
  const reloadedForm = page.locator("#interactive-form");
  const reloadedPlan = page.getByRole("combobox", { name: "Native default plan" });
  const reloadedSlider = page.getByRole("slider", { name: "Constrained volume" });
  await reloadedPlan.selectOption("pro");
  await reloadedSlider.fill("13");
  await expect(page.getByTestId("native-default-plan-value")).toHaveText("native plan: pro");
  await expect(page.getByTestId("constrained-volume-value")).toHaveText(
    "constrained volume: 13",
  );

  await reloadedForm.getByRole("button", { name: "Reset interactive controls" }).click();
  await expect(reloadedPlan).toHaveValue("standard");
  await expect(page.getByTestId("native-default-plan-value")).toHaveText(
    "native plan: standard",
  );
  await expect(reloadedSlider).toHaveValue("19");
  await expect(page.getByTestId("constrained-volume-value")).toHaveText(
    "constrained volume: 19",
  );
});

test("InputGroup distinguishes action focus, forwards invalid state, and preserves narrow controls", async ({
  page,
}) => {
  const input = page.getByRole("textbox", { name: "Project URL" });
  const action = page.getByRole("button", { name: "Open" });
  const inputGroup = page.locator(".n-input-group");
  const numberField = page.locator(".n-number-field > .unit");
  const seats = page.getByRole("spinbutton", { name: "Seats" });

  await action.focus();
  await expect(action).toBeFocused();
  expect(
    await action.evaluate((element) => {
      const style = getComputedStyle(element);
      return { style: style.outlineStyle, width: style.outlineWidth };
    }),
  ).toEqual({ style: "solid", width: "2px" });

  await input.evaluate((element) => element.setAttribute("aria-invalid", "true"));
  expect(
    await inputGroup.evaluate((element) => {
      const probe = document.createElement("span");
      probe.style.color = "var(--nagi-color-danger)";
      element.append(probe);
      const matches =
        getComputedStyle(element).borderTopColor === getComputedStyle(probe).color;
      probe.remove();
      return matches;
    }),
  ).toBe(true);

  await inputGroup.evaluate((element: HTMLElement) => {
    element.style.inlineSize = "120px";
  });
  await numberField.evaluate((element: HTMLElement) => {
    element.style.inlineSize = "120px";
  });

  expect(
    await input.evaluate((element) => element.getBoundingClientRect().width),
  ).toBeGreaterThanOrEqual(30);
  expect(
    await seats.evaluate((element) => element.getBoundingClientRect().width),
  ).toBeGreaterThanOrEqual(30);
  const stepWidths = await numberField.locator("button").evaluateAll((buttons) =>
    buttons.map((button) => button.getBoundingClientRect().width),
  );
  expect(stepWidths).toEqual([32, 32]);
});

test("form reset restores native DOM and every controlled Vue model", async ({ page }) => {
  await page.getByLabel("Full name").fill("Grace Hopper");
  await page.getByRole("checkbox", { name: "Accept the agreement" }).click();
  await page.getByRole("switch", { name: "Product updates" }).click();
  await page.getByRole("radio", { name: "SMS" }).check();
  await page.getByRole("combobox", { name: "Plan", exact: true }).selectOption("pro");
  await page.getByRole("slider", { name: "Volume", exact: true }).fill("80");
  await page.getByLabel("External note").fill("changed outside");

  const framework = page.getByRole("combobox", { name: "Framework", exact: true });
  await framework.fill("sve");
  await page.getByRole("option", { name: "Svelte" }).click();
  await expect(page.getByTestId("framework-key")).toHaveText("svelte");

  await page.getByRole("button", { name: "Reset form" }).click();

  await expect(page.getByLabel("Full name")).toHaveValue("Ada Lovelace");
  const agreement = page.getByRole("checkbox", { name: "Accept the agreement" });
  await expect(agreement).not.toBeChecked();
  expect(await agreement.evaluate((element) => (element as HTMLInputElement).indeterminate)).toBe(true);
  await expect(page.getByRole("switch", { name: "Product updates" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Email" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "SMS" })).not.toBeChecked();
  await expect(page.getByRole("combobox", { name: "Plan", exact: true })).toHaveValue(
    "standard",
  );
  await expect(page.getByRole("slider", { name: "Volume", exact: true })).toHaveValue("40");
  await expect(page.getByLabel("External note")).toHaveValue("outside the form tree");
  await expect(framework).toHaveValue("v");
  await expect(page.getByTestId("framework-key")).toHaveText("vue");

  expect(await json(page.getByTestId("model-state"))).toEqual({
    fullName: "Ada Lovelace",
    agreement: false,
    agreementIndeterminate: true,
    marketing: true,
    contact: "email",
    plan: "standard",
    volume: 40,
    externalNote: "outside the form tree",
    frameworkInput: "v",
    frameworkKey: "vue",
  });
});

test("reset keeps pristine control DOM aligned when models are already initial", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Reset form" }).click();

  await expect(page.getByLabel("Full name")).toHaveValue("Ada Lovelace");
  await expect(page.getByRole("checkbox", { name: "Accept the agreement" })).not.toBeChecked();
  await expect(page.getByRole("switch", { name: "Product updates" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Email" })).toBeChecked();
  await expect(page.getByRole("combobox", { name: "Plan", exact: true })).toHaveValue(
    "standard",
  );
  await expect(page.getByRole("slider", { name: "Volume", exact: true })).toHaveValue("40");
  await expect(page.getByRole("combobox", { name: "Framework", exact: true })).toHaveValue(
    "v",
  );
});

test("preventDefault keeps a canceled native reset from changing DOM or models", async ({
  page,
}) => {
  const fullName = page.getByLabel("Full name");
  await fullName.fill("Grace Hopper");
  await page.locator("#alignment-form").evaluate((form) => {
    form.addEventListener("reset", (event) => event.preventDefault(), { once: true });
  });

  await page.getByRole("button", { name: "Reset form" }).click();

  await expect(fullName).toHaveValue("Grace Hopper");
  expect(await json(page.getByTestId("model-state"))).toMatchObject({
    fullName: "Grace Hopper",
  });
});

test("a changed external form owner rebinds reset synchronization", async ({ page }) => {
  const external = page.getByLabel("External note");
  await external.fill("changed outside");
  await page.getByRole("button", { name: "1. Assign to alternate form" }).click();
  await expect(external).toHaveAttribute("form", "alternate-form");

  await page.getByRole("button", { name: "Reset form" }).click();
  await expect(external).toHaveValue("changed outside");

  await page.getByRole("button", { name: "2. Reset alternate form" }).click();
  await expect(external).toHaveValue("outside the form tree");
  expect(await json(page.getByTestId("model-state"))).toMatchObject({
    externalNote: "outside the form tree",
  });
});

test("required input and committed combobox key participate in native validation", async ({
  page,
}) => {
  const fullName = page.getByLabel("Full name");
  await fullName.fill("");
  await page.getByRole("button", { name: "Submit form" }).click();
  await expect(fullName).toBeFocused();
  expect(await fullName.evaluate((element) => (element as HTMLInputElement).validity.valid)).toBe(false);
  await expect(page.getByTestId("submission")).toHaveText("No submission yet");

  await fullName.fill("Ada Lovelace");
  await page.getByRole("button", { name: "Clear framework" }).click();
  const framework = page.getByRole("combobox", { name: "Framework", exact: true });
  await expect(framework).toHaveValue("");
  await expect(page.getByTestId("framework-key")).toHaveText("none");
  await page.getByRole("heading", { name: "Native form controls" }).click();
  await page.getByRole("button", { name: "Submit form" }).click();
  await expect(framework).toBeFocused();
  expect(await framework.evaluate((element) => (element as HTMLInputElement).validity.valid)).toBe(false);
  await expect(page.getByTestId("submission")).toHaveText("No submission yet");
});

test("required Combobox validates the committed key rather than editable text", async ({
  page,
}) => {
  const framework = page.getByRole("combobox", { name: "Framework", exact: true });
  await framework.fill("");
  await page.getByRole("button", { name: "Submit form" }).click();

  expect(await json(page.getByTestId("submission"))).toMatchObject({ framework: "vue" });
  expect(await framework.evaluate((element) => (element as HTMLInputElement).validity.valid)).toBe(true);
});

test("progress, meter, and combobox loading, empty, clear, and read-only states are observable", async ({
  page,
}) => {
  const determinate = page.getByRole("progressbar", { name: "Build progress" });
  const indeterminate = page.getByRole("progressbar", { name: "Waiting for server" });
  await expect(determinate).toHaveAttribute("value", "0.65");
  await expect(determinate).toHaveAttribute("max", "1");
  await expect(indeterminate).not.toHaveAttribute("value");
  expect(await indeterminate.evaluate((element) => (element as HTMLProgressElement).position)).toBe(-1);

  const meter = page.getByRole("meter", { name: "Storage used" });
  await expect(meter).toHaveAttribute("value", "72");
  await expect(meter).toHaveAttribute("low", "35");
  await expect(meter).toHaveAttribute("high", "80");
  await expect(meter).toHaveAttribute("optimum", "20");

  await page.getByRole("combobox", { name: "Loading choices" }).click();
  await expect(page.getByRole("status", { name: "" }).filter({ hasText: "Loading frameworks…" })).toBeVisible();

  await page.getByRole("combobox", { name: "Empty choices" }).click();
  await expect(page.getByText("No matching framework", { exact: true })).toBeVisible();

  const readOnly = page.getByRole("combobox", { name: "Read-only choice" });
  await expect(readOnly).toHaveAttribute("readonly", "");
  await expect(page.getByRole("button", { name: /clear selection/i })).toHaveCount(0);
  await readOnly.click();
  await readOnly.press("ArrowDown");
  await readOnly.press("Enter");
  await expect(readOnly).toHaveValue("Svelte");
  await expect(page.getByTestId("read-only-key")).toHaveText("svelte");
});
