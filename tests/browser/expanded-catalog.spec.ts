import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window { __assertExpandedNagiDom?: () => void }
}

async function expectNagiDomClean(page: Page) {
  await page.evaluate(() => {
    if (!window.__assertExpandedNagiDom) throw new Error("Expanded Nagi DOM verifier is unavailable");
    window.__assertExpandedNagiDom();
  });
}

async function expectAxeClean(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations.map((violation) => ({
    id: violation.id,
    nodes: violation.nodes.map((node) => node.target.join(" ")),
  }))).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/expanded.html");
  await expectNagiDomClean(page);
});

test("free-form autocomplete commits suggestions without rejecting arbitrary text", async ({ page }) => {
  const input = page.getByRole("combobox", { name: "Destination", exact: true });
  await input.fill("Jam");
  await expect(page.getByRole("option", { name: "Jamaica" })).toBeVisible();
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(page.locator("#autocomplete-model")).toHaveText("Jamaica");

  await input.fill("Moon base");
  await expect(page.locator("#autocomplete-model")).toHaveText("Moon base");
});

test("autocomplete preserves IME composition and rolls a controlled rejection back", async ({ page }) => {
  const accepted = page.getByRole("combobox", { name: "Destination", exact: true });
  await accepted.evaluate((element: HTMLInputElement) => {
    element.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    element.value = "日本";
    element.dispatchEvent(new InputEvent("input", { bubbles: true, data: "日本", isComposing: true }));
  });
  await expect(accepted).toHaveValue("日本");
  await accepted.evaluate((element) => element.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true })));
  await expect(page.locator("#autocomplete-model")).toHaveText("日本");

  const locked = page.getByRole("combobox", { name: "Locked destination" });
  await locked.evaluate((element: HTMLInputElement) => {
    element.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    element.value = "拒否";
    element.dispatchEvent(new InputEvent("input", { bubbles: true, data: "拒否", isComposing: true }));
  });
  await expect(locked).toHaveValue("拒否");
  await locked.evaluate((element) => element.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true })));
  await expect(locked).toHaveValue("Locked destination");
});

test("collection and OTP fields submit repeated native values and reset", async ({ page }) => {
  const multi = page.getByRole("combobox", { name: "Countries", exact: true });
  await expect(multi).toHaveAttribute("aria-describedby", "countries-help");
  await multi.click();
  await page.getByRole("option", { name: "Jamaica" }).click();
  await expect(page.locator("#multi-model")).toHaveText("jp,jm");

  const tags = page.getByRole("textbox", { name: "Topics", exact: true });
  await expect(tags).toHaveAttribute("aria-describedby", "topics-help");
  await tags.fill("aria");
  await tags.press("Enter");
  await expect(page.locator("#tags-model")).toHaveText("vue,aria");

  const otp = page.getByRole("textbox", { name: "Verification code", exact: true });
  await expect(otp).toHaveAttribute("aria-describedby", "otp-help");
  await expect(otp).toHaveAttribute("enterkeyhint", "done");
  await otp.fill("12a34");
  await expect(page.locator("#otp-model")).toHaveText("1234");

  await page.getByRole("button", { name: "Submit expanded form" }).click();
  await expect(page.locator("#submission")).toHaveText(JSON.stringify({
    destination: "Custom destination",
    countries: ["jp", "jm"],
    topics: ["vue", "aria"],
    code: "1234",
  }));

  await page.getByRole("button", { name: "Reset expanded form" }).click();
  await expect(page.locator("#multi-model")).toHaveText("jp");
  await expect(page.locator("#tags-model")).toHaveText("vue");
  await expect(page.locator("#otp-model")).toHaveText("12");
});

test("required collection channels block empty submission and disabled channels are omitted", async ({ page }) => {
  await page.locator("#expanded-form").getByRole("button", { name: "Remove Japan" }).click();
  await page.getByRole("textbox", { name: "Verification code", exact: true }).fill("");
  await page.getByRole("button", { name: "Submit expanded form" }).click();
  await expect(page.locator("#submission")).toHaveText("No submission yet");
  expect(await page.locator('select[name="countries"]').evaluate(
    (control: HTMLSelectElement) => control.checkValidity(),
  )).toBe(false);
  expect(await page.getByRole("textbox", { name: "Verification code", exact: true }).evaluate(
    (control: HTMLInputElement) => control.checkValidity(),
  )).toBe(false);
});

test("required empty collection controls focus their visible textboxes on first submit", async ({ page }) => {
  await page.getByRole("button", { name: "Submit empty countries" }).click();
  const countries = page.getByRole("combobox", { name: "Empty required countries" });
  await expect(countries).toBeFocused();
  await expect(countries).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Submit empty topics" }).click();
  const topics = page.getByRole("textbox", { name: "Empty required topics" });
  await expect(topics).toBeFocused();
  await expect(topics).toHaveAttribute("aria-invalid", "true");
});

