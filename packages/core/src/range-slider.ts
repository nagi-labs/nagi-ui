import {
  computed,
  getCurrentInstance,
  onMounted,
  onUpdated,
  type WritableComputedRef,
} from "vue";

import { useNativeFormReset } from "./native-form.ts";

type ReadonlyInputRef = Readonly<{
  value: HTMLInputElement | null;
}>;

export type RangeSliderValue = readonly [lower: number, upper: number];

type WritableRangeSliderModel = {
  value: RangeSliderValue;
};

export interface RangeSliderBinding {
  lowerValue: WritableComputedRef<number>;
  upperValue: WritableComputedRef<number>;
  railProps: RangeSliderRailProps;
}

export interface RangeSliderRailProps {
  onPointerdown: (event: PointerEvent) => void;
  onPointermove: (event: PointerEvent) => void;
  onPointerup: (event: PointerEvent) => void;
  onPointercancel: (event: PointerEvent) => void;
}

function nativeValue(control: HTMLInputElement | null, fallback: number): number {
  const value = control?.valueAsNumber;
  return value !== undefined && Number.isFinite(value) ? value : fallback;
}

function ordered(lower: number, upper: number): RangeSliderValue {
  return lower <= upper ? [lower, upper] : [upper, lower];
}

function isEffectivelyDisabled(control: HTMLInputElement): boolean {
  return control.disabled || control.matches?.(":disabled") === true;
}

/**
 * Keeps a two-input native range control aligned with its tuple model.
 * Range sanitization, reset ordering, and DOM/model synchronization stay here;
 * labels and the visible lower/upper constraints remain in the Blueprint.
 */
