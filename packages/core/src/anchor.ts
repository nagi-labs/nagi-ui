import type { CSSProperties } from "vue"

export type AnchorArea =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "block-start"
  | "block-end"
  | "inline-start"
  | "inline-end"

export interface AnchorOptions {
  /** Where the popover sits relative to its trigger. Default: "block-end". */
  area?: AnchorArea
  /** Gap between trigger and popover in px. Default: 4. */
  offset?: number
  /** Test hook: force the CSS Anchor Positioning support decision. */
  supportsAnchor?: boolean
  /** Reading direction used to resolve logical inline placement on both paths. */
  direction?: "ltr" | "rtl"
}

export interface AnchorPair {
  /** Inline style for the trigger (anchor-name on the native path). */
  anchorStyle: CSSProperties
  /** Inline style for the popover (position-anchor / position-area on the native path). */
  positionedStyle: CSSProperties
  /** True when the native path is used and Floating UI stays unloaded. */
  native: boolean
  /**
   * Fallback driver. On the native path this is a no-op. On the fallback
   * path, call with the trigger and popover on open; it positions the
   * popover with Floating UI and returns a cleanup to call on close.
   */
  attach: (trigger: HTMLElement, popover: HTMLElement) => () => void
}

function detectAnchorSupport(): boolean {
  return (
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("anchor-name: --nagi-probe") &&
    CSS.supports("position-area: block-end")
  )
}

const FLOATING_PLACEMENTS: Record<AnchorArea, string> = {
  top: "top",
  bottom: "bottom",
  left: "left",
  right: "right",
  "block-start": "top",
  "block-end": "bottom",
  "inline-start": "left",
  "inline-end": "right",
}

function floatingPlacement(area: AnchorArea, direction: "ltr" | "rtl"): string {
  if (area === "inline-start") return direction === "rtl" ? "right" : "left"
  if (area === "inline-end") return direction === "rtl" ? "left" : "right"
  return FLOATING_PLACEMENTS[area]
}

function nativePositionArea(area: AnchorArea, direction: "ltr" | "rtl"): AnchorArea {
  if (area === "inline-start") return direction === "rtl" ? "right" : "left"
  if (area === "inline-end") return direction === "rtl" ? "left" : "right"
  return area
}

/**
 * Two-stage positioning per CHARTER §5: native CSS Anchor Positioning where
 * supported, Floating UI otherwise. Floating UI is loaded lazily so the
 * native path never pays for it, and the module can be deleted once anchor
 * positioning is universal.
 */
export function createAnchorPair(id: string, options: AnchorOptions = {}): AnchorPair {
  const area = options.area ?? "block-end"
  const offset = options.offset ?? 4
  const direction = options.direction ?? "ltr"
  // SSR is optimistically native: unsupported browsers ignore the unknown
  // properties harmlessly, supporting ones get anchored placement with zero
  // JS, and the client run re-detects during hydration.
  const native =
    options.supportsAnchor ?? (typeof CSS === "undefined" ? true : detectAnchorSupport())
  const anchorName = `--nagi-anchor-${id}`

  if (native) {
    const margins: Partial<Record<AnchorArea, string>> = {
      top: "margin-bottom",
      "block-start": "margin-block-end",
      bottom: "margin-top",
      "block-end": "margin-block-start",
      left: "margin-right",
      "inline-start": "margin-inline-end",
      right: "margin-left",
      "inline-end": "margin-inline-start",
    }
    return {
      native,
      anchorStyle: { "anchor-name": anchorName } as CSSProperties,
      positionedStyle: {
        "position-anchor": anchorName,
        // Chromium currently resolves logical position-area against the
        // top-layer containing block rather than this popup's inherited dir.
        // Resolve inline areas explicitly so native and Floating UI agree.
        "position-area": nativePositionArea(area, direction),
        "position-try-fallbacks": "flip-block, flip-inline",
        [margins[area] as string]: `${offset}px`,
      } as CSSProperties,
      attach: () => () => {},
    }
  }

  return {
    native,
    anchorStyle: {},
    positionedStyle: { margin: 0 },
    attach: (trigger, popover) => {
      let stop: (() => void) | null = null
      let cancelled = false
      void import("@floating-ui/dom").then(({ autoUpdate, computePosition, flip, offset: offsetFn, shift }) => {
        if (cancelled) return
        stop = autoUpdate(trigger, popover, () => {
          void computePosition(trigger, popover, {
            strategy: "fixed",
            placement: floatingPlacement(area, direction) as never,
            middleware: [offsetFn(offset), flip(), shift({ padding: 8 })],
          }).then(({ x, y }) => {
            popover.style.position = "fixed"
            popover.style.left = `${x}px`
            popover.style.top = `${y}px`
          })
        })
      })
      return () => {
        cancelled = true
        stop?.()
        stop = null
      }
    },
  }
}