test("OTP exact-length validation preserves valid characters after invalid raw input", async ({ page }) => {
  const otp = page.getByRole("textbox", { name: "Verification code", exact: true });
  await otp.fill("12a34");
  await expect(otp).toHaveValue("1234");
  expect(await otp.evaluate((control: HTMLInputElement) => control.checkValidity())).toBe(true);
  await otp.fill("12");
  expect(await otp.evaluate((control: HTMLInputElement) => control.checkValidity())).toBe(false);
  await otp.fill("١٢٣٤");
  await expect(page.locator("#otp-model")).toHaveText("١٢٣٤");
  expect(await otp.evaluate((control: HTMLInputElement) => control.checkValidity())).toBe(true);
});

test("OTP cell layout follows rendered children without script-authored column styles", async ({ page }) => {
  const otp = page.getByRole("textbox", { name: "Verification code", exact: true });
  const result = await otp.evaluate((control) => {
    const field = control.parentElement;
    const root = field?.parentElement;
    const digits = field?.querySelector<HTMLElement>(".unit.-digits");
    if (!(root instanceof HTMLElement) || !(field instanceof HTMLElement) || !digits) return null;
    root.style.inlineSize = "80px";
    return {
      fieldWidth: field.getBoundingClientRect().width,
      scrollWidth: field.scrollWidth,
      cellWidths: [...digits.children].map((cell) => cell.getBoundingClientRect().width),
      scriptStyle: field.getAttribute("style"),
    };
  });
  expect(result).not.toBeNull();
  expect(result?.fieldWidth).toBe(80);
  expect(result?.scrollWidth).toBe(80);
  expect(new Set(result?.cellWidths.map((width) => Math.round(width * 100) / 100)).size).toBe(1);
  expect(result?.scriptStyle).toBeNull();
});

test("controlled text and collection fields retain source values and drafts after rejected writes", async ({ page }) => {
  const autocomplete = page.getByRole("combobox", { name: "Locked destination" });
  await autocomplete.fill("Rejected");
  await expect(autocomplete).toHaveValue("Locked destination");

  const multi = page.getByRole("combobox", { name: "Locked countries" });
  await multi.fill("Jam");
  await multi.press("ArrowDown");
  await multi.press("Enter");
  await expect(multi).toHaveValue("Jam");

  const tags = page.getByRole("textbox", { name: "Locked topics" });
  await tags.fill("aria");
  await tags.press("Enter");
  await expect(tags).toHaveValue("aria");

  const otp = page.getByRole("textbox", { name: "Locked verification code" });
  await otp.fill("1234");
  await expect(otp).toHaveValue("9876");
});

test("TagsInput preserves IME composition and splits pasted values", async ({ page }) => {
  const input = page.getByRole("textbox", { name: "Topics", exact: true });
  await input.fill("日本語");
  await input.evaluate((element) => element.dispatchEvent(new KeyboardEvent("keydown", {
    bubbles: true, key: "Enter", keyCode: 229, isComposing: true,
  })));
  await expect(page.locator("#tags-model")).toHaveText("vue");
  await input.press("Enter");
  await expect(page.locator("#tags-model")).toHaveText("vue,日本語");

  await input.evaluate((element) => {
    const clipboard = new DataTransfer();
    clipboard.setData("text/plain", "forms, keyboard");
    element.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: clipboard }));
  });
  await expect(page.locator("#tags-model")).toHaveText("vue,日本語,forms,keyboard");
});

test("required controlled TagsInput keeps visible invalidity after a rejected addition", async ({ page }) => {
  const input = page.getByRole("textbox", { name: "Locked required topics" });
  await page.getByRole("button", { name: "Submit locked required topics" }).click();
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await input.fill("aria");
  await input.press("Enter");
  await expect(input).toHaveValue("aria");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  expect(await input.locator("xpath=../..").locator("select").evaluate(
    (select: HTMLSelectElement) => select.selectedOptions.length,
  )).toBe(0);
});

test("external Carousel index owns the complete smooth-scroll transition", async ({ page }) => {
  const region = page.getByRole("region", { name: "Release highlights", exact: true });
  await page.getByRole("button", { name: "Show third release" }).click();
  await expect(page.locator("#carousel-model")).toHaveText("2");
  await page.waitForTimeout(400);
  await expect(page.locator("#carousel-model")).toHaveText("2");
  await expect.poll(() => region.locator(".unit.-viewport").evaluate(
    (viewport: HTMLElement) => Math.round(viewport.scrollLeft / viewport.clientWidth),
  )).toBe(2);
});

