import { ref, useId, type Ref } from "vue";

interface AccordionComponentProps {
  readonly multiple: boolean;
  readonly defaultOpenKeys: readonly string[];
}

function unique(keys: readonly string[]): readonly string[] {
  return [...new Set(keys)];
}

/** Coordinates the open keys of independently rendered Disclosure components. */
export function useAccordion(
  props: AccordionComponentProps,
  openKeysModel: Ref<readonly string[] | undefined>,
) {
  const groupName = `nagi-accordion-${useId()}`;
  const localOpenKeys = ref<readonly string[]>(normalize(props.defaultOpenKeys));

  function normalize(keys: readonly string[]): readonly string[] {
    const normalized = unique(keys);
    return props.multiple ? normalized : normalized.slice(0, 1);
  }

  function openKeys(): readonly string[] {
    return normalize(openKeysModel.value ?? localOpenKeys.value);
  }

  function updateOpenKeys(keys: readonly string[]) {
    const normalized = normalize(keys);
    localOpenKeys.value = normalized;
    openKeysModel.value = normalized;
  }

  function isOpen(key: string): boolean {
    return openKeys().includes(key);
  }

  function setOpen(key: string, open: boolean) {
    const latest = openKeys();
    if (open) {
      updateOpenKeys(props.multiple ? [...latest, key] : [key]);
    } else if (latest.includes(key)) {
      updateOpenKeys(latest.filter((candidate) => candidate !== key));
    }
  }

  return {
    groupName,
    isOpen,
    setOpen,
  };
}
