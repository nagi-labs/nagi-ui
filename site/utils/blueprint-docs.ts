export interface BlueprintProperty {
  name: string;
  type: string;
  required: boolean;
}

export interface BlueprintChannel {
  name: string;
  type: string;
}

const blueprintModules = import.meta.glob("#nagi-blueprints/**/*.vue", {
  import: "default",
  query: "?raw",
});
const controlModules = import.meta.glob("#nagi-control-source/*.ts", {
  import: "default",
  query: "?raw",
});

export interface BlueprintBehaviorApi {
  names: readonly string[];
  source: string;
}

function componentFileName(name: string) {
  return `${name}.vue`;
}

export async function loadBlueprintSource(name: string): Promise<string> {
  const suffix = `/${componentFileName(name)}`;
  const entry = Object.entries(blueprintModules).find(([path]) => path.endsWith(suffix));
  if (!entry) throw new Error(`Blueprint source not found for ${name}`);
  return (await entry[1]()) as string;
}

export async function loadBlueprintBehaviorApis(source: string): Promise<BlueprintBehaviorApi[]> {
  const importedNames = new Set(
    [
      ...source.matchAll(
        /import\s*\{([^}]+)\}\s*from\s*["']@nagi-labs\/nagi-ui(?:\/component-controls)?["']/gu,
      ),
    ]
      .flatMap((match) => (match[1] ?? "").split(","))
      .map((name) => name.trim().replace(/\s+as\s+.+$/u, ""))
      .filter((name) => /^use[A-Z]/u.test(name)),
  );
  if (!importedNames.size) return [];

  const matches: BlueprintBehaviorApi[] = [];
  for (const load of Object.values(controlModules)) {
    const moduleSource = (await load()) as string;
    const names = [...importedNames].filter((name) =>
      new RegExp(`export\\s+function\\s+${name}\\b`, "u").test(moduleSource),
    );
    if (names.length) matches.push({ names, source: moduleSource });
  }
  return matches;
}

function matchingBrace(source: string, start: number) {
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index] ?? "";
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}" && (depth -= 1) === 0) return index;
  }
  return -1;
}

function splitProperties(body: string) {
  const properties: string[] = [];
  let start = 0;
  let angle = 0;
  let brace = 0;
  let bracket = 0;
  let parenthesis = 0;

  for (let index = 0; index < body.length; index += 1) {
    const character = body[index];
    if (character === "<") angle += 1;
    else if (character === ">") angle = Math.max(0, angle - 1);
    else if (character === "{") brace += 1;
    else if (character === "}") brace -= 1;
    else if (character === "[") bracket += 1;
    else if (character === "]") bracket -= 1;
    else if (character === "(") parenthesis += 1;
    else if (character === ")") parenthesis -= 1;
    else if (
      character === ";" &&
      angle === 0 &&
      brace === 0 &&
      bracket === 0 &&
      parenthesis === 0
    ) {
      properties.push(body.slice(start, index));
      start = index + 1;
    }
  }
  if (body.slice(start).trim()) properties.push(body.slice(start));
  return properties;
}

export function blueprintProperties(source: string): BlueprintProperty[] {
  const defineProps = source.indexOf("defineProps<");
  if (defineProps < 0) return [];
  const opening = source.indexOf("{", defineProps);
  if (opening < 0) return [];
  const closing = matchingBrace(source, opening);
  if (closing < 0) return [];

  return splitProperties(source.slice(opening + 1, closing))
    .map((property) => property.replace(/\/\*[\s\S]*?\*\//gu, "").trim())
    .map((property) => property.match(/^([\w$]+)(\?)?\s*:\s*([\s\S]+)$/u))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({
      name: match[1] ?? "",
      required: match[2] !== "?",
      type: (match[3] ?? "").replace(/\s+/gu, " ").trim(),
    }));
}

export function blueprintModels(source: string): BlueprintChannel[] {
  return [...source.matchAll(/defineModel<([^;\n]+?)>\(\s*(?:["']([^"']+)["'])?/gu)].map(
    (match) => ({
      name: match[2] ? `v-model:${match[2]}` : "v-model",
      type: (match[1] ?? "unknown").trim(),
    }),
  );
}

export function blueprintSlots(source: string): BlueprintChannel[] {
  const names = [...source.matchAll(/<slot(?:\s+name=["']([^"']+)["'])?/gu)].map(
    (match) => match[1] ?? "default",
  );
  return [...new Set(names)].map((name) => ({ name, type: "Vue slot" }));
}

export function blueprintEvents(source: string): BlueprintChannel[] {
  const defineEmits = source.indexOf("defineEmits<");
  if (defineEmits < 0) return [];
  const opening = source.indexOf("{", defineEmits);
  if (opening < 0) return [];
  const closing = matchingBrace(source, opening);
  if (closing < 0) return [];

  return splitProperties(source.slice(opening + 1, closing))
    .map((event) => event.trim().match(/^["']?([\w:-]+)["']?\??\s*:\s*([\s\S]+)$/u))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({ name: match[1] ?? "", type: (match[2] ?? "unknown").trim() }));
}
