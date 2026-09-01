import { expect, test } from "@playwright/test";

test("static navigation uses canonical directory URLs and delegates Nagi CSS", async ({ page }) => {
  await page.goto("/");

  const showcase = page.getByRole("link", { name: "Showcase", exact: true });
  await expect(showcase).toHaveAttribute("href", "/showcase/");

  const nagiCss = page.getByRole("link", { name: "Nagi CSS", exact: true });
  await expect(nagiCss).toHaveAttribute("href", "https://nagi-labs.github.io/nagi-css/");

  await showcase.click();
  await expect(page).toHaveURL(/\/showcase\/$/u);
  await expect(page).toHaveTitle("Application showcase · Nagi UI");

  await page.reload();
  await expect(page).toHaveTitle("Application showcase · Nagi UI");
});

test("an extensionless static route redirects before Nuxt hydration", async ({ page }) => {
  await page.goto("/showcase");
  await expect(page).toHaveURL(/\/showcase\/$/u);
  await expect(page).toHaveTitle("Application showcase · Nagi UI");
});
