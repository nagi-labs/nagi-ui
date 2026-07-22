/**
 * Playground-only self test, driven by `?autotest=stacking`.
 * Runs the Demo B scenario (CHARTER §10 Phase 0-4) in the real UA and
 * paints a PASS/FAIL banner, so a one-shot headless screenshot can verify
 * the top-layer re-promotion without an automation daemon.
 */
export async function runStackingAutotest() {
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
  const region = () => document.querySelector<HTMLElement>(".unit.-toasts")!
  const dialog = document.querySelector<HTMLDialogElement>(".section.-stacking > .dialog")!
  const fireButton = document.querySelector<HTMLButtonElement>(".section.-stacking > .button")!

  // Scenario 1: toast first, then a modal dialog opens over it.
  fireButton.click()
  await wait(50)
  const toastOpenBeforeDialog = region().matches(":popover-open")
  dialog.showModal()
  await wait(150)
  const repromotedOverDialog = region().matches(":popover-open")
  dialog.close()
  await wait(50)

  // Scenario 2: dialog first, toast fired from inside it.
  dialog.showModal()
  fireButton.click()
  await wait(150)
  const openedAboveDialog = region().matches(":popover-open")

  const pass = toastOpenBeforeDialog && repromotedOverDialog && openedAboveDialog
  const banner = document.createElement("output")
  banner.id = "autotest-result"
  banner.dataset.pass = String(pass)
  banner.textContent = `stacking autotest: ${pass ? "PASS" : "FAIL"} `
    + `(before=${toastOpenBeforeDialog}, repromoted=${repromotedOverDialog}, above=${openedAboveDialog})`
  banner.style.cssText =
    "position:fixed;inset-block-start:0;inset-inline:0;padding:6px 10px;" +
    `background:${pass ? "#0e8f7f" : "#b04a52"};color:#fff;` +
    "font:13px ui-monospace,monospace;z-index:1"
  document.body.append(banner)
}
