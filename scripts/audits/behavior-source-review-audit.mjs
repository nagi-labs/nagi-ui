import { access, readFile } from "node:fs/promises";
import path from "node:path";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const reviewPath = path.join(repositoryRoot, "docs/audits/behavior-api-source-review.md");
const review = await readFile(reviewPath, "utf8");

const sources = [
  "accordion.ts",
  "autocomplete.ts",
  "avatar.ts",
  "button.ts",
  "calendar.ts",
  "carousel.ts",
  "combobox.ts",
  "context-menu.ts",
  "date-field.ts",
  "date-picker.ts",
  "dialog.ts",
  "disclosure.ts",
  "listbox.ts",
  "menu.ts",
  "menubar.ts",
  "multi-select.ts",
  "navigation-menu.ts",
  "native-form.ts",
  "number-field.ts",
  "otp-field.ts",
  "pagination.ts",
  "popover.ts",
  "preview-card.ts",
  "range-slider.ts",
  "resizable.ts",
  "select.ts",
  "slider.ts",
  "stepper.ts",
  "tabs.ts",
  "tags-input.ts",
  "time-field.ts",
  "toast.ts",
  "toggle-group.ts",
  "toggle.ts",
  "toolbar.ts",
  "tooltip.ts",
  "tree.ts",
];

const issues = [];

for (const source of sources) {
  await access(path.join(repositoryRoot, "packages/core/src", source));
  const rows = review.split("\n").filter((line) => line.startsWith(`| [\`${source}\`](`));
  if (rows.length !== 1) {
    issues.push(
      `${source} must appear exactly once in the final review table; found ${rows.length}.`,
    );
    continue;
  }
  if (!/\| Publishable \|/u.test(rows[0])) {
    issues.push(`${source} is not recorded as Publishable.`);
  }
}

const reviewedRows = review.match(/^\| \[`[^`]+\.ts`\]\([^)]*\)\s+\|.*\|$/gmu) ?? [];
if (reviewedRows.length !== sources.length) {
  issues.push(`Expected ${sources.length} reviewed source rows; found ${reviewedRows.length}.`);
}

if (issues.length > 0) {
  throw new Error(`Behavior source review audit failed:\n${issues.join("\n")}`);
}

console.log(
  `Behavior source review: ${sources.length}/${sources.length} files are recorded as Publishable.`,
);
