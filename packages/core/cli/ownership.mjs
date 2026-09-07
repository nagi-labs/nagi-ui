import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

export const components = {
  accordion: {
    dir: "blueprints/accordion",
    files: ["accordion.vue"],
    componentDependencies: ["disclosure"],
  },
  autocomplete: { dir: "blueprints/autocomplete", files: ["autocomplete.vue"] },
  alert: { dir: "blueprints/alert", files: ["alert.vue"] },
  "alert-dialog": {
    dir: "blueprints/alert-dialog",
    files: ["alert-dialog.vue", "alert-dialog.definition.ts"],
  },
  avatar: { dir: "blueprints/avatar", files: ["avatar.vue"] },
  badge: { dir: "blueprints/badge", files: ["badge.vue"] },
  breadcrumb: { dir: "blueprints/breadcrumb", files: ["breadcrumb.vue"] },
  button: { dir: "blueprints/button", files: ["button.vue", "button.definition.ts"] },
  "button-group": { dir: "blueprints/button-group", files: ["button-group.vue"] },
  card: { dir: "blueprints/card", files: ["card.vue"] },
  calendar: { dir: "blueprints/calendar", files: ["calendar.vue"] },
  carousel: {
    dir: "blueprints/carousel",
    files: ["carousel.vue", "carousel.definition.ts"],
  },
  checkbox: { dir: "blueprints/checkbox", files: ["checkbox.vue"] },
  combobox: { dir: "blueprints/combobox", files: ["combobox.vue", "combobox.definition.ts"] },
  "context-menu": { dir: "blueprints/context-menu", files: ["context-menu.vue", "EXTENDING.md"] },
  "date-field": { dir: "blueprints/date-field", files: ["date-field.vue"] },
  "date-picker": {
    dir: "blueprints/date-picker",
    files: [
      "date-picker.vue",
      "internal/date-picker-popup.vue",
      "internal/date-picker-context.ts",
      "date-picker.definition.ts",
    ],
  },
  "date-range-picker": {
    dir: "blueprints/date-range-picker",
    files: [
      "date-range-picker.vue",
      "internal/date-range-picker-popup.vue",
      "internal/date-range-picker-context.ts",
    ],
  },
  dialog: { dir: "blueprints/dialog", files: ["dialog.vue", "dialog.definition.ts"] },
  disclosure: { dir: "blueprints/disclosure", files: ["disclosure.vue"] },
  "dropdown-menu": {
    dir: "blueprints/menu",
    files: [
      "dropdown-menu.vue",
      "internal/dropdown-menu-group.vue",
      "internal/dropdown-menu-item.vue",
      "internal/dropdown-submenu.vue",
      "dropdown-options.ts",
      "dropdown-schema.ts",
      "dropdown-menu.definition.ts",
    ],
  },
  "empty-state": { dir: "blueprints/empty-state", files: ["empty-state.vue"] },
  fieldset: { dir: "blueprints/fieldset", files: ["fieldset.vue"] },
  "file-input": { dir: "blueprints/file-input", files: ["file-input.vue"] },
  input: { dir: "blueprints/input", files: ["input.vue"] },
  "input-group": { dir: "blueprints/input-group", files: ["input-group.vue"] },
  kbd: { dir: "blueprints/kbd", files: ["kbd.vue"] },
  listbox: { dir: "blueprints/listbox", files: ["listbox.vue", "listbox.definition.ts"] },
  meter: { dir: "blueprints/meter", files: ["meter.vue"] },
  menubar: { dir: "blueprints/menubar", files: ["menubar.vue", "EXTENDING.md"] },
  "multi-select": { dir: "blueprints/multi-select", files: ["multi-select.vue"] },
  "number-field": { dir: "blueprints/number-field", files: ["number-field.vue"] },
  "navigation-menu": { dir: "blueprints/navigation-menu", files: ["navigation-menu.vue"] },
  "otp-field": { dir: "blueprints/otp-field", files: ["otp-field.vue"] },
  pagination: { dir: "blueprints/pagination", files: ["pagination.vue"] },
  popover: { dir: "blueprints/popover", files: ["popover.vue", "popover.definition.ts"] },
  progress: { dir: "blueprints/progress", files: ["progress.vue"] },
  "preview-card": { dir: "blueprints/preview-card", files: ["preview-card.vue"] },
  radio: { dir: "blueprints/radio", files: ["radio.vue"] },
  "range-calendar": { dir: "blueprints/range-calendar", files: ["range-calendar.vue"] },
  "range-slider": { dir: "blueprints/range-slider", files: ["range-slider.vue"] },
  resizable: { dir: "blueprints/resizable", files: ["resizable.vue"] },
  rating: { dir: "blueprints/rating", files: ["rating.vue"] },
  select: { dir: "blueprints/select", files: ["select.vue"] },
  separator: { dir: "blueprints/separator", files: ["separator.vue"] },
  sidebar: { dir: "blueprints/sidebar", files: ["sidebar.vue"] },
  "sidebar-link": { dir: "blueprints/sidebar", files: ["sidebar-link.vue"] },
  "sidebar-section": { dir: "blueprints/sidebar", files: ["sidebar-section.vue"] },
  skeleton: { dir: "blueprints/skeleton", files: ["skeleton.vue"] },
  slider: { dir: "blueprints/slider", files: ["slider.vue"] },
  spinner: { dir: "blueprints/spinner", files: ["spinner.vue"] },
  stepper: { dir: "blueprints/stepper", files: ["stepper.vue"] },
  switch: { dir: "blueprints/switch", files: ["switch.vue"] },
  table: { dir: "blueprints/table", files: ["table.vue"] },
  tabs: { dir: "blueprints/tabs", files: ["tabs.vue"] },
  "tags-input": { dir: "blueprints/tags-input", files: ["tags-input.vue"] },
  textarea: { dir: "blueprints/textarea", files: ["textarea.vue"] },
  "time-field": { dir: "blueprints/time-field", files: ["time-field.vue"] },
  toolbar: { dir: "blueprints/toolbar", files: ["toolbar.vue"] },
  toast: { dir: "blueprints/toast", files: ["toast.vue", "toast.definition.ts"] },
  toggle: { dir: "blueprints/toggle", files: ["toggle.vue"] },
  "toggle-group": { dir: "blueprints/toggle-group", files: ["toggle-group.vue"] },
  tree: { dir: "blueprints/tree", files: ["tree.vue", "tree-branch.vue"] },
  tooltip: { dir: "blueprints/tooltip", files: ["tooltip.vue"] },
};

