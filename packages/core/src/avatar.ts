import {
  computed,
  nextTick,
  onMounted,
  ref,
  toValue,
  watch,
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

  watch(
    () => toValue(options.src),
    () => {
      failed.value = false;
      void nextTick(detectMissedError);
    },
    { flush: "sync" },
  );

  onMounted(detectMissedError);

  return { fallbackText, hasImage, image, onImageError };
}
