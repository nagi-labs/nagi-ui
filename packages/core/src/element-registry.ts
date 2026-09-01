import type { ComponentPublicInstance } from "vue";

export type TemplateElement = Element | ComponentPublicInstance | null;

function resolveElement(value: TemplateElement): HTMLElement | null {
  if (!value) return null;
  if ("$el" in value) return value.$el as HTMLElement | null;
  return value as HTMLElement;
}

/**
 * Keeps Behavior-owned DOM references local to the binding that registered
 * them. Cached callbacks remain stable across renders and only remove the
 * element they registered, so a stale Vue ref cleanup cannot erase a newer
 * registration for the same key.
 */
export function createElementRegistry<Key>() {
  const elements = new Map<Key, HTMLElement>();
  const callbacks = new Map<Key, (value: TemplateElement) => void>();

  function refFor(key: Key): (value: TemplateElement) => void {
    const existing = callbacks.get(key);
    if (existing) return existing;

    let registered: HTMLElement | null = null;
    const callback = (value: TemplateElement) => {
      const next = resolveElement(value);
      if (next) {
        registered = next;
        elements.set(key, next);
        return;
      }
      if (elements.get(key) === registered) elements.delete(key);
      registered = null;
    };
    callbacks.set(key, callback);
    return callback;
  }

  function get(key: Key): HTMLElement | null {
    const element = elements.get(key) ?? null;
    if (element && element.isConnected !== false) return element;
    if (element) elements.delete(key);
    return null;
  }

  function prune(keys: readonly Key[]) {
    const live = new Set(keys);
    for (const key of elements.keys()) {
      if (!live.has(key)) elements.delete(key);
    }
    for (const key of callbacks.keys()) {
      if (!live.has(key)) callbacks.delete(key);
    }
  }

  function clear() {
    elements.clear();
    callbacks.clear();
  }

  return { refFor, get, prune, clear };
}
