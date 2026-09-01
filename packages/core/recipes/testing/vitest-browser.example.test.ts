import axe from "axe-core";
import { assertNagiDom } from "@nagi-labs/nagi-ui";
import { expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-vue";

// Replace this import with the consumer view that uses the package component,
// or with the owned Blueprint after `nagi-ui own`.
import ConsumerNagiHarness from "./ConsumerNagiHarness.example.vue";

const wcagTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectOpenedStateAxeClean(root: Element) {
  const results = await axe.run(root, {
    runOnly: { type: "tag", values: wcagTags },
  });
  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(" ")),
  }));
  expect(summary).toEqual([]);
}

test("keyboard navigation, focus restoration, and dismiss stay intact", async () => {
  const screen = await render(ConsumerNagiHarness);
  const trigger = screen.getByRole("button", { name: "File actions" });
  const menu = screen.getByRole("menu");
  const root = document.querySelector<HTMLElement>("#nagi-contract-root")!;

  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();
  await userEvent.keyboard("{ArrowDown}");
  await expect.element(menu).toBeVisible();
  await expect.element(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus();
  assertNagiDom(root);
  await expectOpenedStateAxeClean(root);

  await userEvent.keyboard("{Enter}");
  await expect.element(menu).not.toBeVisible();
  await expect.element(trigger).toHaveFocus();
  await expect.element(document.querySelector<HTMLElement>("#selected-action")!).toHaveTextContent("rename");

  await trigger.click();
  await expect.element(menu).toBeVisible();
  await screen.getByRole("button", { name: "After menu" }).click();
  await expect.element(menu).not.toBeVisible();

  assertNagiDom(root);
});

test("the owned button still participates in native form submission", async () => {
  const screen = await render(ConsumerNagiHarness);

  await screen.getByRole("textbox", { name: "Project" }).fill("Owned Nagi");
  await screen.getByRole("button", { name: "Save" }).click();

  await expect.element(document.querySelector<HTMLElement>("#submitted-project")!).toHaveTextContent("Owned Nagi");
});
