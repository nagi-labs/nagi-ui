import { expect, test, type Page } from "@playwright/test";
import type { ComponentDefinition } from "../definition.ts";
import {
  componentContractAnnotation,
  componentContractRequirementsAnnotation,
} from "./definition-contract.ts";

const toastContractRequirementIds = [
  "TST_CONTRACT_01",
  "TST_CONTRACT_02",
  "TST_CONTRACT_03",
  "TST_CONTRACT_04",
  "TST_CONTRACT_05",
] as const;

export interface ToastContractOptions {
  definition: ComponentDefinition;
  fixture?: "package" | "owned";
  url: string;
  regionName: string;
  secondaryRegionName: string;
}

function region(page: Page, options: ToastContractOptions) {
  return page.getByRole("region", { name: options.regionName, exact: true });
}

export function toastContract(options: ToastContractOptions): void {
  test.describe(
    `Toast / Component Contract / ${options.regionName}`,
    {
      tag: [
        "@definition",
        "@toast",
        "@component-contract",
        ...(options.fixture ? [`@fixture-${options.fixture}`] : []),
      ],
      annotation: [
        {
          type: "reference",
          description: "https://www.w3.org/TR/wai-aria-1.2/#status",
        },
        {
          type: "reference",
          description: "https://www.w3.org/TR/wai-aria-1.2/#alert",
        },
        componentContractAnnotation(options.definition),
        componentContractRequirementsAnnotation(toastContractRequirementIds),
      ],
    },
    () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(options.url);
      });

      async function TST_CONTRACT_01({ page }: { page: Page }) {
        await page.getByRole("button", { name: "Show toast", exact: true }).click();
        const notifications = region(page, options);
        await expect(
          notifications.getByText("Catalog notification 1", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole("status").filter({ hasText: "Catalog notification 1" }),
        ).toHaveCount(1);

        await page.getByRole("button", { name: "Show urgent toast", exact: true }).click();
        await expect(page.getByRole("alert").filter({ hasText: "Connection lost" })).toHaveCount(1);
        await expect(
          notifications.getByText("Changes are not being saved.", { exact: true }),
        ).toBeVisible();
      }

      test(
        "Announces polite and urgent notifications separately from one named interactive region",
        { tag: ["@semantics", `@${TST_CONTRACT_01.name}`] },
        TST_CONTRACT_01,
      );

      async function TST_CONTRACT_02({ page }: { page: Page }) {
        const trigger = page.getByRole("button", { name: "Show undo toast", exact: true });
        await trigger.click();
        await expect(trigger).toBeFocused();

        await page.keyboard.press("Shift+F6");
        await expect(trigger).toBeFocused();
        await page.keyboard.press("F6");
        const notifications = region(page, options);
        await expect(notifications).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(
          notifications.getByRole("button", { name: "Undo", exact: true }),
        ).toBeFocused();

        await page
          .getByRole("button", { name: "Remove undo action", exact: true })
          .evaluate((button: HTMLButtonElement) => button.click());
        const dismiss = notifications.getByRole("button", { name: "Dismiss notification" });
        await expect(dismiss).toBeFocused();
        await dismiss.click();
        await expect(trigger).toBeFocused();
      }

      test(
        "Does not steal focus, enters with F6, repairs updated actions, and restores the origin after dismissal",
        {
          tag: ["@interaction", "@state", "@focus", `@${TST_CONTRACT_02.name}`],
        },
        TST_CONTRACT_02,
      );

      async function TST_CONTRACT_03({ page }: { page: Page }) {
        const notifications = region(page, options);
        const upsert = page.getByRole("button", { name: "Upsert sync toast", exact: true });
        await upsert.click();
        await upsert.click();
        await expect(notifications.getByRole("listitem")).toHaveCount(1);
        await expect(notifications.getByText("Revision 2", { exact: true })).toBeVisible();
        await expect(notifications.getByText("Revision 1", { exact: true })).toHaveCount(0);

        await page.getByRole("button", { name: "Fill toast limit", exact: true }).click();
        await expect(notifications.getByRole("listitem")).toHaveCount(3);
        await expect(
          notifications.getByText("Limited notification 1", { exact: true }),
        ).toHaveCount(0);
        for (const number of [2, 3, 4]) {
          await expect(
            notifications.getByText(`Limited notification ${number}`, { exact: true }),
          ).toBeVisible();
        }

        await page.getByRole("button", { name: "Run successful promise", exact: true }).click();
        await expect(notifications.getByText("Save complete", { exact: true })).toBeVisible();
        await expect(notifications.getByText("2 records saved", { exact: true })).toBeVisible();
        await page
          .getByRole("button", { name: "Close all notifications", exact: true })
          .evaluate((button: HTMLButtonElement) => button.click());
        await expect(notifications.getByRole("listitem")).toHaveCount(0);
      }

      test(
        "Upserts by stable id, enforces the live limit, replaces promise state, and closes all",
        { tag: ["@state", "@interaction", `@${TST_CONTRACT_03.name}`] },
        TST_CONTRACT_03,
      );

      async function TST_CONTRACT_04({ page }: { page: Page }) {
        const trigger = page.getByRole("button", { name: "Show timed toast", exact: true });
        const notifications = region(page, options);
        await trigger.click();
        await page.keyboard.press("F6");
        await expect(notifications).toBeFocused();
        await page.waitForTimeout(300);
        await expect(
          notifications.getByText("This notification pauses while focused.", { exact: true }),
        ).toBeVisible();

        await page.keyboard.press("F6");
        await expect(trigger).toBeFocused();
        await expect(
          notifications.getByText("This notification pauses while focused.", { exact: true }),
        ).toBeHidden({ timeout: 1000 });
      }

      test(
        "Pauses auto-dismiss while the notification region owns focus and resumes afterward",
        { tag: ["@state", "@focus", `@${TST_CONTRACT_04.name}`] },
        TST_CONTRACT_04,
      );

      async function TST_CONTRACT_05({ page }: { page: Page }) {
        await page.getByRole("button", { name: "Show toast", exact: true }).click();
        const trigger = page.getByRole("button", { name: "Show secondary toast", exact: true });
        await trigger.click();
        const primary = region(page, options);
        const secondary = page.getByRole("region", {
          name: options.secondaryRegionName,
          exact: true,
        });

        await page.keyboard.press("F6");
        await expect(primary).toBeFocused();
        await page.keyboard.press("F6");
        await expect(secondary).toBeFocused();
        await page.keyboard.press("F6");
        await expect(trigger).toBeFocused();
      }

      test(
        "Cycles multiple explicit notification regions and returns to the external focus origin",
        { tag: ["@interaction", "@focus", `@${TST_CONTRACT_05.name}`] },
        TST_CONTRACT_05,
      );
    },
  );
}
