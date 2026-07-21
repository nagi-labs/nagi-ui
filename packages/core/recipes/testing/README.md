# Consumer testing recipes

These recipes keep Nagi UI's browser and integration contracts executable in
the consuming application. They are intentionally copyable source rather than
a Nagi-specific test runner.

Start with **either** Vitest Browser Mode for a fast component-level contract
**or** Playwright for a routed application flow. One real-browser suite is
enough for a small application; using both is optional and useful for high-risk
owned components.
Do not treat a jsdom-only suite as coverage for native Popover, `<dialog>`, top
layer ordering, focus restoration, or browser form behavior: those state
machines live in the browser, not in Nagi or jsdom.

## What to copy

### Vitest Browser Mode

Copy and rename:

- `vitest.browser.config.example.ts` to the consumer's Vitest config (or merge
  its browser project into an existing config).
- `ConsumerNagiHarness.example.vue` to a test fixture near the consumer view.
- `vitest-browser.example.test.ts` to
  `tests/nagi-browser/dropdown.browser.test.ts`.

The sample uses the Vitest 4 provider API. Add compatible versions of
`vitest`, `@vitest/browser-playwright`, `vitest-browser-vue`, and
`@vitejs/plugin-vue` plus `axe-core` to the consumer's dev dependencies, then
install Chromium once. The sample runs axe in the opened state without rule
exclusions.

```sh
vp add -D vitest @vitest/browser-playwright vitest-browser-vue @vitejs/plugin-vue axe-core
vp exec playwright install chromium
```

Add a consumer script such as
`"test:nagi:browser": "vitest run --config vitest.browser.config.ts"`, then
run it through `vp run test:nagi:browser`.

### Playwright

Copy and rename:

- `playwright.config.example.ts` to the consumer's Playwright config (or merge
  its project into an existing config).
- `playwright.example.spec.ts` to
  `tests/nagi-browser/dropdown.spec.ts`.

Add compatible `@playwright/test` and `@axe-core/playwright` dev dependencies
if the application does not already have them. Change the sample
`webServer.command`, URL, and `page.goto()` route. The route must render the
real application integration, not a duplicate of the component markup. The
sample harness exposes a test-only `assertNagiDom` bridge to Playwright and the
spec runs it before an unfiltered WCAG 2.0/2.1 A/AA axe scan while the menu is
open. Keep an equivalent bridge on the real test route; do not expose it in a
production entry.

```sh
vp add -D @playwright/test @axe-core/playwright
vp exec playwright install chromium
vp exec playwright test
```

## Required adjustments

The included harness is a runnable shape, not a snapshot to preserve. Replace
it with the smallest real consumer view and keep assertions for every contract
that the application depends on:

| Contract | Minimum real-browser assertion |
|---|---|
| Keyboard | Open with the supported key, move through enabled items, activate, and cover RTL/submenus when used |
| Focus | Focus lands on the documented owner and returns to the trigger after activation or Escape |
| Dismiss | Exercise Escape and a genuine outside click; do not call `hidePopover()` from the test |
| Form | Submit the real form and assert serialized `name`/value data, required validation, disabled behavior, and reset when used |
| DOM wiring | Call `assertNagiDom(root)` after render and after dynamic item/ID changes |
| Accessibility | Run axe in each important opened state in addition to keyboard assertions; do not silence rules to make the gate green |

Prefer role and accessible-name locators. CSS classes are a styling contract,
not the behavioral API that these tests protect. Avoid timer-based waits for
popover/dialog state; assert the browser-visible state and let the runner
retry.

## Ownership and upgrade loop

Tests reduce the uncertainty of source ownership only when they run around the
ownership boundary:

1. Run the package-component tests to establish a green baseline.
2. Run `vp exec nagi-ui own <component>` and **commit the untouched copy
   immediately**. The commit is the recoverable base for a later 3-way merge.
3. Switch the fixture to the owned import, make the customization, and keep the
   same browser contract green.
4. On every `@nagi-labs/nagi-ui` upgrade, run
   `vp exec nagi-ui diff --dir src/components/nagi` in CI.
5. `modified` is the normal customized state. For `drifted`, inspect the
   printed upstream diff, merge the upstream fix with the local change, update
   the `@nagi-source` stamp, and run lint plus these browser tests before
   committing. `unknown-source` also blocks the upgrade until reconciled.

This loop answers two different questions: `diff` tells you **when upstream
changed**, while the consumer tests tell you **whether the owned behavior still
meets the application's contract**. Neither signal replaces the other.

## SSR and zero-JS additions

Add these checks only when the application claims SSR, delayed hydration,
islands, or zero-JS behavior:

1. Render the actual consumer component with the application's SSR entry and
   assert that `popovertarget`, its matching `id`, `popover`, and relevant
   `aria-*` relationships exist in the returned HTML before hydration.
2. For native-popover features that claim zero-JS operation, add a Playwright
   project/context with `javaScriptEnabled: false`, visit the server-rendered
   route, click the real trigger, and assert that the popover becomes visible.
3. Do not claim zero-JS keyboard behavior for Menu, Listbox, or Combobox. Their
   ARIA relationships can be present in SSR output, but their thick interaction
   models intentionally require JavaScript.

Always test the deployed SSR path or its production-equivalent preview. A
string snapshot from a different fixture does not prove the consumer route.
