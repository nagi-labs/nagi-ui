import { toValue, type MaybeRefOrGetter, type Ref } from "vue";

export type ToggleGroupMode = "single" | "multiple";
export type ToggleGroupValue = string | null | readonly string[];

export interface UseToggleGroupOptions {
  mode?: MaybeRefOrGetter<ToggleGroupMode>;
  disabled?: MaybeRefOrGetter<boolean>;
}

export interface UseToggleGroupReturn {
  isPressed: (key: string) => boolean;
  toggle: (key: string, itemDisabled?: boolean) => void;
}

/** Owns single/multiple toggle-group selection without introducing composite focus behavior. */
export function useToggleGroup(
  options: UseToggleGroupOptions,
  value: Ref<ToggleGroupValue>,
): UseToggleGroupReturn {
  const mode = () => toValue(options.mode) ?? "single";
  const disabled = () => toValue(options.disabled) ?? false;

  function isPressed(key: string) {
    return mode() === "multiple"
      ? Array.isArray(value.value) && value.value.includes(key)
      : value.value === key;
  }

  function toggle(key: string, itemDisabled = false) {
    if (disabled() || itemDisabled) return;
    if (mode() === "multiple") {
      const selected = Array.isArray(value.value) ? value.value : [];
      value.value = selected.includes(key)
        ? selected.filter((selectedKey) => selectedKey !== key)
        : [...selected, key];
      return;
    }
    value.value = value.value === key ? null : key;
  }

  return { isPressed, toggle };
}
