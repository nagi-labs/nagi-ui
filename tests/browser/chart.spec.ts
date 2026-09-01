import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/chart.html");
});

test("Unovis renders inside Card with token bridge and non-color series cues", async ({
  page,
}) => {
  await expect(page.getByText("Weekly active users", { exact: true })).toBeVisible();
  const chart = page.getByRole("figure", {
    name: /current period rises from 118 to 184/u,
  });
  await expect(chart).toBeVisible();
  await expect(chart.locator("svg")).toBeVisible();
  await expect(chart.locator('path[stroke="var(--vis-color0)"]')).toHaveCount(1);
  await expect(chart.locator('path[stroke="var(--vis-color1)"]')).toHaveCount(1);
  await expect(page.getByText("Previous period, dashed", { exact: true })).toBeVisible();
  await expect(page.getByRole("table", { name: "Weekly active-user values" })).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(7);

  const bridge = page.locator("[data-nagi-unovis]");
  const light = await bridge.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      series: style.getPropertyValue("--nagi-color-series-1").trim(),
      unovis: style.getPropertyValue("--vis-color0").trim(),
    };
  });
  expect(light).toEqual({ series: "#315fbd", unovis: "#315fbd" });

  await page.locator("#chart-theme-toggle").click();
  await expect(page.locator("#chart-theme-toggle")).toHaveAttribute("aria-pressed", "true");
  await expect(bridge).toHaveCSS("color", "rgb(245, 251, 252)");
  expect(
    await bridge.evaluate((element) =>
      getComputedStyle(element).getPropertyValue("--nagi-color-series-1").trim(),
    ),
  ).toBe("#5fc7dd");
});
