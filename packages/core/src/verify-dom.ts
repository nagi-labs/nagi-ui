export type NagiDomIssueCode =
  | "duplicate-id"
  | "missing-id-target"
  | "invalid-popover-target"
  | "relationship-mismatch"
  | "invalid-active-descendant"

export interface NagiDomIssue {
  code: NagiDomIssueCode
  message: string
  element: Element
  attribute?: string
  targetId?: string
}

export interface ObserveNagiDomOptions {
  /** Called after each mutation batch when the issue set changes. */
  onIssues?: (issues: readonly NagiDomIssue[]) => void
  /** Run once before observing. Defaults to true. */
  initial?: boolean
}

const tokenListReferences = [
  "aria-controls",
  "aria-describedby",
  "aria-flowto",
  "aria-labelledby",
  "aria-owns",
] as const

function elementsIn(root: ParentNode): Element[] {
  const descendants = Array.from(root.querySelectorAll("*"))
  return typeof Element !== "undefined" && root instanceof Element
    ? [root, ...descendants]
    : descendants
}

function tokens(value: string | null): string[] {
  return value?.trim().split(/\s+/).filter(Boolean) ?? []
}

function issueSignature(issue: NagiDomIssue): string {
  const element = issue.element
  return [
    issue.code,
    issue.attribute ?? "",
    issue.targetId ?? "",
    element.id,
    element.tagName,
  ].join(":")
}

/**
 * Verify the rendered relationship graph emitted by Nagi behavior props.
 * This complements SFC lint after component boundaries and dynamic rendering
 * have produced the actual DOM.
 */
export function verifyNagiDom(root?: ParentNode): NagiDomIssue[] {
  const scope = root ?? (typeof document === "undefined" ? null : document)
  if (!scope) return []

  const elements = elementsIn(scope)
  const byId = new Map<string, Element[]>()
  const issues: NagiDomIssue[] = []

  for (const element of elements) {
    if (!element.id) continue
    const matches = byId.get(element.id) ?? []
    matches.push(element)
    byId.set(element.id, matches)
  }

  for (const [id, matches] of byId) {
    if (matches.length < 2) continue
    issues.push({
      code: "duplicate-id",
      message: `Duplicate id "${id}" makes Nagi relationships ambiguous.`,
      element: matches[1] as Element,
      attribute: "id",
      targetId: id,
    })
  }

  function targetFor(owner: Element, attribute: string, id: string): Element | null {
    const matches = byId.get(id)
    if (matches?.[0]) return matches[0]
    issues.push({
      code: "missing-id-target",
      message: `${attribute} references missing id "${id}".`,
      element: owner,
      attribute,
      targetId: id,
    })
    return null
  }

  for (const element of elements) {
    for (const attribute of tokenListReferences) {
      for (const id of tokens(element.getAttribute(attribute))) {
        targetFor(element, attribute, id)
      }
    }

    const activeId = element.getAttribute("aria-activedescendant")
    if (activeId) {
      const active = targetFor(element, "aria-activedescendant", activeId)
      if (active) {
        const relationshipRoots = [
          element,
          ...tokens(element.getAttribute("aria-controls"))
            .map((id) => byId.get(id)?.[0])
            .filter((target): target is Element => Boolean(target)),
          ...tokens(element.getAttribute("aria-owns"))
            .map((id) => byId.get(id)?.[0])
            .filter((target): target is Element => Boolean(target)),
        ]
        if (!relationshipRoots.some((owner) => owner === active || owner.contains(active))) {
          issues.push({
            code: "invalid-active-descendant",
            message: `aria-activedescendant target "${activeId}" is outside the owning or controlled DOM.`,
            element,
            attribute: "aria-activedescendant",
            targetId: activeId,
          })
        }
      }
    }

    const popoverTargetId = element.getAttribute("popovertarget")
    if (popoverTargetId) {
      const target = targetFor(element, "popovertarget", popoverTargetId)
      if (target && !target.hasAttribute("popover")) {
        issues.push({
          code: "invalid-popover-target",
          message: `popovertarget "${popoverTargetId}" does not reference an element with the popover attribute.`,
          element,
          attribute: "popovertarget",
          targetId: popoverTargetId,
        })
      }

      const controls = tokens(element.getAttribute("aria-controls"))
      if (controls.length > 0 && !controls.includes(popoverTargetId)) {
        issues.push({
          code: "relationship-mismatch",
          message: `popovertarget "${popoverTargetId}" is not included in aria-controls.`,
          element,
          attribute: "aria-controls",
          targetId: popoverTargetId,
        })
      }
    }

    const commandTargetId = element.getAttribute("commandfor")
    if (commandTargetId) targetFor(element, "commandfor", commandTargetId)
  }

  return issues
}

/** Throw an AggregateError suitable for tests and explicit dev assertions. */
export function assertNagiDom(root?: ParentNode): void {
  const issues = verifyNagiDom(root)
  if (issues.length === 0) return
  throw new AggregateError(
    issues.map((issue) => new Error(issue.message)),
    `Nagi DOM verification failed with ${issues.length} issue${issues.length === 1 ? "" : "s"}.`,
  )
}

/**
 * Observe a dev root and report relationship issues after DOM mutations.
 * Call this behind the host application's dev flag; Nagi never enables a
 * production observer implicitly.
 */
export function observeNagiDom(
  root: ParentNode & Node,
  options: ObserveNagiDomOptions = {},
): () => void {
  if (typeof MutationObserver === "undefined") return () => undefined

  const report =
    options.onIssues ??
    ((issues: readonly NagiDomIssue[]) => {
      for (const issue of issues) {
        console.warn(`[Nagi UI] ${issue.message}`, issue.element)
      }
    })
  let previous = ""
  let queued = false

  function run() {
    queued = false
    const issues = verifyNagiDom(root)
    const signature = issues.map(issueSignature).sort().join("|")
    if (signature === previous) return
    previous = signature
    report(issues)
  }

  function schedule() {
    if (queued) return
    queued = true
    queueMicrotask(run)
  }

  if (options.initial ?? true) run()
  const observer = new MutationObserver(schedule)
  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "id",
      "aria-controls",
      "aria-describedby",
      "aria-flowto",
      "aria-labelledby",
      "aria-owns",
      "aria-activedescendant",
      "popovertarget",
      "popover",
      "commandfor",
    ],
  })

  return () => observer.disconnect()
}
