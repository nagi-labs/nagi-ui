import { createApp } from "vue"

import PopoverLab from "./PopoverLab.vue"

createApp(PopoverLab).mount("#app")

if (new URLSearchParams(location.search).get("autotest") === "stacking") {
  const { runStackingAutotest } = await import("./autotest.ts")
  setTimeout(runStackingAutotest, 200)
}
