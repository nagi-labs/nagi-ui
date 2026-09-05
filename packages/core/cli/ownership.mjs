import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

export const components = {
  accordion: {
    dir: "blueprints/accordion",
    files: ["Accordion.vue"],
    componentDependencies: ["disclosure"],
  },
  autocomplete: { dir: "blueprints/autocomplete", files: ["Autocomplete.vue"] },
  alert: { dir: "blueprints/alert", files: ["Alert.vue"] },
  "alert-dialog": {
    dir: "blueprints/alert-dialog",
    files: ["AlertDialog.vue", "alert-dialog.definition.ts"],
  },
  avatar: { dir: "blueprints/avatar", files: ["Avatar.vue"] },
  badge: { dir: "blueprints/badge", files: ["Badge.vue"] },
  breadcrumb: { dir: "blueprints/breadcrumb", files: ["Breadcrumb.vue"] },
  button: { dir: "blueprints/button", files: ["Button.vue", "button.definition.ts"] },
  "button-group": { dir: "blueprints/button-group", files: ["ButtonGroup.vue"] },
  card: { dir: "blueprints/card", files: ["Card.vue"] },
  calendar: { dir: "blueprints/calendar", files: ["Calendar.vue"] },
  carousel: {
    dir: "blueprints/carousel",
    files: ["Carousel.vue", "carousel.definition.ts"],
  },
  checkbox: { dir: "blueprints/checkbox", files: ["Checkbox.vue"] },
  combobox: { dir: "blueprints/combobox", files: ["Combobox.vue", "combobox.definition.ts"] },
  "context-menu": { dir: "blueprints/context-menu", files: ["ContextMenu.vue", "EXTENDING.md"] },
  "date-field": { dir: "blueprints/date-field", files: ["DateField.vue"] },
  "date-picker": {
    dir: "blueprints/date-picker",
    files: [
      "DatePicker.vue",
      "internal/DatePickerPopup.vue",
      "internal/date-picker-context.ts",
      "date-picker.definition.ts",
    ],
  },
  "date-range-picker": {
    dir: "blueprints/date-range-picker",
    files: [
      "DateRangePicker.vue",
      "internal/DateRangePickerPopup.vue",
      "internal/date-range-picker-context.ts",
    ],
  },
  dialog: { dir: "blueprints/dialog", files: ["Dialog.vue", "dialog.definition.ts"] },
  disclosure: { dir: "blueprints/disclosure", files: ["Disclosure.vue"] },
  "dropdown-menu": {
    dir: "blueprints/menu",
    files: [
      "DropdownMenu.vue",
      "internal/DropdownMenuGroup.vue",
      "internal/DropdownMenuItem.vue",
      "internal/DropdownSubmenu.vue",
      "dropdown-options.ts",
      "dropdown-schema.ts",
      "dropdown-menu.definition.ts",
    ],
  },
  "empty-state": { dir: "blueprints/empty-state", files: ["EmptyState.vue"] },
  fieldset: { dir: "blueprints/fieldset", files: ["Fieldset.vue"] },
  "file-input": { dir: "blueprints/file-input", files: ["FileInput.vue"] },
  input: { dir: "blueprints/input", files: ["Input.vue"] },
  "input-group": { dir: "blueprints/input-group", files: ["InputGroup.vue"] },
  kbd: { dir: "blueprints/kbd", files: ["Kbd.vue"] },
  listbox: { dir: "blueprints/listbox", files: ["Listbox.vue", "listbox.definition.ts"] },
  meter: { dir: "blueprints/meter", files: ["Meter.vue"] },
  menubar: { dir: "blueprints/menubar", files: ["Menubar.vue", "EXTENDING.md"] },
  "multi-select": { dir: "blueprints/multi-select", files: ["MultiSelect.vue"] },
  "number-field": { dir: "blueprints/number-field", files: ["NumberField.vue"] },
  "navigation-menu": { dir: "blueprints/navigation-menu", files: ["NavigationMenu.vue"] },
  "otp-field": { dir: "blueprints/otp-field", files: ["OTPField.vue"] },
  pagination: { dir: "blueprints/pagination", files: ["Pagination.vue"] },
  popover: { dir: "blueprints/popover", files: ["Popover.vue", "popover.definition.ts"] },
  progress: { dir: "blueprints/progress", files: ["Progress.vue"] },
  "preview-card": { dir: "blueprints/preview-card", files: ["PreviewCard.vue"] },
  radio: { dir: "blueprints/radio", files: ["Radio.vue"] },
  "range-calendar": { dir: "blueprints/range-calendar", files: ["RangeCalendar.vue"] },
  "range-slider": { dir: "blueprints/range-slider", files: ["RangeSlider.vue"] },
  resizable: { dir: "blueprints/resizable", files: ["Resizable.vue"] },
  rating: { dir: "blueprints/rating", files: ["Rating.vue"] },
  select: { dir: "blueprints/select", files: ["Select.vue"] },
  separator: { dir: "blueprints/separator", files: ["Separator.vue"] },
  sidebar: { dir: "blueprints/sidebar", files: ["Sidebar.vue"] },
  "sidebar-link": { dir: "blueprints/sidebar", files: ["SidebarLink.vue"] },
  "sidebar-section": { dir: "blueprints/sidebar", files: ["SidebarSection.vue"] },
  skeleton: { dir: "blueprints/skeleton", files: ["Skeleton.vue"] },
  slider: { dir: "blueprints/slider", files: ["Slider.vue"] },
  spinner: { dir: "blueprints/spinner", files: ["Spinner.vue"] },
  stepper: { dir: "blueprints/stepper", files: ["Stepper.vue"] },
  switch: { dir: "blueprints/switch", files: ["Switch.vue"] },
  table: { dir: "blueprints/table", files: ["Table.vue"] },
  tabs: { dir: "blueprints/tabs", files: ["Tabs.vue"] },
  "tags-input": { dir: "blueprints/tags-input", files: ["TagsInput.vue"] },
  textarea: { dir: "blueprints/textarea", files: ["Textarea.vue"] },
  "time-field": { dir: "blueprints/time-field", files: ["TimeField.vue"] },
  toolbar: { dir: "blueprints/toolbar", files: ["Toolbar.vue"] },
  toast: { dir: "blueprints/toast", files: ["Toast.vue", "toast.definition.ts"] },
  toggle: { dir: "blueprints/toggle", files: ["Toggle.vue"] },
  "toggle-group": { dir: "blueprints/toggle-group", files: ["ToggleGroup.vue"] },
  tree: { dir: "blueprints/tree", files: ["Tree.vue", "TreeBranch.vue"] },
  tooltip: { dir: "blueprints/tooltip", files: ["Tooltip.vue"] },
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
