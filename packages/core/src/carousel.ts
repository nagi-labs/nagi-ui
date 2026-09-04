import {
  computed,
  getCurrentInstance,
  nextTick,
  reactive,
  toValue,
  useId,
  watch,
  type ComponentPublicInstance,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { requestModelValue, type WritableRef } from "./model-sync.ts";

export interface UseCarouselOptions<Item> {
  items: MaybeRefOrGetter<readonly Item[]>;
  index: WritableRef<number>;
  label: MaybeRefOrGetter<string>;
  slidesLabel?: MaybeRefOrGetter<string | undefined>;
  carouselRoleDescription?: MaybeRefOrGetter<string | undefined>;
  slidesRoleDescription?: MaybeRefOrGetter<string | undefined>;
  slideRoleDescription?: MaybeRefOrGetter<string | undefined>;
  landmark?: MaybeRefOrGetter<boolean | undefined>;
  previousLabel?: MaybeRefOrGetter<string | undefined>;
  nextLabel?: MaybeRefOrGetter<string | undefined>;
  formatAnnouncement?: (position: number | null, count: number) => string;
  formatSlideLabel?: (item: Item, position: number, count: number) => string;
  loop?: MaybeRefOrGetter<boolean | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  id?: string;
}

export interface CarouselRootProps {
  id: string;
  role: "group" | "region";
  "aria-label": string;
  "aria-roledescription": string;
  "data-disabled"?: "" | undefined;
}

export interface CarouselViewportProps {
  /** Vue template ref callback; it does not render a DOM attribute. */
  ref: (element: Element | ComponentPublicInstance | null) => void;
  role: "group";
  "aria-label": string;
  "aria-roledescription": string;
  tabindex: 0 | -1;
  onFocus: () => void;
  onScroll: (event: Event) => void;
  onPointerdown: () => void;
  onWheel: () => void;
}

export interface CarouselSlideProps {
  role: "group";
  "aria-roledescription": string;
  "aria-labelledby": string;
}

export interface CarouselSlideLabelProps {
  id: string;
}

export interface CarouselButtonProps {
  type: "button";
  "aria-label": string;
  "aria-disabled": "true" | undefined;
  disabled: boolean;
  onClick: () => void;
}

export interface CarouselBinding<Item> {
  index: Ref<number>;
  currentIndex: ComputedRef<number>;
  count: ComputedRef<number>;
  announcement: ComputedRef<string>;
  rootProps: CarouselRootProps;
  viewportProps: CarouselViewportProps;
  previousButtonProps: CarouselButtonProps;
  nextButtonProps: CarouselButtonProps;
  slideProps: (item: Item, index: number) => CarouselSlideProps;
  slideLabelProps: (index: number) => CarouselSlideLabelProps;
  slidePosition: (item: Item, index: number) => string;
  goTo: (index: number) => void;
}

export interface CarouselComponentProps<Item> {
  readonly items: readonly Item[];
  readonly id?: string | undefined;
  readonly label: string;
  readonly slidesLabel?: string | undefined;
  readonly carouselRoleDescription: string;
  readonly slidesRoleDescription: string;
  readonly slideRoleDescription: string;
  readonly landmark: boolean;
  readonly previousLabel: string;
  readonly nextLabel: string;
  readonly formatAnnouncement?: ((position: number | null, count: number) => string) | undefined;
  readonly formatSlideLabel?: ((item: Item, position: number, count: number) => string) | undefined;
  readonly loop: boolean;
  readonly disabled: boolean;
}

let carouselCount = 0;
const carouselRootSelector = '[data-scope="carousel"][data-part="root"]';
const slideSelector = '[data-scope="carousel"][data-part="slide"]';

function localizedRoleDescription(
  value: MaybeRefOrGetter<string | undefined> | undefined,
  fallback: string,
): string {
  return toValue(value)?.trim() || fallback;
}

function createCarousel<Item>(options: UseCarouselOptions<Item>): CarouselBinding<Item> {
  const instance = getCurrentInstance();
  const id = options.id ?? (instance ? useId() : `nagi-carousel-${carouselCount++}`);
  let viewport: HTMLElement | null = null;
  let programmaticTarget: number | null = null;

  const items = () => toValue(options.items);
  const count = computed(() => items().length);
  const disabled = () => toValue(options.disabled) ?? false;
  const landmark = () => toValue(options.landmark) ?? false;
  const loop = () => toValue(options.loop) ?? false;

  function normalized(candidate: number): number {
    if (count.value === 0) return 0;
    const finite = Number.isFinite(candidate) ? Math.trunc(candidate) : 0;
    if (loop()) return ((finite % count.value) + count.value) % count.value;
    return Math.max(0, Math.min(finite, count.value - 1));
  }
  const currentIndex = computed(() => normalized(options.index.value));
  const defaultPositionLabel = (position: number | null, total: number) =>
    position === null ? "" : `${position} / ${total}`;

  function slides(currentViewport: HTMLElement | null = viewport): HTMLElement[] {
    if (!currentViewport) return [];
    const candidates = Array.from(
      currentViewport.querySelectorAll<HTMLElement>(slideSelector),
    ).filter((slide) => slide.closest<HTMLElement>(carouselRootSelector)?.id === id);
    return candidates
      .filter(
        (slide) =>
          !candidates.some(
            (possibleOwner) => possibleOwner !== slide && possibleOwner.contains(slide),
          ),
      )
      .slice(0, count.value);
  }

  function slideAt(index: number, currentViewport: HTMLElement | null = viewport) {
    return slides(currentViewport)[index] ?? null;
  }

  function setViewport(element: Element | ComponentPublicInstance | null) {
    viewport = element as HTMLElement | null;
    if (!viewport || count.value === 0 || currentIndex.value === 0) return;
    const initialIndex = currentIndex.value;
    programmaticTarget = initialIndex;
    void nextTick(() => {
      slideAt(initialIndex)?.scrollIntoView({
        block: "nearest",
        inline: "start",
      });
    });
  }

  function goTo(candidate: number) {
    if (disabled() || count.value === 0) return;
    const current = currentIndex.value;
    const next = normalized(candidate);
    // Repeating a boundary request must not cancel a smooth transition that
    // is still moving toward the already accepted target.
    if (next !== current) programmaticTarget = viewport ? next : null;
    void requestModelValue(options.index, next).then((wasAccepted) => {
      const accepted = currentIndex.value;
      if (wasAccepted) return;
      programmaticTarget = accepted;
      slideAt(accepted)?.scrollIntoView({ block: "nearest", inline: "start" });
    });
  }

  function buttonProps(delta: -1 | 1): CarouselButtonProps {
    const atBoundary = () =>
      !loop() && (delta < 0 ? currentIndex.value <= 0 : currentIndex.value >= count.value - 1);
    return reactive<CarouselButtonProps>({
      type: "button",
      get "aria-label"() {
        return (
          toValue(delta < 0 ? options.previousLabel : options.nextLabel) ??
          (delta < 0 ? "Previous slide" : "Next slide")
        );
      },
      get disabled() {
        return disabled() || count.value < 2;
      },
      get "aria-disabled"() {
        return !disabled() && count.value >= 2 && atBoundary() ? ("true" as const) : undefined;
      },
      onClick: () => goTo(currentIndex.value + delta),
    });
  }

  function reconcileViewportPosition() {
    const currentViewport = viewport;
    if (!currentViewport) return;
    const next = currentIndex.value;
    programmaticTarget = next;
    void nextTick(() => {
      if (viewport !== currentViewport) return;
      slideAt(next, currentViewport)?.scrollIntoView({ block: "nearest", inline: "start" });
    });
  }

  watch([count, currentIndex], reconcileViewportPosition, { flush: "sync", immediate: true });

  const rootProps = reactive<CarouselRootProps>({
    id,
    get role() {
      return landmark() ? "region" : "group";
    },
    get "aria-label"() {
      return toValue(options.label);
    },
    get "aria-roledescription"() {
      return localizedRoleDescription(options.carouselRoleDescription, "carousel");
    },
    get "data-disabled"() {
      return disabled() ? "" : undefined;
    },
  });
  const viewportProps = reactive<CarouselViewportProps>({
    ref: setViewport,
    role: "group",
    get "aria-label"() {
      return toValue(options.slidesLabel) ?? toValue(options.label);
    },
    get "aria-roledescription"() {
      return localizedRoleDescription(options.slidesRoleDescription, "slides");
    },
    get tabindex() {
      return disabled() ? -1 : 0;
    },
    onFocus() {
      const currentViewport = viewport;
      if (!currentViewport || count.value === 0) return;
      const accepted = currentIndex.value;
      programmaticTarget = accepted;
      void nextTick(() => {
        if (viewport !== currentViewport) return;
        slideAt(accepted, currentViewport)?.scrollIntoView({
          block: "nearest",
          inline: "start",
        });
      });
    },
    onScroll(event) {
      viewport = event.currentTarget as HTMLElement;
      const renderedSlides = slides(viewport);
      if (renderedSlides.length === 0) return;
      if (disabled()) {
        const accepted = currentIndex.value;
        programmaticTarget = accepted;
        void nextTick(() => {
          slideAt(accepted)?.scrollIntoView({
            block: "nearest",
            inline: "start",
          });
        });
        return;
      }
      const viewportRect = viewport.getBoundingClientRect?.();
      const view = viewport.ownerDocument?.defaultView;
      const direction = view?.getComputedStyle(viewport).direction ?? "ltr";
      const firstOffset = renderedSlides[0]?.offsetLeft ?? 0;
      const start = Math.abs(viewport.scrollLeft);
      let closest = 0;
      let distance = Number.POSITIVE_INFINITY;
      renderedSlides.forEach((element, index) => {
        const childRect = element.getBoundingClientRect?.();
        const nextDistance =
          viewportRect && childRect
            ? Math.abs(
                direction === "rtl"
                  ? viewportRect.right - childRect.right
                  : childRect.left - viewportRect.left,
              )
            : Math.abs(Math.abs(element.offsetLeft - firstOffset) - start);
        if (nextDistance < distance) {
          closest = index;
          distance = nextDistance;
        }
      });
      if (programmaticTarget !== null) {
        if (closest === programmaticTarget) programmaticTarget = null;
        return;
      }
      if (closest !== currentIndex.value) {
        void requestModelValue(options.index, closest).then((wasAccepted) => {
          const accepted = currentIndex.value;
          if (wasAccepted) return;
          programmaticTarget = accepted;
          slideAt(accepted)?.scrollIntoView({
            block: "nearest",
            inline: "start",
          });
        });
      }
    },
    onPointerdown() {
      programmaticTarget = null;
    },
    onWheel() {
      programmaticTarget = null;
    },
  });

  return {
    index: options.index,
    currentIndex,
    count,
    announcement: computed(() =>
      (options.formatAnnouncement ?? defaultPositionLabel)(
        count.value === 0 ? null : currentIndex.value + 1,
        count.value,
      ),
    ),
    rootProps,
    viewportProps,
    previousButtonProps: buttonProps(-1),
    nextButtonProps: buttonProps(1),
    slideProps(_item, index) {
      return {
        role: "group",
        "aria-roledescription": localizedRoleDescription(options.slideRoleDescription, "slide"),
        "aria-labelledby": `${id}-slide-${index + 1}-label`,
      };
    },
    slideLabelProps: (index) => ({ id: `${id}-slide-${index + 1}-label` }),
    slidePosition: (item, index) =>
      (options.formatSlideLabel ?? ((_, position, total) => defaultPositionLabel(position, total)))(
        item,
        index + 1,
        count.value,
      ),
    goTo,
  };
}

export function useCarousel<Item>(options: UseCarouselOptions<Item>): CarouselBinding<Item>;
export function useCarousel<Item>(
  props: CarouselComponentProps<Item>,
  index: Ref<number>,
): CarouselBinding<Item>;
export function useCarousel<Item>(
  optionsOrProps: UseCarouselOptions<Item> | CarouselComponentProps<Item>,
  index?: Ref<number>,
): CarouselBinding<Item> {
  if (index === undefined) return createCarousel(optionsOrProps as UseCarouselOptions<Item>);
  const props = optionsOrProps as CarouselComponentProps<Item>;
  return createCarousel({
    items: () => props.items,
    index,
    ...(props.id ? { id: props.id } : {}),
    label: () => props.label,
    slidesLabel: () => props.slidesLabel,
    carouselRoleDescription: () => props.carouselRoleDescription,
    slidesRoleDescription: () => props.slidesRoleDescription,
    slideRoleDescription: () => props.slideRoleDescription,
    landmark: () => props.landmark,
    previousLabel: () => props.previousLabel,
    nextLabel: () => props.nextLabel,
    ...(props.formatAnnouncement ? { formatAnnouncement: props.formatAnnouncement } : {}),
    ...(props.formatSlideLabel ? { formatSlideLabel: props.formatSlideLabel } : {}),
    loop: () => props.loop,
    disabled: () => props.disabled,
  });
}
