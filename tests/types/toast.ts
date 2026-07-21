import {
  createToastManager,
  type ToastAction,
  type ToastId,
  type ToastItem,
  type ToastPriority,
  type ToastTone,
} from "@nagi-labs/nagi-ui"

const manager = createToastManager({ duration: 5000, limit: 3 })
const action: ToastAction = {
  label: "Undo",
  onClick(id) {
    const toastId: ToastId = id
    manager.close(toastId)
  },
}

const id = manager.add({
  title: "Saved",
  description: "Your changes are live",
  tone: "success",
  priority: "polite",
  action,
})
manager.update(id, { description: "Updated", action: null })
manager.close(id)
manager.close()

const operation = manager.promise(Promise.resolve({ count: 2 }), {
  loading: "Saving",
  success(result) {
    const count: number = result.count
    return { description: `${count} records saved`, tone: "success" }
  },
  error(error) {
    return { description: String(error), tone: "danger", priority: "assertive" }
  },
})
const result: Promise<{ count: number }> = operation
const items: readonly ToastItem[] = manager.toasts.value
const firstItem = items[0]
if (firstItem) {
  // @ts-expect-error manager items are immutable snapshots; use update()
  firstItem.title = "Bypass manager"
}
const tone: ToastTone = "accent"
const priority: ToastPriority = "assertive"

// @ts-expect-error title or description is required
manager.add({ tone: "success" })
manager.add({
  description: "Invalid tone",
  // @ts-expect-error tone is a closed vocabulary
  tone: "positive",
})
manager.add({
  description: "Invalid priority",
  // @ts-expect-error priority uses platform announcement vocabulary
  priority: "high",
})

void result
void items
void tone
void priority
