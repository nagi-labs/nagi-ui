import { nextTick, type Ref, type WritableComputedRef } from "vue";

export type ModelValueEquals<Value> = (actual: Value, requested: Value) => boolean;
export type WritableModelValue<Value> = { value: Value };
/** Rejects getter-only computed refs while accepting ordinary refs and writable computed models. */
export type WritableRef<Value> =
  | (Ref<Value> & { readonly effect?: never })
  | WritableComputedRef<Value>;

/**
 * Requests one controlled-model value and resolves only after Vue has had an
 * opportunity to echo an accepted `defineModel` update back through the prop.
 * The returned boolean says whether the requested value became authoritative;
 * it does not create an optimistic local source of truth.
 */
export async function requestModelValue<Value>(
  model: WritableModelValue<Value>,
  requested: Value,
  equals: ModelValueEquals<Value> = Object.is,
): Promise<boolean> {
  model.value = requested;
  await nextTick();
  return equals(model.value, requested);
}

/** Checks a write already performed by a native/composite mechanism. */
export async function modelValueAccepted<Value>(
  model: WritableModelValue<Value>,
  requested: Value,
  equals: ModelValueEquals<Value> = Object.is,
): Promise<boolean> {
  await nextTick();
  return equals(model.value, requested);
}