test("[CAR-SEM-01][CAR-SEM-02][CAR-SEM-03][CAR-SEM-04][CAR-SEM-05][CAR-SEM-06][CAR-INT-01][CAR-INT-02][CAR-INT-03][CAR-FOCUS-01][CAR-FOCUS-02][CAR-ANAT-01] carousel exposes adopted semantics without an invented group keyboard pattern", async ({ page }) => {
  const toolbar = page.getByRole("toolbar", { name: "Formatting", exact: true });
  await toolbar.getByRole("button", { name: "Bold" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(toolbar.getByRole("button", { name: "Add link" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#action")).toHaveText("toolbar:link");

  const rtl = page.getByRole("toolbar", { name: "RTL formatting" });
  await rtl.getByRole("button", { name: "Bold" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(rtl.getByRole("button", { name: "Add link" })).toBeFocused();

  const carouselRegion = page.getByRole("region", { name: "Release highlights", exact: true });
  await expect(carouselRegion).toHaveAttribute("aria-roledescription", "carousel");
  const nextSlide = carouselRegion.getByRole("button", { name: "Next slide" });
  await nextSlide.click();
  await expect(nextSlide).toBeFocused();
  await expect(page.locator("#carousel-model")).toHaveText("1");
  const secondSlide = carouselRegion.getByRole("group", { name: /Second release.*2 \/ 3/ });
  await expect(secondSlide).toBeVisible();
  await expect(secondSlide).toHaveAttribute("aria-roledescription", "slide");
  await expect(secondSlide.locator("..")).toHaveAttribute("data-part", "viewport");
  const carouselViewport = carouselRegion.getByRole("group", { name: "Release highlights", exact: true });
  await expect(carouselViewport).toHaveAttribute("aria-roledescription", "slides");
  await expect(carouselViewport).toHaveAttribute("data-scope", "carousel");
  await expect(carouselViewport).toHaveAttribute("data-part", "viewport");
  await expect(carouselViewport).toHaveAttribute("tabindex", "0");
  await carouselViewport.focus();
  await expect(carouselViewport).toBeFocused();
  await expect.poll(() => carouselRegion.locator(".unit.-viewport").evaluate(
    (viewport: HTMLElement) => Math.round(viewport.scrollLeft / viewport.clientWidth),
  )).toBe(1);
  await carouselRegion.locator(".unit.-viewport").evaluate((viewport: HTMLElement) => {
    viewport.scrollLeft = viewport.scrollWidth;
    viewport.dispatchEvent(new Event("scroll"));
  });
  await expect(page.locator("#carousel-model")).toHaveText("2");

  const localizedRoot = page.getByRole("group", { name: "注目記事", exact: true });
  await expect(localizedRoot).toHaveAttribute("aria-roledescription", "カルーセル");
  await expect(page.getByText("3件中2件目", { exact: true })).toBeVisible();
  const localizedSlide = localizedRoot.getByRole("group", {
    name: /Second release.*3件中2件目の記事/,
  });
  await expect(localizedSlide).toBeVisible();
  await expect(localizedSlide).toHaveAttribute("aria-roledescription", "スライド");
  const localizedViewport = localizedRoot.getByRole("group", { name: "記事一覧", exact: true });
  await expect(localizedViewport).toHaveAttribute("aria-roledescription", "スライド一覧");
  await expect.poll(() => localizedViewport.evaluate(
    (viewport: HTMLElement) => Math.round(viewport.scrollLeft / viewport.clientWidth),
  )).toBe(1);

  const separator = page.getByRole("separator", { name: "Workspace panels", exact: true });
  await separator.focus();
  await separator.press("ArrowRight");
  await expect(separator).toHaveAttribute("aria-valuenow", "51");
  await separator.press("Home");
  await expect(page.locator("#resizable-model")).toHaveText("10");
  await separator.press("Enter");
  await expect(page.locator("#resizable-model")).toHaveText("51");
  await separator.press("Enter");
  await expect(page.locator("#resizable-model")).toHaveText("10");
  const bounds = await separator.boundingBox();
  expect(bounds).not.toBeNull();
  if (bounds) {
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + 120, bounds.y + bounds.height / 2);
    await page.mouse.up();
    await expect(page.locator("#resizable-model")).not.toHaveText("10");
  }

  const rtlSeparator = page.getByRole("separator", { name: "RTL workspace panels" });
  await rtlSeparator.focus();
  await rtlSeparator.press("ArrowLeft");
  await expect(page.locator("#rtl-resizable-model")).toHaveText("51");

  const verticalSeparator = page.getByRole("separator", { name: "Vertical workspace panels" });
  const verticalBefore = Number(await verticalSeparator.getAttribute("aria-valuenow"));
  await verticalSeparator.focus();
  await verticalSeparator.press("ArrowDown");
  await expect(verticalSeparator).toHaveAttribute("aria-valuenow", String(verticalBefore + 1));
});

test("[CAR-STATE-03] dynamic toolbar focus repair, disabled carousel rollback, and narrow splitters stay continuous", async ({ page }) => {
  const toolbar = page.getByRole("toolbar", { name: "Formatting", exact: true });
  await toolbar.getByRole("button", { name: "Bold" }).focus();
  await page.locator("#remove-active-toolbar-item").evaluate((element: HTMLElement) => element.click());
  await expect(toolbar.getByRole("button", { name: "Add link" })).toBeFocused();

  const disabledRoot = page.getByRole("region", { name: "Disabled release highlights" });
  const disabledViewport = disabledRoot.getByRole("group", { name: "Disabled release highlights", exact: true });
  await expect(disabledRoot).toHaveAttribute("data-disabled", "");
  await expect(disabledRoot).not.toHaveAttribute("aria-disabled");
  await expect(disabledViewport).toHaveAttribute("aria-roledescription", "slides");
  await expect(disabledViewport).toHaveAttribute("tabindex", "-1");
  await expect(disabledViewport).not.toHaveAttribute("aria-disabled");
  await disabledViewport.evaluate((viewport: HTMLElement) => {
    viewport.scrollLeft = viewport.clientWidth;
    viewport.dispatchEvent(new Event("scroll"));
  });
  await expect(page.locator("#disabled-carousel-model")).toHaveText("0");
  await expect.poll(() => disabledViewport.evaluate((viewport: HTMLElement) => Math.round(viewport.scrollLeft))).toBe(0);

  await page.setViewportSize({ width: 320, height: 900 });
  for (const splitter of await page.locator(".n-resizable").all()) {
    const layout = await splitter.evaluate((element: HTMLElement) => ({
      fits: element.scrollWidth <= element.clientWidth + 1,
      panelSizes: [...element.querySelectorAll<HTMLElement>(":scope > .section")].map((panel) =>
        element.dataset.orientation === "vertical" ? panel.offsetHeight : panel.offsetWidth,
      ),
    }));
    expect(layout.fits).toBe(true);
    expect(layout.panelSizes.every((size) => size > 0)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});

test("Resizable stops pointer updates after capture loss", async ({ page }) => {
  const separator = page.getByRole("separator", { name: "Workspace panels", exact: true });
  const before = await separator.getAttribute("aria-valuenow");
  await separator.dispatchEvent("pointerdown", { pointerId: 42, pointerType: "mouse", button: 0, clientX: 200, clientY: 100 });
  await separator.dispatchEvent("lostpointercapture", { pointerId: 42, pointerType: "mouse" });
  const afterLoss = await separator.getAttribute("aria-valuenow");
  await separator.dispatchEvent("pointermove", { pointerId: 42, pointerType: "mouse", clientX: 500, clientY: 100 });
  await expect(separator).toHaveAttribute("aria-valuenow", afterLoss ?? before ?? "50");
  await expectNagiDomClean(page);
});

test("context menu uses pointer coordinates, selects, light-dismisses, and cancels moved long presses", async ({ page }) => {
  const target = page.getByText("Open the project context menu here");
  const positioner = page.locator(".n-context-menu > .unit.-positioner").first();
  await expect(positioner).toHaveCSS("position", "fixed");
  await expect(positioner).toHaveCSS("pointer-events", "none");
  await target.click({ button: "right", position: { x: 24, y: 30 } });
  const menu = page.getByRole("menu", { name: "Context menu" });
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("position", "fixed");
  await menu.getByRole("menuitem", { name: "Rename" }).click();
  await expect(page.locator("#action")).toHaveText("context:rename");
  await expect(menu).toBeHidden();

  await target.click({ button: "right" });
  await page.getByRole("button", { name: "Outside target" }).click();
  await expect(menu).toBeHidden();

  await target.evaluate((element) => {
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, pointerType: "touch", pointerId: 7, button: 0, clientX: 20, clientY: 20,
    }));
    element.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true, pointerType: "touch", pointerId: 7, button: 0, clientX: 50, clientY: 50,
    }));
  });
  await page.waitForTimeout(650);
  await expect(menu).toBeHidden();

  await target.evaluate((element) => {
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, pointerType: "touch", pointerId: 8, button: 0, clientX: 30, clientY: 40,
    }));
  });
  await expect(menu).toBeVisible({ timeout: 1_000 });
  await target.evaluate((element) => element.dispatchEvent(new PointerEvent("pointerup", {
    bubbles: true, pointerType: "touch", pointerId: 8, button: 0, clientX: 30, clientY: 40,
  })));
  await expect(menu).toBeVisible();
  await target.evaluate((element) => element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 })));
  await expect(page.locator("#action")).not.toHaveText("context-target-activated");
});

