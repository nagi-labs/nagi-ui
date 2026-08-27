import { normalizeClass, normalizeStyle, type StyleValue } from "vue"

type EventHandler = (...args: never[]) => unknown

type UnionToIntersection<Union> = (
  Union extends unknown ? (value: Union) => void : never
) extends (value: infer Intersection) => void
  ? Intersection
  : never

export type MergedNagiProps<Sources extends readonly object[]> = UnionToIntersection<
  Sources[number]
>

const tokenListAriaAttributes = new Set([
  "aria-controls",
  "aria-describedby",
  "aria-flowto",
  "aria-labelledby",
  "aria-owns",
])

/** A non-composable attribute was supplied with two different meanings. */
export class NagiPropConflictError extends Error {
  readonly key: string

  constructor(key: string) {
    super(
      `Conflicting Nagi prop "${key}". Move the intended value to one source instead of overriding behavior wiring.`,
    )
    this.name = "NagiPropConflictError"
    this.key = key
  }
}

function isEventKey(key: string): boolean {
  // Same shape Vue uses for vnode event props: onClick, onUpdate:modelValue,
  // etc. Lowercase native attributes such as `once` are not events.
  return /^on[^a-z]/.test(key)
}

function collectHandlers(value: unknown, key: string): EventHandler[] {
  if (value == null) return []
  if (typeof value === "function") return [value as EventHandler]
  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectHandlers(entry, key))
  }
  throw new TypeError(`Nagi event prop "${key}" must contain only functions.`)
}

function mergeTokenList(key: string, values: readonly unknown[]): string | undefined {
  const tokens: string[] = []
  const seen = new Set<string>()

  for (const value of values) {
    if (value == null || value === "") continue
    if (typeof value !== "string") {
      throw new TypeError(`Nagi token-list prop "${key}" must be a string.`)
    }
    for (const token of value.trim().split(/\s+/)) {
      if (token && !seen.has(token)) {
        seen.add(token)
        tokens.push(token)
      }
    }
  }

  return tokens.length > 0 ? tokens.join(" ") : undefined
}

function mergeValue(key: string, values: readonly unknown[]): unknown {
  const defined = values.filter((value) => value !== undefined)
  if (defined.length === 0) return undefined

  if (key === "class") {
    const classes = normalizeClass(defined)
    return [...new Set(classes.split(/\s+/).filter(Boolean))].join(" ")
  }

  if (key === "style") {
    return normalizeStyle(defined as StyleValue)
  }

  if (tokenListAriaAttributes.has(key)) {
    return mergeTokenList(key, defined)
  }

  if (isEventKey(key)) {
    const handlers = defined.flatMap((value) => collectHandlers(value, key))
    if (handlers.length === 0) return undefined
    if (handlers.length === 1) return handlers[0]
    return (...args: never[]) => {
      for (const handler of handlers) handler(...args)
    }
  }

  const first = defined[0]
  if (defined.every((value) => Object.is(value, first))) return first
  throw new NagiPropConflictError(key)
}

/**
 * Merge Nagi behavior props with local element props without silently
 * replacing wiring.
 *
 * Composable values are class, style, Vue event handlers, and ARIA IDREF
 * token lists. Every other duplicate must be equal; different values throw a
 * NagiPropConflictError. Source order is event execution and token order.
 * Getters remain live so aria-expanded / aria-activedescendant do not freeze
 * when the merged object is created in setup().
 */
export function mergeNagiProps<const Sources extends readonly object[]>(
  ...sources: Sources
): MergedNagiProps<Sources> {
  const sourceRecords = sources as readonly Record<string, unknown>[]
  const keys = new Set(sourceRecords.flatMap((source) => Object.keys(source)))
  const merged: Record<string, unknown> = {}

  for (const key of keys) {
    const read = () => mergeValue(key, sourceRecords.map((source) => source[key]))

    // Fail immediately for static conflicts, then keep reading through the
    // original objects so reactive getters remain reactive at render time.
    read()
    Object.defineProperty(merged, key, {
      enumerable: true,
      configurable: false,
      get: read,
    })
  }

  return merged as MergedNagiProps<Sources>
}