export function useRangeSlider(
  lowerInput: ReadonlyInputRef,
  upperInput: ReadonlyInputRef,
  model: WritableRangeSliderModel,
): RangeSliderBinding {
  let initialValue = ordered(model.value[0], model.value[1]);

  const commit = (lower: number, upper: number): RangeSliderValue => {
    const next = ordered(lower, upper);
    if (model.value[0] !== next[0] || model.value[1] !== next[1]) {
      model.value = next;
    }
    return next;
  };

  const syncNativeValues = (): RangeSliderValue => {
    const current = model.value;
    const lowerControl = lowerInput.value;
    const upperControl = upperInput.value;
    const next = ordered(
      nativeValue(lowerControl, current[0]),
      nativeValue(upperControl, current[1]),
    );

    if (lowerControl && lowerControl.valueAsNumber !== next[0]) {
      lowerControl.value = String(next[0]);
    }
    if (upperControl && upperControl.valueAsNumber !== next[1]) {
      upperControl.value = String(next[1]);
    }

    return commit(
      nativeValue(lowerControl, next[0]),
      nativeValue(upperControl, next[1]),
    );
  };

  const lowerValue = computed<number>({
    get: () => ordered(model.value[0], model.value[1])[0],
    set: (next) => {
      const upper = nativeValue(upperInput.value, model.value[1]);
      let lower = nativeValue(lowerInput.value, next);
      if (lower > upper) {
        if (lowerInput.value) lowerInput.value.value = String(upper);
        lower = nativeValue(lowerInput.value, upper);
      }
      commit(lower, upper);
    },
  });

  const upperValue = computed<number>({
    get: () => ordered(model.value[0], model.value[1])[1],
    set: (next) => {
      const lower = nativeValue(lowerInput.value, model.value[0]);
      let upper = nativeValue(upperInput.value, next);
      if (upper < lower) {
        if (upperInput.value) upperInput.value.value = String(lower);
        upper = nativeValue(upperInput.value, lower);
      }
      commit(lower, upper);
    },
  });

  type Thumb = "lower" | "upper";
  let activePointer: number | null = null;
  let activeThumb: Thumb | null = null;
  let pointerChanged = false;
  let lastActiveThumb: Thumb = "lower";

  function pointerValue(event: PointerEvent): number | null {
    const rail = event.currentTarget as HTMLElement;
    const rect = rail.getBoundingClientRect();
    const lowerControl = lowerInput.value;
    const upperControl = upperInput.value;
    if (!lowerControl || !upperControl || rect.width <= 0) return null;

    const min = Number(lowerControl.min || 0);
    const max = Number(upperControl.max || 100);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return null;

    let ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const direction = rail.ownerDocument.defaultView?.getComputedStyle(rail).direction;
    if (direction === "rtl") ratio = 1 - ratio;
    return min + ratio * (max - min);
  }

  function chooseThumb(value: number): Thumb | null {
    const lowerControl = lowerInput.value;
    const upperControl = upperInput.value;
    if (
      !lowerControl ||
      !upperControl ||
      (isEffectivelyDisabled(lowerControl) && isEffectivelyDisabled(upperControl))
    ) {
      return null;
    }

    const lower = nativeValue(lowerControl, model.value[0]);
    const upper = nativeValue(upperControl, model.value[1]);
    if (lower === upper) {
      if (value < lower) return isEffectivelyDisabled(lowerControl) ? "upper" : "lower";
      if (value > upper) return isEffectivelyDisabled(upperControl) ? "lower" : "upper";
      return lastActiveThumb;
    }

    const lowerDistance = Math.abs(value - lower);
    const upperDistance = Math.abs(value - upper);
    if (lowerDistance === upperDistance) return lastActiveThumb;
    return lowerDistance < upperDistance ? "lower" : "upper";
  }

  function setThumb(thumb: Thumb, value: number): boolean {
    const control = thumb === "lower" ? lowerInput.value : upperInput.value;
    if (!control || isEffectivelyDisabled(control)) return false;
    const previous = nativeValue(control, thumb === "lower" ? model.value[0] : model.value[1]);
    control.value = String(value);
    const sanitized = nativeValue(control, thumb === "lower" ? model.value[0] : model.value[1]);
    if (thumb === "lower") lowerValue.value = sanitized;
    else upperValue.value = sanitized;
    const committed = nativeValue(
      control,
      thumb === "lower" ? model.value[0] : model.value[1],
    );
    if (previous === committed) return false;
    control.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  function updateFromPointer(event: PointerEvent) {
    if (activePointer !== event.pointerId || !activeThumb) return;
    const value = pointerValue(event);
    if (value === null) return;
    event.preventDefault();
    pointerChanged = setThumb(activeThumb, value) || pointerChanged;
  }

  function finishPointer(event: PointerEvent) {
    if (activePointer !== event.pointerId) return;
    updateFromPointer(event);
    const rail = event.currentTarget as HTMLElement;
    if (rail.hasPointerCapture?.(event.pointerId)) {
      rail.releasePointerCapture(event.pointerId);
    }
    if (pointerChanged && activeThumb) {
      const control = activeThumb === "lower" ? lowerInput.value : upperInput.value;
      control?.dispatchEvent(new Event("change", { bubbles: true }));
    }
    activePointer = null;
    activeThumb = null;
    pointerChanged = false;
  }

  const railProps: RangeSliderRailProps = {
    onPointerdown: (event) => {
      if (event.button !== 0) return;
      const value = pointerValue(event);
      if (value === null) return;
      const thumb = chooseThumb(value);
      if (!thumb) return;

      event.preventDefault();
      activePointer = event.pointerId;
      activeThumb = thumb;
      pointerChanged = false;
      lastActiveThumb = thumb;
      const rail = event.currentTarget as HTMLElement;
      rail.setPointerCapture?.(event.pointerId);
      const control = thumb === "lower" ? lowerInput.value : upperInput.value;
      control?.focus({ preventScroll: true });
      pointerChanged = setThumb(thumb, value);
    },
    onPointermove: updateFromPointer,
    onPointerup: finishPointer,
    onPointercancel: (event) => {
      if (activePointer !== event.pointerId) return;
      activePointer = null;
      activeThumb = null;
      pointerChanged = false;
    },
  };

  useNativeFormReset(lowerInput, () => {
    if (lowerInput.value) lowerInput.value.value = String(initialValue[0]);
    if (upperInput.value) upperInput.value.value = String(initialValue[1]);
    syncNativeValues();
  });

  if (lowerInput.value || upperInput.value) initialValue = syncNativeValues();

  if (getCurrentInstance()) {
    // Range inputs sanitize after Vue patches value/min/max/step. Always read
    // the browser result instead of reproducing its rounding algorithm.
    onMounted(() => {
      initialValue = syncNativeValues();
    });
    onUpdated(syncNativeValues);
  }

  return { lowerValue, upperValue, railProps };
}