test("context menu keyboard links use one trusted click with native interception, target, and focus", async ({ page }) => {
  const target = page.getByText("Open the project context menu here");
  await target.focus();
  await target.press("Shift+F10");
  const menu = page.getByRole("menu", { name: "Context menu" });
  await expect(menu).toBeVisible();
  const modifiedLink = menu.getByRole("menuitem", { name: "Copy" });
  await page.evaluate(() => {
    document.body.dataset.contextClicks = "0";
    document.addEventListener("click", (event) => {
      const mouse = event as MouseEvent;
      if (!(event.target instanceof HTMLAnchorElement) || !mouse.ctrlKey) return;
      document.body.dataset.contextClicks = String(
        Number(document.body.dataset.contextClicks ?? "0") + 1,
      );
      document.body.dataset.observedControl = String(mouse.ctrlKey);
      document.body.dataset.observedUncancelled = String(!event.defaultPrevented);
      event.preventDefault();
    }, { once: true });
  });
  let popupCount = 0;
  const countPopup = (popup: Page) => {
    popupCount += 1;
    void popup.close();
  };
  page.on("popup", countPopup);
  await expect(modifiedLink).toBeFocused();
  await page.keyboard.press("Control+Enter");
  await page.waitForTimeout(100);
  expect(popupCount).toBe(0);
  await expect(page.locator("body")).toHaveAttribute("data-context-clicks", "1");
  await expect(page.locator("body")).toHaveAttribute("data-observed-control", "true");
  await expect(page.locator("body")).toHaveAttribute("data-observed-uncancelled", "true");
  await expect(page.locator("#action")).not.toHaveText("context-router");
  expect(new URL(page.url()).hash).not.toBe("#context-link");
  page.off("popup", countPopup);

  await target.press("Shift+F10");
  await expect(menu.getByRole("menuitem", { name: "Copy" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#action")).toHaveText("context-router");
  await expect(target).toBeFocused();
  expect(new URL(page.url()).hash).not.toBe("#context-link");

  await target.press("Shift+F10");
  await expect(menu.getByRole("menuitem", { name: "Copy" })).toBeFocused();
  await page.keyboard.press("o");
  await expect(menu.getByRole("menuitem", { name: "Open target" })).toBeFocused();
  const popupPromise = page.waitForEvent("popup");
  await page.keyboard.press("Enter");
  const popup = await popupPromise;
  await popup.waitForLoadState();
  expect(new URL(popup.url()).hash).toBe("#context-target");
  await popup.close();

  await target.evaluate((element) => element.dispatchEvent(new MouseEvent("contextmenu", {
    bubbles: true,
    button: 2,
    clientX: window.innerWidth - 2,
    clientY: window.innerHeight - 2,
  })));
  await expect(menu).toBeVisible();
  const box = await menu.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  if (box && viewport) {
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
  }
});

test("menubar, site navigation, and tree retain their distinct keyboard semantics", async ({ page }) => {
  const menubar = page.getByRole("menubar", { name: "Application", exact: true });
  const fileTrigger = menubar.getByRole("menuitem", { name: "File" });
  await fileTrigger.click();
  await expect(page.getByRole("menu", { name: "File" })).toBeVisible();
  await fileTrigger.click();
  await expect(page.getByRole("menu", { name: "File" })).toBeHidden();
  await fileTrigger.focus();
  await page.keyboard.press("ArrowDown");
  const fileMenu = page.getByRole("menu", { name: "File" });
  await expect(fileMenu).toBeVisible();
  await expect(fileMenu.getByRole("menuitem", { name: "New file" })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.locator("#action")).toHaveText("menubar:open");
  await expect(menubar.getByRole("menuitem", { name: "File" })).toBeFocused();

  const navigation = page.getByRole("navigation", { name: "Primary navigation", exact: true });
  const products = navigation.getByRole("button", { name: "Products" });
  await products.hover();
  await expect(navigation.getByRole("link", { name: /Nagi UI/u })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "About" })).toHaveAttribute("href", "#about");
  await navigation.getByRole("link", { name: "About" }).hover();
  await page.waitForTimeout(200);
  await expect(navigation.getByRole("link", { name: /Nagi UI/u })).toBeHidden();
  await products.hover();
  await expect(navigation.getByRole("link", { name: /Nagi UI/u })).toBeVisible();
  await products.focus();
  await page.getByRole("button", { name: "Outside target" }).hover();
  await page.waitForTimeout(200);
  await expect(navigation.getByRole("link", { name: /Nagi UI/u })).toBeVisible();
  await products.click();
  await expect(navigation.getByRole("link", { name: /Nagi UI/u })).toBeVisible();
  await expect(products).toHaveAttribute("popovertargetaction", "show");
  await page.getByRole("button", { name: "Outside target" }).hover();
  await page.waitForTimeout(200);
  await expect(navigation.getByRole("link", { name: /Nagi UI/u })).toBeVisible();
  await products.click();
  await expect(navigation.getByRole("link", { name: /Nagi UI/u })).toBeHidden();

  await products.click();
  const navigationLink = navigation.getByRole("link", { name: /Nagi UI/u });
  await navigationLink.focus();
  await navigationLink.press("Escape");
  await expect(navigationLink).toBeHidden();
  await expect(products).toBeFocused();

  await products.click();
  await navigationLink.hover();
  await expect(page.locator("#action")).toHaveText("navigation-prefetch");
  await navigationLink.evaluate((element: HTMLAnchorElement) => element.click());
  await expect(page.locator("#action")).toHaveText("navigation-router");
  await expect(navigationLink).toBeHidden();
  await expect(products).toBeFocused();
  expect(new URL(page.url()).hash).not.toBe("#ui");

  const tree = page.getByRole("tree", { name: "Project files" });
  await tree.focus();
  await tree.press("ArrowRight");
  const apple = tree.getByRole("treeitem", { name: "Apple" });
  await expect(apple).toHaveAttribute("aria-level", "2");
  await expect(apple).toHaveAttribute("aria-posinset", "1");
  await expect(apple).toHaveAttribute("aria-setsize", "2");
  expect(await apple.evaluate((element) => ({
    group: element.parentElement?.getAttribute("role"),
    owner: element.parentElement?.parentElement?.getAttribute("role"),
  }))).toEqual({ group: "group", owner: "treeitem" });
  await expect(page.locator("#tree-expanded")).toHaveText("fruit");
  await tree.press("ArrowRight");
  await tree.press("Enter");
  await expect(page.locator("#tree-model")).toHaveText("apple");
  await apple.hover();
  await expect(tree).toHaveAttribute("aria-activedescendant", await apple.getAttribute("id") ?? "");
  await apple.click();
  await expect(page.locator("#tree-model")).toHaveText("apple");
  await expect(tree).toHaveAttribute("aria-activedescendant", await apple.getAttribute("id") ?? "");

  await page.getByRole("button", { name: "Remove fruit branch" }).click();
  const vegetable = tree.getByRole("treeitem", { name: "Vegetable" });
  await expect(vegetable).toBeVisible();
  await expect(tree).toHaveAttribute("aria-activedescendant", await vegetable.getAttribute("id") ?? "");
});

test("menubar and navigation repair open owners after dynamic removal and follow RTL", async ({ page }) => {
  const rtl = page.getByRole("menubar", { name: "RTL application" });
  await rtl.getByRole("menuitem", { name: "File" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(rtl.getByRole("menuitem", { name: "Edit" })).toBeFocused();

  const menubar = page.getByRole("menubar", { name: "Application", exact: true });
  await menubar.getByRole("menuitem", { name: "File" }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("menu", { name: "File" })).toBeVisible();
  await page.locator("#remove-active-menubar-menu").evaluate((element: HTMLElement) => element.click());
  await expect(menubar.getByRole("menuitem", { name: "Edit" })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("menu", { name: "Edit" })).toBeVisible();
  await expectNagiDomClean(page);

  const navigation = page.getByRole("navigation", { name: "Primary navigation", exact: true });
  await navigation.getByRole("button", { name: "Products" }).hover();
  await expect(navigation.getByRole("link", { name: /Nagi UI/u })).toBeVisible();
  await page.locator("#remove-active-navigation-item").evaluate((element: HTMLElement) => element.click());
  await expect(navigation.getByRole("button", { name: "Products" })).toHaveCount(0);
  await expect(navigation.locator(".unit.-popup")).toBeHidden();
  await expectNagiDomClean(page);
});

test("controlled overlay close rejection keeps the actual native surface operable", async ({ page }) => {
  await page.getByRole("button", { name: "Externally open context menu" }).click();
  const context = page.getByRole("menu", { name: "Locked context menu" });
  await expect(context).toBeVisible();
  await expect(context.getByRole("menuitem", { name: "Copy" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(context).toBeVisible();
  await expect(context.getByRole("menuitem", { name: "Copy" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(context).toBeVisible();
  await expect(context.getByRole("menuitem", { name: "Copy" })).toBeFocused();
  await page.getByRole("button", { name: "Externally close context menu" }).click();
  await expect(context).toBeHidden();

  await page.getByRole("button", { name: "Externally open menubar" }).click();
  const menubarMenu = page.getByRole("menu", { name: "File" });
  await expect(menubarMenu).toBeVisible();
  await expect(menubarMenu.getByRole("menuitem", { name: "New file" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menubarMenu).toBeVisible();
  await expect(menubarMenu.getByRole("menuitem", { name: "New file" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(menubarMenu).toBeVisible();
  await expect(menubarMenu.getByRole("menuitem", { name: "New file" })).toBeFocused();
  await page.getByRole("button", { name: "Externally close menubar" }).click();
  await expect(menubarMenu).toBeHidden();

  await page.getByRole("button", { name: "Externally open navigation" }).click();
  const navigation = page.getByRole("navigation", { name: "Locked navigation" });
  const popup = navigation.locator(".unit.-popup");
  await expect(popup).toBeVisible();
  const trigger = navigation.getByRole("button", { name: "Products" });
  await trigger.click();
  await trigger.click();
  await expect(popup).toBeVisible();
  await page.getByRole("button", { name: "Externally close navigation" }).click();
  await expect(popup).toBeHidden();
  await expectNagiDomClean(page);
});

test("rejected overlay opens never commit a native toggle or suppress a touch click", async ({ page }) => {
  const menubar = page.getByRole("menubar", { name: "Locked application" });
  const menubarPopup = menubar.locator("xpath=..").locator(".list[popover]");
  const navigation = page.getByRole("navigation", { name: "Locked navigation" });
  const navigationPopup = navigation.locator(".unit.-popup");
  for (const popup of [menubarPopup, navigationPopup]) {
    await popup.evaluate((element: HTMLElement) => {
      element.dataset.transitions = "";
      for (const type of ["beforetoggle", "toggle"]) {
        element.addEventListener(type, (event) => {
          const toggle = event as ToggleEvent;
          element.dataset.transitions += `${type}:${toggle.oldState}->${toggle.newState};`;
        });
      }
    });
  }
  await menubar.getByRole("menuitem", { name: "File" }).click();
  await navigation.getByRole("button", { name: "Products" }).click();
  await page.waitForTimeout(50);
  await expect(menubarPopup).toBeHidden();
  await expect(navigationPopup).toBeHidden();
  await expect(menubarPopup).toHaveAttribute("data-transitions", "");
  await expect(navigationPopup).toHaveAttribute("data-transitions", "");

  const touchTarget = page.getByRole("button", { name: "Locked context target" });
  const contextPopup = touchTarget.locator("xpath=../..").locator(".list[popover]");
  await contextPopup.evaluate((element: HTMLElement) => {
    element.dataset.transitions = "";
    for (const type of ["beforetoggle", "toggle"]) {
      element.addEventListener(type, (event) => {
        const toggle = event as ToggleEvent;
        element.dataset.transitions += `${type}:${toggle.oldState}->${toggle.newState};`;
      });
    }
  });
  await touchTarget.evaluate((element: HTMLElement) => {
    element.dataset.clicks = "0";
    element.addEventListener("click", () => { element.dataset.clicks = "1"; });
    element.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, pointerType: "touch", pointerId: 77, button: 0, clientX: 20, clientY: 20,
    }));
  });
  await page.waitForTimeout(650);
  await touchTarget.evaluate((element: HTMLElement) => {
    element.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, pointerType: "touch", pointerId: 77, button: 0, clientX: 20, clientY: 20,
    }));
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
  });
  await page.waitForTimeout(20);
  await expect(contextPopup).toBeHidden();
  await expect(contextPopup).toHaveAttribute("data-transitions", "");
  await expect(touchTarget).toHaveAttribute("data-clicks", "1");
});

test("ContextMenu external close terminates a long press and fallback anchors follow movement", async ({ page }) => {
  const target = page.getByText("Open the project context menu here");
  const menu = page.getByRole("menu", { name: "Context menu" });
  await target.evaluate((element) => element.dispatchEvent(new PointerEvent("pointerdown", {
    bubbles: true, pointerType: "touch", pointerId: 87, button: 0, clientX: 30, clientY: 40,
  })));
  await expect(menu).toBeVisible({ timeout: 1_000 });
  await page.getByRole("button", { name: "Outside target" }).click();
  await expect(menu).toBeHidden();
  await target.evaluate((element) => element.dispatchEvent(new PointerEvent("pointerup", {
    bubbles: true, pointerType: "touch", pointerId: 87, button: 0, clientX: 30, clientY: 40,
  })));
  await page.waitForTimeout(50);
  await expect(menu).toBeHidden();

  await target.evaluate((element) => element.dispatchEvent(new PointerEvent("pointerdown", {
    bubbles: true, pointerType: "touch", pointerId: 88, button: 0, clientX: 30, clientY: 40,
  })));
  await expect(menu).toBeVisible({ timeout: 1_000 });
  await page.getByRole("button", { name: "Close project context menu" }).evaluate(
    (element: HTMLElement) => element.click(),
  );
  await expect(menu).toBeHidden();
  await target.evaluate((element) => element.dispatchEvent(new PointerEvent("pointerup", {
    bubbles: true, pointerType: "touch", pointerId: 88, button: 0, clientX: 30, clientY: 40,
  })));
  await page.waitForTimeout(50);
  await expect(menu).toBeHidden();

  await page.getByRole("button", { name: "Externally open context menu" }).click();
  const lockedMenu = page.getByRole("menu", { name: "Locked context menu" });
  const contextRoot = lockedMenu.locator("xpath=..");
  const anchor = contextRoot.locator(".unit.-positioner");
  const before = Number.parseFloat(await anchor.evaluate((element: HTMLElement) => element.style.top));
  await contextRoot.locator(".unit.-target").evaluate((element: HTMLElement) => {
    element.style.transform = "translateY(40px)";
  });
  await expect.poll(async () => Number.parseFloat(
    await anchor.evaluate((element: HTMLElement) => element.style.top),
  )).toBeGreaterThan(before + 30);

  const beforeScroll = await page.evaluate(() => window.scrollY);
  const beforeScrollTop = Number.parseFloat(await anchor.evaluate((element: HTMLElement) => element.style.top));
  await page.evaluate(() => window.scrollBy(0, -100));
  const afterScroll = await page.evaluate(() => window.scrollY);
  const expectedTop = beforeScrollTop - (afterScroll - beforeScroll);
  await expect.poll(async () => Number.parseFloat(
    await anchor.evaluate((element: HTMLElement) => element.style.top),
  )).toBeCloseTo(expectedTop, 0);

  const beforeResizeLeft = Number.parseFloat(await anchor.evaluate((element: HTMLElement) => element.style.left));
  const viewport = page.viewportSize();
  await page.setViewportSize({ width: Math.max(640, (viewport?.width ?? 1280) - 240), height: viewport?.height ?? 720 });
  await expect.poll(async () => Number.parseFloat(
    await anchor.evaluate((element: HTMLElement) => element.style.left),
  )).not.toBe(beforeResizeLeft);
  await page.getByRole("button", { name: "Externally close context menu" }).click();

  const unmountTarget = page.getByRole("button", { name: "Unmount context target" });
  await unmountTarget.evaluate((element) => element.dispatchEvent(new PointerEvent("pointerdown", {
    bubbles: true, pointerType: "touch", pointerId: 99, button: 0, clientX: 10, clientY: 10,
  })));
  await page.getByRole("button", { name: "Unmount context menu" }).click();
  await page.waitForTimeout(150);
  await expect(page.getByRole("menu", { name: "Unmount context menu" })).toHaveCount(0);
});

test("expanded components are axe-clean in open interactive states", async ({ page }) => {
  const autocomplete = page.getByRole("combobox", { name: "Destination", exact: true });
  await autocomplete.click();
  await expectAxeClean(page);
  await expectNagiDomClean(page);
  await autocomplete.press("Escape");

  const multi = page.getByRole("combobox", { name: "Countries", exact: true });
  await multi.click();
  await expectAxeClean(page);
  await expectNagiDomClean(page);
  await multi.press("Escape");

  const navigation = page.getByRole("navigation", { name: "Primary navigation", exact: true });
  await navigation.getByRole("button", { name: "Products" }).hover();
  await expectAxeClean(page);
  await expectNagiDomClean(page);

  const menubar = page.getByRole("menubar", { name: "Application", exact: true });
  await menubar.getByRole("menuitem", { name: "File" }).click();
  await expect(menubar.locator("xpath=..").locator(".list[popover]")).toBeVisible();
  await expectAxeClean(page);
  await expectNagiDomClean(page);

  await page.getByText("Open the project context menu here").click({ button: "right" });
  await expect(page.getByRole("menu", { name: "Context menu" })).toBeVisible();
  await expectAxeClean(page);
  await expectNagiDomClean(page);
});

test("[CAR-STYLE-01] carousel and focus indicators respect reduced motion and forced colors", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await expect(page.getByRole("region", { name: "Release highlights", exact: true }).locator(".unit.-viewport"))
    .toHaveCSS("scroll-behavior", "auto");
  const toolbar = page.getByRole("toolbar", { name: "Formatting", exact: true });
  const bold = toolbar.getByRole("button", { name: "Bold" });
  await bold.focus();
  await expect(bold).toHaveCSS("outline-style", "solid");
});
