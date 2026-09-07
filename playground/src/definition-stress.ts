import "@nagi-labs/nagi-ui/default-theme.css";

import { createApp } from "vue";
import DefinitionStressLab from "./definition-stress-lab.vue";
import ShadowDefinitionLab from "./shadow-definition-lab.vue";

createApp(DefinitionStressLab).mount("#app");

for (const [hostId, prefix] of [
  ["shadow-alpha", "Alpha"],
  ["shadow-beta", "Beta"],
] as const) {
  const host = document.getElementById(hostId);
  if (!host) throw new Error(`Missing ShadowRoot host #${hostId}.`);
  const root = host.attachShadow({ mode: "open" });
  const mount = document.createElement("div");
  root.append(mount);
  createApp(ShadowDefinitionLab, { prefix }).mount(mount);
}
