import {
  type ComponentDefinition,
  type DefinitionEntry,
} from "../definition.ts"

function statementIds(entries: readonly DefinitionEntry[]): string[] {
  return entries.flatMap((entry) => typeof entry === "string" ? [] : [entry.id])
}

/** IDs a Definition actually declares, including audited anatomy parts. */
export function definitionRequirementIds(definition: ComponentDefinition): readonly string[] {
  return [
    ...statementIds(definition.semantics),
    ...statementIds(definition.state),
    ...statementIds(definition.interaction),
    ...statementIds(definition.focus),
    ...definition.anatomy.flatMap((part) => part.id ? [part.id] : []),
    ...statementIds(definition.style),
  ]
}

/**
 * Refuse a contract label that names an absent or duplicate requirement.
 *
 * This proves traceability, not that an assertion faithfully implements prose;
 * mutation tests still have to demonstrate that each claimed boundary fails.
 */
export function assertContractRequirements(
  definition: ComponentDefinition,
  requirements: readonly string[],
): void {
  const declared = new Set(definitionRequirementIds(definition))
  const seen = new Set<string>()
  for (const requirement of requirements) {
    if (!declared.has(requirement)) {
      throw new Error(`${definition.name} contract names undeclared requirement "${requirement}".`)
    }
    if (seen.has(requirement)) {
      throw new Error(`${definition.name} contract repeats requirement "${requirement}" in one check.`)
    }
    seen.add(requirement)
  }
}

export function contractTitle(
  definition: ComponentDefinition,
  requirements: readonly string[],
  title: string,
): string {
  assertContractRequirements(definition, requirements)
  return `${requirements.map((id) => `[${id}]`).join("")} ${title}`
}
