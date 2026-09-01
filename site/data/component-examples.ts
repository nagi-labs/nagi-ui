import { componentDocuments } from "./components";
import { actionsFormsExamples } from "./examples/actions-forms";
import { dateNavigationExamples } from "./examples/date-navigation";
import { displayOverlayExamples } from "./examples/display-overlay";

const sources: Readonly<Record<string, string>> = {
  ...actionsFormsExamples,
  ...dateNavigationExamples,
  ...displayOverlayExamples,
};

const expectedNames = new Set(componentDocuments.map((component) => component.name));
const missing = [...expectedNames].filter((name) => !Object.hasOwn(sources, name));
const unknown = Object.keys(sources).filter((name) => !expectedNames.has(name));

if (missing.length || unknown.length || Object.keys(sources).length !== expectedNames.size) {
  throw new Error(
    `Component example coverage is invalid. Missing: ${missing.join(", ") || "none"}. Unknown: ${unknown.join(", ") || "none"}.`,
  );
}

export function componentExampleSource(name: string) {
  const source = sources[name];
  if (!source) throw new Error(`No source example registered for ${name}`);
  return source;
}

export const componentExampleCount = Object.keys(sources).length;
