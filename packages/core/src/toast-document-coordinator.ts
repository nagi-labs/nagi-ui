import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
  type ComponentPublicInstance,
  type Ref,
} from "vue"

import type { ToastItem, ToastManager, ToastRegionProps } from "./toast.ts"

interface ToastDocumentCoordinatorOptions {
  id: string
  label: string
  manager: ToastManager
  ownsManager: boolean
}

interface ToastDocumentCoordinator {
  regionElement: Readonly<Ref<HTMLElement | null>>
  regionProps: ToastRegionProps
  restoreFocus: () => void
}

const toastFocusOrigins = new WeakMap<Document, HTMLElement>()

function openToastRegions(document: Document): HTMLElement[] {
  const modal = document.querySelector<HTMLDialogElement>("dialog:modal")
  return [...document.querySelectorAll<HTMLElement>(
    '[popover="manual"][role="region"][aria-keyshortcuts~="F6"]:popover-open',
  )].filter((region) => !modal || modal.contains(region))
}

/**
 * Owns only Toast's document-level behavior: popover promotion, F6 routing,
 * pause/resume, and focus restoration. It is deliberately not a generic
 * document coordinator shared by unrelated popup components.
 */
export function useToastDocumentCoordinator(
  options: ToastDocumentCoordinatorOptions,
): ToastDocumentCoordinator {
  const { id, label, manager, ownsManager } = options
  let pointerInside = false
  let focusInside = false
  let documentHidden = false
  let focusBeforeShortcut: HTMLElement | null = null
  const regionElement = shallowRef<HTMLElement | null>(null)
  let coordinatorDocument: Document | null = null

  function resolveRegion(): HTMLElement | null {
    return regionElement.value?.isConnected ? regionElement.value : null
  }

  function setRegion(element: Element | ComponentPublicInstance | null) {
    regionElement.value = element as HTMLElement | null
    coordinatorDocument = regionElement.value?.ownerDocument ?? coordinatorDocument
  }

  function isDocumentHTMLElement(
    document: Document,
    value: EventTarget | Element | null,
  ): value is HTMLElement {
    const HTMLElementConstructor = document.defaultView?.HTMLElement
    return HTMLElementConstructor ? value instanceof HTMLElementConstructor : false
  }

  function syncPauseState() {
    if (pointerInside || focusInside || documentHidden) manager.pause()
    else manager.resume()
  }

  function syncRegion() {
    const region = resolveRegion()
    if (!region) return
    if (manager.toasts.value.length > 0) {
      if (!region.matches(":popover-open")) region.showPopover()
    } else if (region.matches(":popover-open")) {
      region.hidePopover()
    }
  }

  function restoreFocus() {
    const document = coordinatorDocument ?? resolveRegion()?.ownerDocument ?? null
    const sharedTarget = document ? toastFocusOrigins.get(document) : undefined
    if (document) toastFocusOrigins.delete(document)
    const target = sharedTarget ?? focusBeforeShortcut
    focusBeforeShortcut = null
    if (target?.isConnected) target.focus({ preventScroll: true })
  }

  function onDocumentKeydown(event: KeyboardEvent) {
    if (
      event.key !== "F6"
      || event.defaultPrevented
      || event.shiftKey
      || event.ctrlKey
      || event.altKey
      || event.metaKey
    ) {
      return
    }
    const document = coordinatorDocument ?? resolveRegion()?.ownerDocument
    if (!document) return
    const regions = openToastRegions(document)
    if (regions.length === 0) return
    const active = document.activeElement
    const activeIndex = regions.findIndex((region) => region.contains(active))
    event.preventDefault()
    if (activeIndex >= 0) {
      const nextRegion = regions[activeIndex + 1]
      if (nextRegion) {
        nextRegion.focus({ preventScroll: true })
        return
      }
      restoreFocus()
      return
    }
    if (isDocumentHTMLElement(document, active) && active !== document.body) {
      focusBeforeShortcut = active
      toastFocusOrigins.set(document, active)
    }
    regions[0]?.focus({ preventScroll: true })
  }

  // Re-promotion per CHARTER §7: top-layer peers opened later cover or close
  // the manual popover. Other Toast regions are ignored so multiple explicit
  // managers cannot promote each other forever.
  function onDocumentToggle(event: Event) {
    const document = coordinatorDocument ?? resolveRegion()?.ownerDocument
    if (!document || !isDocumentHTMLElement(document, event.target)) return
    const target = event.target
    const region = resolveRegion()
    if (!region || target === region) return
    if ((event as ToggleEvent).newState !== "open") return
    if (target.getAttribute("aria-keyshortcuts")?.split(/\s+/).includes("F6")) return
    const isTopLayerPeer = target.tagName === "DIALOG" || target.hasAttribute("popover")
    if (!isTopLayerPeer || manager.toasts.value.length === 0) return
    if (region.matches(":popover-open")) region.hidePopover()
    region.showPopover()
  }

  async function reconcileRegion(next: readonly ToastItem[], previous: readonly ToastItem[]) {
    const document = coordinatorDocument ?? resolveRegion()?.ownerDocument
    if (previous.length === 0 && next.length > 0 && document) {
      const active = document.activeElement
      const region = resolveRegion()
      if (
        isDocumentHTMLElement(document, active)
        && active !== document.body
        && !region?.contains(active)
      ) {
        focusBeforeShortcut = active
      }
    }
    await nextTick()
    syncRegion()
  }

  const stopWatching = watch(manager.toasts, reconcileRegion)

  function onVisibilityChange() {
    documentHidden = coordinatorDocument?.hidden ?? false
    syncPauseState()
  }

  function mount() {
    const document = resolveRegion()?.ownerDocument
    if (!document) return
    coordinatorDocument = document
    documentHidden = document.hidden
    document.addEventListener("toggle", onDocumentToggle, true)
    document.addEventListener("keydown", onDocumentKeydown)
    document.addEventListener("visibilitychange", onVisibilityChange)
    syncPauseState()
    syncRegion()
  }

  function unmount() {
    const document = coordinatorDocument
    document?.removeEventListener("toggle", onDocumentToggle, true)
    document?.removeEventListener("keydown", onDocumentKeydown)
    document?.removeEventListener("visibilitychange", onVisibilityChange)
    stopWatching()
    manager.resume()
    if (ownsManager) manager.dispose()
    coordinatorDocument = null
  }

  onMounted(mount)
  onBeforeUnmount(unmount)

  return {
    regionElement,
    restoreFocus,
    regionProps: {
      ref: setRegion,
      id,
      popover: "manual",
      role: "region",
      "aria-label": label,
      "aria-keyshortcuts": "F6",
      tabindex: -1,
      onFocusin() {
        focusInside = true
        syncPauseState()
      },
      onFocusout(event) {
        const region = resolveRegion()
        const NodeConstructor = region?.ownerDocument.defaultView?.Node
        if (
          NodeConstructor
          && event.relatedTarget instanceof NodeConstructor
          && region.contains(event.relatedTarget)
        ) {
          return
        }
        focusInside = false
        syncPauseState()
      },
      onPointerenter() {
        pointerInside = true
        syncPauseState()
      },
      onPointerleave() {
        pointerInside = false
        syncPauseState()
      },
    },
  }
}
