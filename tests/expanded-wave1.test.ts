import assert from "node:assert/strict";
import test from "node:test";

import { computed, effectScope, nextTick, ref } from "vue";

import { useCarousel } from "../packages/core/src/carousel.ts";
import { useOTPField } from "../packages/core/src/otp-field.ts";
import { useResizable } from "../packages/core/src/resizable.ts";
import { useToolbar } from "../packages/core/src/toolbar.ts";

function keyboard(key: string) {
  let prevented = false;
  return {
    event: {
      key,
      preventDefault() {
        prevented = true;
      },
    } as KeyboardEvent,
    prevented: () => prevented,
  };
}

test("Toolbar roves across enabled items and follows RTL", async () => {
  const scope = effectScope();
  const items = ref([{ key: "bold" }, { key: "italic", disabled: true }, { key: "link" }]);
  const focused: string[] = [];
  const toolbar = scope.run(() =>
    useToolbar({
      items,
      getKey: (item) => item.key,
      isDisabled: (item) => item.disabled ?? false,
      label: "Formatting",
      dir: "rtl",
    }),
  );
  assert.ok(toolbar);
  const first = toolbar.itemProps(items.value[0]);
  first.ref({
    isConnected: true,
    focus() {
      focused.push(first.id);
    },
  } as unknown as HTMLElement);
  const link = toolbar.itemProps(items.value[2]);
  link.ref({
    isConnected: true,
    focus() {
      focused.push(link.id);
    },
  } as unknown as HTMLElement);
  first.onFocus({ currentTarget: {} } as unknown as FocusEvent);
  const next = keyboard("ArrowLeft");
  toolbar.toolbarProps.onKeydown(next.event);
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.equal(next.prevented(), true);
  assert.equal(toolbar.activeKey.value, "link");
  assert.match(focused.at(-1) ?? "", /link$/u);
  scope.stop();
});

test("OTPField keeps one normalized real-input value and rolls rejected writes back", async () => {
  const source = ref("");
  const controlled = computed({ get: () => source.value, set: () => {} });
  const scope = effectScope();
  const field = scope.run(() =>
    useOTPField({
      value: controlled,
      label: "Verification code",
      length: 4,
      kind: "numeric",
    }),
  );
  assert.ok(field);
  const input = { value: "１２a34" } as HTMLInputElement;
  field.otpInputProps.onInput({ currentTarget: input } as unknown as Event);
  assert.equal(input.value, "1234");
  assert.deepEqual(field.cells.value, ["", "", "", ""]);
  await nextTick();
  await nextTick();
  assert.equal(input.value, "");
  scope.stop();
});

test("OTPField normalizes external models and accepts Unicode decimal digits", async () => {
  const source = ref("１２٣a");
  const scope = effectScope();
  const field = scope.run(() =>
    useOTPField({
      value: source,
      label: "Verification code",
      length: 3,
      kind: "numeric",
    }),
  );
  assert.ok(field);
  assert.equal(source.value, "12٣");
  assert.equal(field.isComplete.value, true);
  assert.equal(field.otpInputProps.pattern, "\\p{Decimal_Number}{3}");

  const rejectedSource = ref("12x");
  const controlled = computed({ get: () => rejectedSource.value, set: () => {} });
  const rejected = scope.run(() =>
    useOTPField({
      value: controlled,
      label: "Locked code",
      length: 3,
      kind: "numeric",
    }),
  );
  await nextTick();
  assert.equal(rejected?.isComplete.value, false);
  assert.equal(rejected?.otpInputProps.value, "12x");
  scope.stop();
});

test("OTPField uses one bounded finite length for cells and native constraints", () => {
  const scope = effectScope();
  scope.run(() => {
    for (const invalidLength of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const field = useOTPField({
        value: ref(""),
        label: "Verification code",
        length: invalidLength,
      });
      assert.equal(field.cells.value.length, 6);
      assert.equal(field.otpInputProps.minlength, 6);
      assert.equal(field.otpInputProps.pattern, "\\p{Decimal_Number}{6}");
    }

    const bounded = useOTPField({
      value: ref(""),
      label: "Long verification code",
      length: Number.MAX_SAFE_INTEGER,
    });
    assert.equal(bounded.cells.value.length, 256);
    assert.equal(bounded.otpInputProps.minlength, 256);
  });
  scope.stop();
});

