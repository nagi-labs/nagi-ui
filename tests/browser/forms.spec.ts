import { expect, test, type Locator } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/forms.html");
});

async function json(locator: Locator): Promise<Record<string, unknown>> {
  return JSON.parse((await locator.textContent()) ?? "{}");
}

test("native controls expose initial state and submit browser FormData", async ({ page }) => {
  const form = page.locator("#alignment-form");
  const external = page.getByLabel("External note");

  await expect(page.getByLabel("Full name")).toHaveValue("Ada Lovelace");
  await expect(page.getByRole("checkbox", { name: "Accept the agreement" })).not.toBeChecked();
  await expect(page.getByRole("switch", { name: "Product updates" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Email" })).toBeChecked();
  await expect(page.getByRole("combobox", { name: "Plan" })).toHaveValue("standard");
  await expect(page.getByRole("slider", { name: "Volume" })).toHaveValue("40");
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

  const plan = page.getByRole("combobox", { name: "Plan" });
  await expect(plan.locator('option[value="legacy"]')).toBeDisabled();
  await plan.selectOption("pro");
  await expect(plan).toHaveValue("pro");

  const slider = page.getByRole("slider", { name: "Volume" });
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

test("form reset restores native DOM and every controlled Vue model", async ({ page }) => {
  await page.getByLabel("Full name").fill("Grace Hopper");
  await page.getByRole("checkbox", { name: "Accept the agreement" }).click();
  await page.getByRole("switch", { name: "Product updates" }).click();
  await page.getByRole("radio", { name: "SMS" }).check();
  await page.getByRole("combobox", { name: "Plan" }).selectOption("pro");
  await page.getByRole("slider", { name: "Volume" }).fill("80");
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
  await expect(page.getByRole("combobox", { name: "Plan" })).toHaveValue("standard");
  await expect(page.getByRole("slider", { name: "Volume" })).toHaveValue("40");
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
  await expect(page.getByRole("combobox", { name: "Plan" })).toHaveValue("standard");
  await expect(page.getByRole("slider", { name: "Volume" })).toHaveValue("40");
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
