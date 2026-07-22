import { ref, useId, type Ref } from "vue"

interface AccordionComponentProps {
  readonly multiple: boolean
  readonly defaultOpenKeys: readonly string[]
}

interface AccordionDetailsProps {
  readonly name: string | undefined
  readonly open: boolean
  readonly onToggle: (event: ToggleEvent) => void
}

interface AccordionSummaryProps {
  readonly "aria-disabled": "true" | undefined
  readonly onClick: (event: MouseEvent) => void
  readonly onKeydown: (event: KeyboardEvent) => void
}

function unique(keys: readonly string[]): readonly string[] {
  return [...new Set(keys)]
}

/** Fixed native grouping, model synchronization, and disabled-summary behavior. */
export function useAccordion(
  props: AccordionComponentProps,
  openKeysModel: Ref<readonly string[] | undefined>,
) {
  const groupName = `nagi-accordion-${useId()}`
  const localOpenKeys = ref<readonly string[]>(normalize(props.defaultOpenKeys))

  function normalize(keys: readonly string[]): readonly string[] {
    const normalized = unique(keys)
    return props.multiple ? normalized : normalized.slice(0, 1)
  }

  function openKeys(): readonly string[] {
    return normalize(openKeysModel.value ?? localOpenKeys.value)
  }

  function updateOpenKeys(keys: readonly string[]) {
    const normalized = normalize(keys)
    localOpenKeys.value = normalized
    openKeysModel.value = normalized
  }

  function detailsProps(key: string): AccordionDetailsProps {
    const current = openKeys()
    return {
      name: props.multiple ? undefined : groupName,
      open: current.includes(key),
      onToggle: (event: ToggleEvent) => {
        const actual = (event.currentTarget as HTMLDetailsElement).open
        const latest = openKeys()

        if (actual) {
          updateOpenKeys(props.multiple ? [...latest, key] : [key])
        } else if (latest.includes(key)) {
          updateOpenKeys(latest.filter((candidate) => candidate !== key))
        }
      },
    }
  }

  function summaryProps(disabled = false): AccordionSummaryProps {
    function guard(event: MouseEvent | KeyboardEvent) {
      if (!disabled) return
      if (event.type === "keydown" && !["Enter", " "].includes((event as KeyboardEvent).key)) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
    }

    return {
      "aria-disabled": disabled ? "true" : undefined,
      onClick: guard,
      onKeydown: guard,
    }
  }

  return { detailsProps, summaryProps }
}