test("Resizable supports keyboard bounds, RTL, and pointer capture", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref(50);
    const binding = useResizable({
      value,
      label: "Panels",
      orientation: "horizontal",
      dir: "rtl",
      min: 20,
      max: 80,
      step: 5,
    });
    binding.separatorProps.onKeydown(keyboard("ArrowLeft").event);
    assert.equal(value.value, 55);
    binding.separatorProps.onKeydown(keyboard("End").event);
    assert.equal(value.value, 80);

    const captures: number[] = [];
    const target = {
      parentElement: {
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 100 }),
      },
      setPointerCapture(id: number) {
        captures.push(id);
      },
      releasePointerCapture() {},
    };
    binding.separatorProps.onPointerdown({
      button: 0,
      pointerId: 7,
      clientX: 150,
      clientY: 0,
      currentTarget: target,
      preventDefault() {},
    } as unknown as PointerEvent);
    assert.deepEqual(captures, [7]);
    assert.equal(value.value, 25);
  });
  scope.stop();
});

test("Resizable sanitizes non-finite models and ignores zero-size pointer geometry", () => {
  const scope = effectScope();
  scope.run(() => {
    const value = ref(Number.NaN);
    const binding = useResizable({ value, label: "Panels", min: 20, max: 80 });
    assert.equal(value.value, 20);
    assert.equal(binding.currentValue.value, 20);
    binding.separatorProps.onPointerdown({
      button: 0,
      pointerId: 4,
      clientX: 10,
      clientY: 10,
      currentTarget: {
        parentElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }) },
        setPointerCapture() {},
      },
      preventDefault() {},
    } as unknown as PointerEvent);
    assert.equal(value.value, 20);
  });
  scope.stop();
});

function mockCarouselSlides(
  carouselId: string,
  count: number,
  onScrollIntoView: (index: number) => void,
) {
  const root = { id: carouselId } as HTMLElement;
  return Array.from({ length: count }, (_, itemIndex) => ({
    offsetLeft: itemIndex * 100,
    closest: () => root,
    contains: () => false,
    scrollIntoView: () => onScrollIntoView(itemIndex),
  })) as unknown as HTMLElement[];
}

test("[CAR-STATE-01] Carousel derives a bounded view without overwriting controlled indices", async () => {
  const scope = effectScope();
  await scope.run(async () => {
    const items = ref([{ key: "a" }, { key: "b" }, { key: "c" }]);
    const index = ref(0);
    const carousel = useCarousel({ items, index, label: "Featured" });
    const scrolled: number[] = [];
    const slides = mockCarouselSlides(carousel.rootProps.id, items.value.length, (itemIndex) => {
      scrolled.push(itemIndex);
    });
    carousel.viewportProps.ref({ querySelectorAll: () => slides } as unknown as Element);
    carousel.nextButtonProps.onClick();
    assert.equal(index.value, 1);
    await nextTick();
    await nextTick();
    assert.deepEqual(scrolled, [1]);
    assert.equal(carousel.announcement.value, "2 / 3");
    index.value = 99;
    assert.equal(index.value, 99);
    assert.equal(carousel.currentIndex.value, 2);
    items.value = [{ key: "a" }];
    assert.equal(index.value, 99);
    assert.equal(carousel.currentIndex.value, 0);
  });
  scope.stop();
});

test("[CAR-SEM-01][CAR-SEM-02][CAR-SEM-06] Carousel chooses landmark and viewport semantics explicitly", () => {
  const grouped = useCarousel({ items: [], index: ref(0), label: "Featured products" });
  const landmark = useCarousel({
    items: [],
    index: ref(0),
    label: "Featured products",
    landmark: true,
  });
  const blankDescriptions = useCarousel({
    items: [{ key: "a" }],
    index: ref(0),
    label: "Fallback descriptions",
    carouselRoleDescription: " ",
    slidesRoleDescription: " ",
    slideRoleDescription: " ",
  });

  assert.equal(grouped.rootProps.role, "group");
  assert.equal(landmark.rootProps.role, "region");
  assert.equal(grouped.rootProps["aria-label"], "Featured products");
  assert.equal(grouped.rootProps["aria-roledescription"], "carousel");
  assert.equal(grouped.viewportProps.role, "group");
  assert.equal(grouped.viewportProps["aria-label"], "Featured products");
  assert.equal(grouped.viewportProps["aria-roledescription"], "slides");
  assert.equal(blankDescriptions.rootProps["aria-roledescription"], "carousel");
  assert.equal(blankDescriptions.viewportProps["aria-roledescription"], "slides");
  assert.equal(blankDescriptions.slideProps({ key: "a" }, 0)["aria-roledescription"], "slide");
  assert.equal(typeof grouped.viewportProps.ref, "function");
});

