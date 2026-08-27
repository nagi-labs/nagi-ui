import assert from "node:assert/strict";
import test from "node:test";

import {
  missingNagiThemeTokens,
  requiredNagiThemeTokens,
  warnMissingNagiThemeTokens,
} from "@nagi-labs/nagi-ui";

function themeRoot(values: ReadonlyMap<string, string>): Element {
  return {
    ownerDocument: {
      defaultView: {
        getComputedStyle: () => ({
          getPropertyValue: (token: string) => values.get(token) ?? "",
        }),
      },
    },
  } as unknown as Element;
}

test("theme diagnostics inspect the actual computed cascade", () => {
  const complete = new Map(requiredNagiThemeTokens.map((token) => [token, "set"]));
  assert.deepEqual(missingNagiThemeTokens(themeRoot(complete)), []);

  complete.delete("--nagi-color-focus-ring");
  assert.deepEqual(missingNagiThemeTokens(themeRoot(complete)), [
    "--nagi-color-focus-ring",
  ]);
});

test("theme warning names every missing token without installing an observer", () => {
  const messages: unknown[][] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => messages.push(args);
  try {
    const missing = warnMissingNagiThemeTokens(themeRoot(new Map()));
    assert.equal(missing.length, requiredNagiThemeTokens.length);
    assert.equal(messages.length, 1);
    assert.match(String(messages[0]?.[0]), /Missing theme tokens/);
    assert.match(String(messages[0]?.[0]), /--nagi-color-focus-ring/);
  } finally {
    console.warn = original;
  }
});
