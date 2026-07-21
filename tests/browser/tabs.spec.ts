import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const verifierUrl = `/@fs${path.join(repo, "packages/core/src/verify-dom.ts")}`;
const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

test.beforeEach(async ({ page }) => {
  await page.goto("/tabs.html");
});

function tablist(page: Page, name: string): Locator {
  return page.getByRole("tablist", { name });
}

async function selectedName(list: Locator): Promise<string> {
  return (await list.getByRole("tab", { selected: true }).textContent())?.trim() ?? "";
}

test("automatic horizontal navigation skips disabled tabs, wraps, and handles Home/End", async ({
  page,
}) => {
  const list = tablist(page, "Account sections");
  const overview = list.getByRole("tab", { name: "Overview" });
  const activity = list.getByRole("tab", { name: "Activity" });
  const settings = list.getByRole("tab", { name: "Settings" });
  const billing = list.getByRole("tab", { name: "Billing" });

  await overview.focus();
  await overview.press("ArrowRight");
  await expect(settings).toBeFocused();
  await expect(settings).toHaveAttribute("aria-selected", "true");
  await expect(activity).toBeDisabled();
  await expect(page.getByTestId("automatic-state")).toHaveText("settings");

  await settings.press("End");
  await expect(billing).toBeFocused();
  await expect(page.getByTestId("automatic-state")).toHaveText("billing");
  await billing.press("ArrowRight");
  await expect(overview).toBeFocused();
  await overview.press("ArrowLeft");
  await expect(billing).toBeFocused();
  await billing.press("Home");
  await expect(overview).toBeFocused();
  expect(await selectedName(list)).toBe("Overview");
});

test("manual vertical navigation separates focus from selection and ignores cross-axis arrows", async ({
  page,
}) => {
  const list = tablist(page, "Profile sections");
  const profile = list.getByRole("tab", { name: "Profile" });
  const sessions = list.getByRole("tab", { name: "Sessions" });

  await profile.focus();
  await profile.press("ArrowRight");
  await expect(profile).toBeFocused();
  await expect(page.getByTestId("manual-state")).toHaveText("profile");

  await profile.press("ArrowDown");
  await expect(sessions).toBeFocused();
  await expect(sessions).toHaveAttribute("aria-selected", "false");
  await expect(page.getByTestId("manual-state")).toHaveText("profile");
  await sessions.press("Enter");
  await expect(page.getByTestId("manual-state")).toHaveText("sessions");

  await sessions.press("ArrowUp");
  await expect(profile).toBeFocused();
  await expect(page.getByTestId("manual-state")).toHaveText("sessions");
  await profile.press(" ");
  await expect(page.getByTestId("manual-state")).toHaveText("profile");
});

test("automatic horizontal tabs ignore vertical arrows", async ({ page }) => {
  const list = tablist(page, "Account sections");
  const overview = list.getByRole("tab", { name: "Overview" });
  await overview.focus();
  await overview.press("ArrowDown");
  await expect(overview).toBeFocused();
  await expect(page.getByTestId("automatic-state")).toHaveText("overview");
});

test("RTL horizontal navigation reverses ArrowLeft and ArrowRight", async ({ page }) => {
  const list = tablist(page, "RTL sections");
  const start = list.getByRole("tab", { name: "Start" });
  const middle = list.getByRole("tab", { name: "Middle" });
  const end = list.getByRole("tab", { name: "End" });

  await expect(list).toHaveAttribute("dir", "rtl");
  await start.focus();
  await start.press("ArrowLeft");
  await expect(middle).toBeFocused();
  await expect(page.getByTestId("rtl-state")).toHaveText("middle");
  await middle.press("ArrowRight");
  await expect(start).toBeFocused();
  await start.press("ArrowRight");
  await expect(end).toBeFocused();
  await expect(page.getByTestId("rtl-state")).toHaveText("end");
});