test("[CAR-SEM-02][CAR-SEM-04][CAR-SEM-05][CAR-STATE-03] Carousel localizes role descriptions, slide text, and disabled policy", () => {
  const scope = effectScope();
  scope.run(() => {
    const items = [{ key: "a" }, { key: "b" }];
    const carousel = useCarousel({
      items,
      index: ref(1),
      label: "注目記事",
      slidesLabel: "記事一覧",
      carouselRoleDescription: "カルーセル",
      slidesRoleDescription: "スライド一覧",
      slideRoleDescription: "スライド",
      disabled: true,
      formatAnnouncement: (position, count) =>
        position === null ? "記事なし" : `${count}件中${position}件目`,
      formatSlideLabel: (_item, position, count) => `${count}件中${position}件目の記事`,
    });
    assert.equal(carousel.announcement.value, "2件中2件目");
    assert.equal(carousel.rootProps["aria-roledescription"], "カルーセル");
    assert.equal(carousel.viewportProps.tabindex, -1);
    assert.equal(carousel.viewportProps.role, "group");
    assert.equal(carousel.viewportProps["aria-label"], "記事一覧");
    assert.equal(carousel.viewportProps["aria-roledescription"], "スライド一覧");
    assert.equal("aria-disabled" in carousel.viewportProps, false);
    assert.equal("aria-disabled" in carousel.rootProps, false);
    assert.equal(carousel.rootProps["data-disabled"], "");
    assert.equal(carousel.slideProps(items[1]!, 1).role, "group");
    assert.equal(carousel.slideProps(items[1]!, 1)["aria-roledescription"], "スライド");
    assert.equal(
      carousel.slideProps(items[1]!, 1)["aria-labelledby"],
      carousel.slideLabelProps(1).id,
    );
    assert.equal(carousel.slidePosition(items[1]!, 1), "2件中2件目の記事");

    carousel.goTo(0);
    assert.equal(carousel.currentIndex.value, 1, "disabled user navigation is ignored");
    carousel.index.value = 0;
    assert.equal(
      carousel.currentIndex.value,
      0,
      "external controlled updates remain authoritative",
    );
  });
  scope.stop();
});

test("[CAR-INT-02] Carousel restores the physical slide when a controlled scroll write is rejected", async () => {
  const scope = effectScope();
  await scope.run(async () => {
    const source = ref(0);
    const index = computed({ get: () => source.value, set: () => {} });
    const carousel = useCarousel({ items: [{ key: "a" }, { key: "b" }], index, label: "Locked" });
    const restored: number[] = [];
    const slides = mockCarouselSlides(carousel.rootProps.id, 2, (itemIndex) => {
      restored.push(itemIndex);
    });
    const viewport = {
      querySelectorAll: () => slides,
      scrollLeft: 100,
      ownerDocument: { defaultView: { getComputedStyle: () => ({ direction: "ltr" }) } },
    } as unknown as HTMLElement;
    carousel.viewportProps.onScroll({ currentTarget: viewport } as unknown as Event);
    await nextTick();
    await nextTick();
    assert.equal(source.value, 0);
    assert.deepEqual(restored, [0]);
  });
  scope.stop();
});

test("Carousel ignores smooth-scroll intermediates during an external index transition", async () => {
  const scope = effectScope();
  await scope.run(async () => {
    const index = ref(0);
    const carousel = useCarousel({
      items: [{ key: "a" }, { key: "b" }, { key: "c" }],
      index,
      label: "External",
    });
    const scrolled: number[] = [];
    const slides = mockCarouselSlides(carousel.rootProps.id, 3, (itemIndex) => {
      scrolled.push(itemIndex);
    });
    const viewport = {
      querySelectorAll: () => slides,
      scrollLeft: 100,
      ownerDocument: { defaultView: { getComputedStyle: () => ({ direction: "ltr" }) } },
    } as unknown as HTMLElement;
    carousel.viewportProps.ref(viewport);
    index.value = 2;
    await nextTick();
    carousel.viewportProps.onScroll({ currentTarget: viewport } as unknown as Event);
    assert.equal(index.value, 2);
    assert.ok(scrolled.includes(2));
  });
  scope.stop();
});