const MARKER_RE = /^(?:<!--|\/\/) @nagi-source ([a-z0-9-]+)\/([^@\s]+)@(\S+?)(?: -->)?$/;

export function markerLine(file, component, version) {
  const marker = `@nagi-source ${component}/${file}@${version}`;
  return file.endsWith(".vue") || file.endsWith(".md") ? `<!-- ${marker} -->\n` : `// ${marker}\n`;
}

export function parseMarker(line) {
  const match = MARKER_RE.exec(line.trim());
  if (!match) return null;
  return { component: match[1], file: match[2], version: match[3] };
}

export function resolvePackageRoot(from = process.cwd()) {
  const require = createRequire(path.join(from, "__nagi_resolve__.js"));
  return path.dirname(require.resolve("@nagi-labs/nagi-ui/package.json"));
}

export function packageVersion(packageRoot) {
  return JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8")).version;
}

function dependencyOrder(name, visiting = new Set(), visited = new Set(), order = []) {
  if (visiting.has(name)) {
    throw new Error(`Circular component dependency involving "${name}".`);
  }
  if (visited.has(name)) return order;

  const spec = components[name];
  if (!spec) {
    throw new Error(
      `Unknown component "${name}". Available: ${Object.keys(components).join(", ")}`,
    );
  }

  visiting.add(name);
  for (const dependency of spec.componentDependencies ?? []) {
    dependencyOrder(dependency, visiting, visited, order);
  }
  visiting.delete(name);
  visited.add(name);
  order.push(name);
  return order;
}

