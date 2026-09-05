import { defineCommand } from "citty";

import { components } from "../ownership.mjs";

export function createListCommand({ log, onExit }) {
  return defineCommand({
    meta: { name: "list", description: "List ownable components" },
    run() {
      for (const [name, spec] of Object.entries(components)) {
        const dependencies = spec.componentDependencies?.length
          ? `; owns with: ${spec.componentDependencies.join(", ")}`
          : "";
        log(
          `${name}  (${spec.files.length} file${spec.files.length === 1 ? "" : "s"}${dependencies})`,
        );
      }
      onExit(0);
      return 0;
    },
  });
}