test("Carousel keeps its smooth-scroll target after a repeated boundary request", async () => {
  const scope = effectScope();
  await scope.run(async () => {
    const index = ref(1);
    const carousel = useCarousel({
      items: [{ key: "a" }, { key: "b" }, { key: "c" }],
      index,
      label: "Boundary transition",
    });
    const slides = mockCarouselSlides(carousel.rootProps.id, 3, () => undefined);
    const viewport = {
      querySelectorAll: () => slides,
      scrollLeft: 100,
      ownerDocument: { defaultView: { getComputedStyle: () => ({ direction: "ltr" }) } },
    } as unknown as HTMLElement;
    carousel.viewportProps.ref(viewport);

    carousel.goTo(2);
    carousel.goTo(3);
    carousel.viewportProps.onScroll({ currentTarget: viewport } as unknown as Event);
    await nextTick();

    assert.equal(index.value, 2);
  });
  scope.stop();
});

test("[CAR-FOCUS-02] Carousel restores the accepted slide when focus interrupts smooth scrolling", async () => {
  const scope = effectScope();
  await scope.run(async () => {
    const index = ref(1);
    const carousel = useCarousel({
      items: [{ key: "a" }, { key: "b" }, { key: "c" }],
      index,
      label: "Focusable",
    });
    const scrolled: number[] = [];
    const slides = mockCarouselSlides(carousel.rootProps.id, 3, (itemIndex) => {
      scrolled.push(itemIndex);
    });
    carousel.viewportProps.ref({ querySelectorAll: () => slides } as unknown as Element);
    carousel.viewportProps.onFocus();
    await nextTick();
    await nextTick();

    assert.ok(scrolled.every((itemIndex) => itemIndex === 1));
    assert.ok(scrolled.length >= 1);
  });
  scope.stop();
});

test("[CAR-ANAT-01] Carousel discovers wrapped slides locally and excludes nested Carousel slides", async () => {
  const scope = effectScope();
  await scope.run(async () => {
    const index = ref(0);
    const carousel = useCarousel({
      items: [{ key: "a" }, { key: "b" }],
      index,
      label: "Outer",
    });
    const outerRoot = { id: carousel.rootProps.id } as HTMLElement;
    const nestedRoot = { id: "nested-carousel" } as HTMLElement;
    const scrolled: string[] = [];
    const outerFirst = {
      closest: () => outerRoot,
      contains: () => false,
      scrollIntoView: () => scrolled.push("outer-first"),
    } as unknown as HTMLElement;
    const nestedFirst = {
      closest: () => nestedRoot,
      contains: () => false,
      scrollIntoView: () => scrolled.push("nested-first"),
    } as unknown as HTMLElement;
    const outerSecond = {
      closest: () => outerRoot,
      contains: () => false,
      scrollIntoView: () => scrolled.push("outer-second"),
    } as unknown as HTMLElement;
    const viewport = {
      children: { length: 1 },
      querySelectorAll: () => [outerFirst, nestedFirst, outerSecond],
    } as unknown as Element;

    carousel.viewportProps.ref(viewport);
    carousel.goTo(1);
    await nextTick();
    await nextTick();

    assert.equal(index.value, 1);
    assert.deepEqual(scrolled, ["outer-second"]);
  });
  scope.stop();
});

test("[CAR-STATE-02] Carousel normalizes loop requests with one finite modulo rule", () => {
  const scope = effectScope();
  scope.run(() => {
    const index = ref(-4);
    const carousel = useCarousel({
      items: [{ key: "a" }, { key: "b" }, { key: "c" }],
      index,
      label: "Looped",
      loop: true,
    });
    assert.equal(carousel.currentIndex.value, 2);
    assert.equal(carousel.announcement.value, "3 / 3");

    carousel.goTo(-7);
    assert.equal(index.value, 2);
    index.value = Number.NaN;
    assert.equal(carousel.currentIndex.value, 0);
    assert.equal(carousel.announcement.value, "1 / 3");
    carousel.goTo(Number.POSITIVE_INFINITY);
    assert.equal(index.value, 0);
  });
  scope.stop();
});

test("[CAR-STATE-02][CAR-FOCUS-01] non-looping boundary controls remain focusable", () => {
  const index = ref(0);
  const carousel = useCarousel({
    items: [{ key: "a" }, { key: "b" }, { key: "c" }],
    index,
    label: "Bounded",
  });

  assert.equal(carousel.previousButtonProps.disabled, false);
  assert.equal(carousel.previousButtonProps["aria-disabled"], "true");
  assert.equal(carousel.nextButtonProps.disabled, false);
  assert.equal(carousel.nextButtonProps["aria-disabled"], undefined);

  carousel.goTo(2);
  assert.equal(carousel.previousButtonProps["aria-disabled"], undefined);
  assert.equal(carousel.nextButtonProps.disabled, false);
  assert.equal(carousel.nextButtonProps["aria-disabled"], "true");
});
