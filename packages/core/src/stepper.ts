import type { Ref } from "vue";

export interface StepperBehaviorItem {
  key: string;
  disabled?: boolean;
}

export interface UseStepperReturn<Item extends StepperBehaviorItem> {
  isCurrent: (item: Item) => boolean;
  select: (item: Item) => void;
}

/** Owns controlled step selection while native buttons retain focus and disabled behavior. */
export function useStepper<Item extends StepperBehaviorItem>(
  currentKey: Ref<string>,
): UseStepperReturn<Item> {
  return {
    isCurrent: (item) => item.key === currentKey.value,
    select(item) {
      if (!item.disabled) currentKey.value = item.key;
    },
  };
}