function isOwnedComponentDirectory(name, directory) {
  const spec = components[name];
  return spec.files.every((file) => {
    const ownedFile = path.join(directory, file);
    if (!fs.existsSync(ownedFile)) return false;
    const firstLine = fs.readFileSync(ownedFile, "utf8").split("\n", 1)[0];
    const marker = parseMarker(firstLine);
    return marker?.component === name && marker.file === file;
  });
}

export function ownComponent(name, { packageRoot, targetRoot, force = false }) {
  const order = dependencyOrder(name);
  const version = packageVersion(packageRoot);

  for (const component of order) {
    const destDir = path.join(targetRoot, component);
    if (!fs.existsSync(destDir) || fs.readdirSync(destDir).length === 0) continue;
    if (component === name && force) continue;
    if (component !== name && isOwnedComponentDirectory(component, destDir)) continue;
    if (component === name) {
      throw new Error(`${destDir} is not empty. Pass --force to overwrite.`);
    }
    throw new Error(
      `${destDir} blocks the ${name} dependency. Move it or own ${component} explicitly first.`,
    );
  }

  const ownedComponents = [];
  for (const component of order) {
    const spec = components[component];
    const destDir = path.join(targetRoot, component);
    const isDependency = component !== name;
    if (
      isDependency &&
      fs.existsSync(destDir) &&
      fs.readdirSync(destDir).length > 0 &&
      isOwnedComponentDirectory(component, destDir)
    ) {
      ownedComponents.push({ component, files: [], status: "reused" });
      continue;
    }

    fs.mkdirSync(destDir, { recursive: true });
    const files = [];
    for (const file of spec.files) {
      const source = fs.readFileSync(path.join(packageRoot, spec.dir, file), "utf8");
      const dest = path.join(destDir, file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, markerLine(file, component, version) + source);
      files.push(dest);
    }
    ownedComponents.push({ component, files, status: "owned" });
  }

  const root = ownedComponents.find((entry) => entry.component === name);
  return {
    component: name,
    version,
    files: root?.files ?? [],
    componentDependencies: components[name].componentDependencies ?? [],
    ownedComponents,
  };
}

function walk(root) {
  return fs
    .readdirSync(root, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith(".vue") || file.endsWith(".ts") || file.endsWith(".md"))
    .map((file) => path.join(root, file));
}

/**
 * Statuses:
 * - clean: owned body equals the installed upstream source
 * - modified: bodies differ and the stamp matches the installed version
 * - drifted: bodies differ and the installed version moved past the stamp
 * - unknown-source: the marker no longer identifies a shipped source
 */
export function diffOwned(root, { packageRoot }) {
  const version = packageVersion(packageRoot);
  const entries = [];
  if (!fs.existsSync(root)) return entries;
  for (const file of walk(root)) {
    const content = fs.readFileSync(file, "utf8");
    const newline = content.indexOf("\n");
    const marker = parseMarker(newline === -1 ? content : content.slice(0, newline));
    if (!marker) continue;
    const spec = components[marker.component];
    const upstreamPath = spec ? path.join(packageRoot, spec.dir, marker.file) : null;
    if (!upstreamPath || !spec.files.includes(marker.file) || !fs.existsSync(upstreamPath)) {
      entries.push({ file, marker, status: "unknown-source", upstream: null });
      continue;
    }
    const body = content.slice(newline + 1);
    const upstream = fs.readFileSync(upstreamPath, "utf8");
    const status =
      body === upstream ? "clean" : marker.version === version ? "modified" : "drifted";
    entries.push({ file, marker, status, upstream: upstreamPath, installedVersion: version });
  }
  return entries;
}
