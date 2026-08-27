import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __assertConsumerNagiDom?: () => void;
  }
}

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectNagiDomClean(page: Page) {
  await page.evaluate(() => {
    if (!window.__assertConsumerNagiDom) {
      throw new Error("Expose the test-only assertNagiDom bridge from the consumer harness.");
    }
    window.__assertConsumerNagiDom();
  });
}

async function expectOpenedStateAxeClean(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(" ")),
  }));
  expect(summary).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  // Replace with a real route that renders the consumer or owned component.
  await page.goto("/__nagi-contract");
});

test("keyboard navigation, focus restoration, and light dismiss stay intact", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "File actions" });
  const menu = page.getByRole("menu");

  await trigger.focus();
  await trigger.press("ArrowDown");
  await expect(menu).toBeVisible();
  const rename = page.getByRole("menuitem", { name: "Rename" });
  await expect(rename).toBeFocused();
  await expectNagiDomClean(page);
  await expectOpenedStateAxeClean(page);

  await page.keyboard.press("Enter");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.getByTestId("selected-action")).toHaveText("rename");

  await trigger.click();
  await page.getByRole("button", { name: "After menu" }).click();
  await expect(menu).toBeHidden();
  await expectNagiDomClean(page);
});

test("native form submission survives ownership changes", async ({ page }) => {
  await page.getByRole("textbox", { name: "Project" }).fill("Owned Nagi");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByTestId("submitted-project")).toHaveText("Owned Nagi");
});
