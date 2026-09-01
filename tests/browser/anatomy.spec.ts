import { expect, test } from "@playwright/test";

/**
 * Functional anatomy contracts, verified against real rendered DOM.
 *
 * These cover the wrapper-tolerant Carousel contract: the behavior-bearing
 * viewport scopes semantic slide descendants without requiring direct parentage.
 */

test("[BTN-SEM-01][BTN-ANAT-01] canonical Button and Carousel satisfy their declared anatomy", async ({ page }) => {
  await page.goto("/anatomy.html");

  await expect(page.locator("#anatomy-button")).toHaveText("ok");
  await expect(page.locator("#anatomy-canonical")).toHaveText("ok");
  const button = page.getByRole("button", { name: "Canonical button" });
  await expect(button).toHaveAttribute("data-scope", "button");
  await expect(button).toHaveAttribute("data-part", "root");
});

test("[CAR-ANAT-01] wrapping the slides preserves the declared anatomy", async ({ page }) => {
  await page.goto("/anatomy.html");

  const edited = page.locator("#anatomy-edited");
  await expect(edited).toHaveText("ok");
  await expect(page.locator("#anatomy-edited-message")).toBeEmpty();
});

test("the edited carousel still passes role and name discovery", async ({ page }) => {
  await page.goto("/anatomy.html");

  // The point of the anatomy contract: this component looks correct to every
  // semantic check, which is why the structural requirement must be explicit.
  const region = page.getByRole("region", { name: "Edited content" });
  await expect(region).toBeVisible();
  await expect(region.getByRole("group", { name: "First, 1 / 3" })).toBeVisible();
  await expect(region.getByRole("button", { name: "Next slide" })).toBeVisible();
});
