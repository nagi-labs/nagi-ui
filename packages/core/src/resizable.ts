import {
  computed,
  getCurrentInstance,
  toValue,
  useId,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import { requestModelValue, type WritableRef } from "./model-sync.ts";

export type ResizableOrientation = "horizontal" | "vertical";
export type ResizableDirection = "ltr" | "rtl";

export interface UseResizableOptions {
  value: WritableRef<number>;
  label: MaybeRefOrGetter<string>;
  orientation?: MaybeRefOrGetter<ResizableOrientation | undefined>;
  dir?: MaybeRefOrGetter<ResizableDirection | undefined>;
  min?: MaybeRefOrGetter<number | undefined>;
  max?: MaybeRefOrGetter<number | undefined>;
  step?: MaybeRefOrGetter<number | undefined>;
  disabled?: MaybeRefOrGetter<boolean | undefined>;
  id?: string;
}

export interface ResizableSeparatorProps {
  id: string;
  role: "separator";
  tabindex: 0 | -1;
  "aria-label": string;
  "aria-controls": string;
  "aria-orientation": "horizontal" | "vertical";
  "aria-valuemin": number;
  "aria-valuemax": number;
  "aria-valuenow": number;
  "aria-disabled"?: "true" | undefined;
  onKeydown: (event: KeyboardEvent) => void;
  onPointerdown: (event: PointerEvent) => void;
  onPointermove: (event: PointerEvent) => void;
  onPointerup: (event: PointerEvent) => void;
  onPointercancel: (event: PointerEvent) => void;
  onLostpointercapture: (event: PointerEvent) => void;
}

export interface ResizableBinding {
  value: Ref<number>;
  currentValue: ComputedRef<number>;
  firstBasis: ComputedRef<string>;
  primaryPanelProps: { id: string };
  separatorProps: ResizableSeparatorProps;
}

export interface ResizableComponentProps {
  readonly label: string;
  readonly orientation: ResizableOrientation;
  readonly dir: ResizableDirection;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly disabled: boolean;
}

let resizableCount = 0;

function createResizable(options: UseResizableOptions): ResizableBinding {
  const instance = getCurrentInstance();
  const id = options.id ?? (instance ? useId() : `nagi-resizable-${resizableCount++}`);
  let activePointer: number | null = null;
  let root: HTMLElement | null = null;

  const finiteOr = (value: number | undefined, fallback: number) =>
    value !== undefined && Number.isFinite(value) ? value : fallback;
  const minimum = () => Math.max(0, Math.min(100, finiteOr(toValue(options.min), 10)));
  const maximum = () => Math.max(minimum(), Math.min(100, finiteOr(toValue(options.max), 90)));
  const disabled = () => toValue(options.disabled) ?? false;
  const orientation = () => toValue(options.orientation) ?? "horizontal";
  const clamp = (value: number) =>
    Math.max(minimum(), Math.min(maximum(), Number.isFinite(value) ? value : minimum()));
  const currentValue = computed(() => clamp(options.value.value));
  let restoreValue =
    clamp(options.value.value) > minimum() ? clamp(options.value.value) : maximum();

  function write(value: number) {
    if (disabled() || !Number.isFinite(value)) return;
    options.value.value = Math.round(clamp(value) * 1000) / 1000;
  }

  function fromPointer(event: PointerEvent) {
    if (!root) return;
    const rect = root.getBoundingClientRect();
    if (orientation() === "horizontal") {
      if (!Number.isFinite(rect.width) || rect.width <= 0 || !Number.isFinite(event.clientX))
        return;
      const raw = ((event.clientX - rect.left) / rect.width) * 100;
      write((toValue(options.dir) ?? "ltr") === "rtl" ? 100 - raw : raw);
    } else {
      if (!Number.isFinite(rect.height) || rect.height <= 0 || !Number.isFinite(event.clientY))
        return;
      write(((event.clientY - rect.top) / rect.height) * 100);
    }
  }

  function reconcileBounds() {
    const next = currentValue.value;
    if (!Object.is(options.value.value, next)) void requestModelValue(options.value, next);
  }

  watch([() => options.value.value, minimum, maximum], reconcileBounds, {
    flush: "sync",
    immediate: true,
  });

  const separatorProps: ResizableSeparatorProps = {
    id,
    role: "separator",
    get tabindex() {
      return disabled() ? -1 : 0;
    },
    get "aria-label"() {
      return toValue(options.label);
    },
    "aria-controls": `${id}-primary`,
    get "aria-orientation"() {
      return orientation() === "horizontal" ? "vertical" : "horizontal";
    },
    get "aria-valuemin"() {
      return minimum();
    },
    get "aria-valuemax"() {
      return maximum();
    },
    get "aria-valuenow"() {
      return clamp(options.value.value);
    },
    get "aria-disabled"() {
      return disabled() ? "true" : undefined;
    },
    onKeydown(event) {
      if (disabled()) return;
      const amount = Math.max(0.1, toValue(options.step) ?? 1);
      let delta = 0;
      if (orientation() === "horizontal") {
        if (event.key === "ArrowLeft")
          delta = (toValue(options.dir) ?? "ltr") === "rtl" ? amount : -amount;
        if (event.key === "ArrowRight")
          delta = (toValue(options.dir) ?? "ltr") === "rtl" ? -amount : amount;
      } else {
        if (event.key === "ArrowUp") delta = -amount;
        if (event.key === "ArrowDown") delta = amount;
      }
      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        if (event.key === "Home" && clamp(options.value.value) > minimum()) {
          restoreValue = clamp(options.value.value);
        }
        write(event.key === "Home" ? minimum() : maximum());
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (clamp(options.value.value) <= minimum()) write(restoreValue);
        else {
          restoreValue = clamp(options.value.value);
          write(minimum());
        }
      } else if (delta !== 0) {
        event.preventDefault();
        write(options.value.value + delta);
      }
    },
    onPointerdown(event) {
      if (disabled() || event.button !== 0) return;
      activePointer = event.pointerId;
      root = (event.currentTarget as HTMLElement).parentElement;
      try {
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      } catch {
        activePointer = null;
        root = null;
        return;
      }
      event.preventDefault();
      fromPointer(event);
    },
    onPointermove(event) {
      if (activePointer === event.pointerId) fromPointer(event);
    },
    onPointerup(event) {
      if (activePointer !== event.pointerId) return;
      const target = event.currentTarget as HTMLElement;
      if (
        typeof target.hasPointerCapture === "function" &&
        target.hasPointerCapture(event.pointerId)
      ) {
        target.releasePointerCapture(event.pointerId);
      }
      activePointer = null;
      root = null;
    },
    onPointercancel(event) {
      if (activePointer === event.pointerId) {
        activePointer = null;
        root = null;
      }
    },
    onLostpointercapture(event) {
      if (activePointer === event.pointerId) {
        activePointer = null;
        root = null;
      }
    },
  };

  return {
    value: options.value,
    currentValue,
    firstBasis: computed(() => `${currentValue.value}%`),
    primaryPanelProps: { id: `${id}-primary` },
    separatorProps,
  };
}

export function useResizable(options: UseResizableOptions): ResizableBinding;
export function useResizable(props: ResizableComponentProps, value: Ref<number>): ResizableBinding;
export function useResizable(
  optionsOrProps: UseResizableOptions | ResizableComponentProps,
  value?: Ref<number>,
): ResizableBinding {
  if (value === undefined) return createResizable(optionsOrProps as UseResizableOptions);
  const props = optionsOrProps as ResizableComponentProps;
  return createResizable({
    value,
    label: () => props.label,
    orientation: () => props.orientation,
    dir: () => props.dir,
    min: () => props.min,
    max: () => props.max,
    step: () => props.step,
    disabled: () => props.disabled,
  });
}