test("Tab order has one tab stop in the tablist, then the selected panel", async ({ page }) => {
  const before = page.getByTestId("before-tabs");
  const after = page.getByTestId("after-tabs");
  const list = tablist(page, "Account sections");
  const tabs = list.getByRole("tab");

  await before.focus();
  await page.keyboard.press("Tab");
  await expect(list.getByRole("tab", { name: "Overview" })).toBeFocused();
  expect(await tabs.evaluateAll((elements) =>
    elements.filter((element) => element.getAttribute("tabindex") === "0").length,
  )).toBe(1);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("tabpanel", { name: "Overview" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(after).toBeFocused();
});

test("removing the focused selected tab repairs selection and DOM focus", async ({ page }) => {
  const list = tablist(page, "Dynamic sections");
  const beta = list.getByRole("tab", { name: "Beta" });
  const remove = page.getByRole("button", { name: "Remove selected dynamic tab" });

  await beta.focus();
  await expect(page.getByTestId("dynamic-state")).toHaveText("beta");
  await remove.evaluate((button: HTMLButtonElement) => button.click());
  await expect(list.getByRole("tab", { name: "Beta" })).toHaveCount(0);
  await expect(page.getByTestId("dynamic-state")).toHaveText("gamma");
  await expect(list.getByRole("tab", { name: "Gamma" })).toBeFocused();
  await expect(page.getByTestId("dynamic-items-state")).toHaveText("alpha,gamma,delta");
});

test("disabling the focused selected tab repairs selection and DOM focus", async ({ page }) => {
  const list = tablist(page, "Dynamic sections");
  const beta = list.getByRole("tab", { name: "Beta" });
  const disable = page.getByRole("button", { name: "Disable selected dynamic tab" });

  await beta.focus();
  await expect(page.getByTestId("dynamic-state")).toHaveText("beta");
  await disable.evaluate((button: HTMLButtonElement) => button.click());
  await expect(beta).toBeDisabled();
  await expect(page.getByTestId("dynamic-state")).toHaveText("gamma");
  await expect(list.getByRole("tab", { name: "Gamma" })).toBeFocused();
  await expect(page.getByTestId("dynamic-items-state")).toHaveText(
    "alpha,beta:disabled,gamma,delta",
  );
});

test("tab and panel ID references are reciprocal and runtime verification is clean", async ({
  page,
}) => {
  for (const tab of await page.getByRole("tab").all()) {
    const panelId = await tab.getAttribute("aria-controls");
    const tabId = await tab.getAttribute("id");
    expect(panelId).toBeTruthy();
    expect(tabId).toBeTruthy();
    const panel = page.locator(`[id="${panelId ?? ""}"]`);
    await expect(panel).toHaveAttribute("role", "tabpanel");
    await expect(panel).toHaveAttribute("aria-labelledby", tabId ?? "");
  }

  const codes = await page.evaluate(async (url) => {
    const { verifyNagiDom } = await import(url);
    return verifyNagiDom(document).map((issue: { code: string }) => issue.code);
  }, verifierUrl);
  expect(codes).toEqual([]);
});

test("Tabs playground is axe-clean after keyboard and dynamic collection changes", async ({
  page,
}) => {
  const automatic = tablist(page, "Account sections");
  await automatic.getByRole("tab", { name: "Overview" }).press("ArrowRight");
  const manual = tablist(page, "Profile sections");
  await manual.getByRole("tab", { name: "Profile" }).press("ArrowDown");
  await manual.getByRole("tab", { name: "Sessions" }).press("Enter");
  await page.getByRole("button", { name: "Remove selected dynamic tab" }).click();

  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
  expect(results.violations.map((violation) => ({
    id: violation.id,
    targets: violation.nodes.map((node) => node.target.join(" ")),
  }))).toEqual([]);
});

test("forced-colors keeps keyboard focus distinct from selection", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  const overview = tablist(page, "Account sections").getByRole("tab", {
    name: "Overview",
  });
  await overview.focus();
  await expect(overview).toBeFocused();
  const panel = page.getByRole("tabpanel", { name: "Overview" });
  for (const element of [overview, panel]) {
    await element.focus();
    await expect(element).toBeFocused();
    expect(await element.evaluate((node) => {
      const style = getComputedStyle(node);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    })).toEqual({ outlineStyle: "solid", outlineWidth: "2px" });
  }
});
