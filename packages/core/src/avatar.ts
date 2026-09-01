import {
  computed,
  nextTick,
  onMounted,
  ref,
  toValue,
  watch,
  type ComponentPublicInstance,
  type MaybeRefOrGetter,
} from "vue";

export interface UseAvatarOptions {
  src?: MaybeRefOrGetter<string | undefined>;
  alt: MaybeRefOrGetter<string>;
  fallback?: MaybeRefOrGetter<string | undefined>;
}

function initials(value: string): string {
  const words = value.trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return "?";

  const first = Array.from(words[0] ?? "")[0] ?? "";
  const last = Array.from(words.at(-1) ?? "")[0] ?? "";
  return (words.length === 1 ? first : `${first}${last}`).toUpperCase();
}

/** Owns image failure races while the renderer retains the editable Avatar markup. */
export function useAvatar(options: UseAvatarOptions) {
  const image = ref<HTMLImageElement | null>(null);
  const failed = ref(false);
  const fallbackText = computed(
    () => toValue(options.fallback) ?? initials(toValue(options.alt)),
  );
  const hasImage = computed(() => Boolean(toValue(options.src)) && !failed.value);

  function detectMissedError() {
    const target = image.value;
    if (target?.complete && target.naturalWidth === 0) failed.value = true;
  }

  function onImageError(event: Event) {
    const target = event.currentTarget;
    const source = toValue(options.src);
    if (!(target instanceof HTMLImageElement)) return;
    if (target.getAttribute("src") !== source) return;
    failed.value = true;
  }

  function setImage(element: Element | ComponentPublicInstance | null) {
    image.value = element instanceof HTMLImageElement ? element : null;
  }

  function reconcileImageSource() {
    failed.value = false;
    void nextTick(detectMissedError);
  }

  watch(() => toValue(options.src), reconcileImageSource, { flush: "sync" });

  onMounted(detectMissedError);

  return { fallbackText, hasImage, setImage, onImageError };
}
