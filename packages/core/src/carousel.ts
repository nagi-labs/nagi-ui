import {
  computed,
  getCurrentInstance,
  nextTick,
  toValue,
  useId,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { requestModelValue, type WritableRef } from "./model-sync.ts";

export interface UseCarouselOptions<Item> {
  items: MaybeRefOrGetter<readonly Item[]>;
  index: WritableRef<number>;
  label: MaybeRefOrGetter<string>;
  previousLabel?: MaybeRefOrGetter<string | undefined>;
  nextLabel?: MaybeRefOrGetter<string | undefined>;
  trackLabel?: MaybeRefOrGetter<string | undefined>;
  formatAnnouncement?: (position: number | null, count: number) => string;
  formatSlideLabel?: (item: Item, position: number, count: number) => string;
  loop?: MaybeRefOrGetter<boolean | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  id?: string;
}

export interface CarouselRootProps {
  id: string;
  role: "region";
  "aria-label": string;
  "aria-disabled"?: "true" | undefined;
}

export interface CarouselTrackProps {
  role: "group";
  tabindex: 0 | -1;
  "aria-label": string;
  "aria-disabled"?: "true" | undefined;
  onScroll: (event: Event) => void;
  onPointerdown: () => void;
  onWheel: () => void;
  onKeydown: (event: KeyboardEvent) => void;
}

export interface CarouselSlideProps {
  id: string;
  role: "group";
  "aria-label": string;
}

export interface CarouselButtonProps {
  type: "button";
  "aria-label": string;
  disabled: boolean;
  onClick: () => void;
}

export interface CarouselBinding<Item> {
  index: Ref<number>;
  currentIndex: ComputedRef<number>;
  count: ComputedRef<number>;
  announcement: ComputedRef<string>;
  rootProps: CarouselRootProps;
  trackProps: CarouselTrackProps;
  previousButtonProps: CarouselButtonProps;
  nextButtonProps: CarouselButtonProps;
  slideProps: (item: Item, index: number) => CarouselSlideProps;
  setTrack: (element: Element | null) => void;
  goTo: (index: number) => void;
}

export interface CarouselComponentProps<Item> {
  readonly items: readonly Item[];
  readonly label: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
  readonly trackLabel?: string | undefined;
  readonly formatAnnouncement?: ((position: number | null, count: number) => string) | undefined;
  readonly formatSlideLabel?: ((item: Item, position: number, count: number) => string) | undefined;
  readonly loop: boolean;
  readonly disabled: boolean;
}

let carouselCount = 0;

function createCarousel<Item>(options: UseCarouselOptions<Item>): CarouselBinding<Item> {
  const instance = getCurrentInstance();
  const id = options.id ?? (instance ? useId() : `nagi-carousel-${carouselCount++}`);
  let track: HTMLElement | null = null;
  let programmaticTarget: number | null = null;

  const items = () => toValue(options.items);
  const count = computed(() => items().length);
  const disabled = () => toValue(options.disabled) ?? false;
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

  function goTo(candidate: number) {
    if (disabled() || count.value === 0) return;
    const current = currentIndex.value;
    const next = normalized(candidate);
    programmaticTarget = track && next !== current ? next : null;
    void requestModelValue(options.index, next).then((wasAccepted) => {
      const accepted = currentIndex.value;
      if (wasAccepted) return;
      programmaticTarget = accepted;
      const slide = track?.children.item(accepted) as HTMLElement | null;
      slide?.scrollIntoView({ block: "nearest", inline: "start" });
    });
  }

  function buttonProps(delta: -1 | 1): CarouselButtonProps {
    return {
      type: "button",
      get "aria-label"() {
        return toValue(delta < 0 ? options.previousLabel : options.nextLabel)
          ?? (delta < 0 ? "Previous slide" : "Next slide");
      },
      get disabled() {
        if (disabled() || count.value === 0) return true;
        if (loop()) return count.value < 2;
        return delta < 0 ? currentIndex.value <= 0 : currentIndex.value >= count.value - 1;
      },
      onClick: () => goTo(currentIndex.value + delta),
    };
  }

  watch([count, currentIndex], () => {
    const currentTrack = track;
    if (!currentTrack) return;
    const next = currentIndex.value;
    programmaticTarget = next;
    void nextTick(() => {
      if (track !== currentTrack) return;
      (currentTrack.children.item(next) as HTMLElement | null)?.scrollIntoView({ block: "nearest", inline: "start" });
    });
  }, { flush: "sync", immediate: true });

  return {
    index: options.index,
    currentIndex,
    count,
    announcement: computed(() => (options.formatAnnouncement ?? defaultPositionLabel)(
      count.value === 0 ? null : currentIndex.value + 1,
      count.value,
    )),
    rootProps: {
      id,
      role: "region",
      get "aria-label"() { return toValue(options.label); },
      get "aria-disabled"() { return disabled() ? "true" : undefined; },
    },
    trackProps: {
      role: "group",
      get tabindex() { return disabled() ? -1 : 0; },
      get "aria-label"() { return toValue(options.trackLabel) ?? toValue(options.label); },
      get "aria-disabled"() { return disabled() ? "true" : undefined; },
      onScroll(event) {
        track = event.currentTarget as HTMLElement;
        if (track.children.length === 0) return;
        if (disabled()) {
          const accepted = currentIndex.value;
          programmaticTarget = accepted;
          void nextTick(() => {
            (track?.children.item(accepted) as HTMLElement | null)?.scrollIntoView({
              block: "nearest",
              inline: "start",
            });
          });
          return;
        }
        const trackRect = track.getBoundingClientRect?.();
        const view = track.ownerDocument?.defaultView;
        const direction = view?.getComputedStyle(track).direction ?? "ltr";
        const firstOffset = (track.children.item(0) as HTMLElement | null)?.offsetLeft ?? 0;
        const start = Math.abs(track.scrollLeft);
        let closest = 0;
        let distance = Number.POSITIVE_INFINITY;
        Array.from(track.children).forEach((child, index) => {
          const element = child as HTMLElement;
          const childRect = element.getBoundingClientRect?.();
          const nextDistance = trackRect && childRect
            ? Math.abs(direction === "rtl"
              ? trackRect.right - childRect.right
              : childRect.left - trackRect.left)
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
            (track?.children.item(accepted) as HTMLElement | null)?.scrollIntoView({
              block: "nearest",
              inline: "start",
            });
          });
        }
      },
      onPointerdown() { programmaticTarget = null; },
      onWheel() { programmaticTarget = null; },
      onKeydown(event) {
        if (disabled()) return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          const element = event.currentTarget as HTMLElement | null;
          const direction = element?.ownerDocument.defaultView?.getComputedStyle(element).direction ?? "ltr";
          const forwardKey = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
          goTo(currentIndex.value + (event.key === forwardKey ? 1 : -1));
        } else if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          goTo(event.key === "Home" ? 0 : count.value - 1);
        }
      },
    },
    previousButtonProps: buttonProps(-1),
    nextButtonProps: buttonProps(1),
    slideProps(item, index) {
      return {
        id: `${id}-slide-${index + 1}`,
        role: "group",
        "aria-label": (options.formatSlideLabel
          ?? ((_, position, total) => defaultPositionLabel(position, total)))(item, index + 1, count.value),
      };
    },
    setTrack(element) {
      track = element as HTMLElement | null;
      if (!track || count.value === 0 || currentIndex.value === 0) return;
      const initialIndex = currentIndex.value;
      programmaticTarget = initialIndex;
      void nextTick(() => {
        (track?.children.item(initialIndex) as HTMLElement | null)?.scrollIntoView({
          block: "nearest",
          inline: "start",
        });
      });
    },
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
    label: () => props.label,
    previousLabel: () => props.previousLabel,
    nextLabel: () => props.nextLabel,
    trackLabel: () => props.trackLabel,
    ...(props.formatAnnouncement ? { formatAnnouncement: props.formatAnnouncement } : {}),
    ...(props.formatSlideLabel ? { formatSlideLabel: props.formatSlideLabel } : {}),
    loop: () => props.loop,
    disabled: () => props.disabled,
  });
}
