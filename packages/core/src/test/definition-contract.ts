import {
  type ComponentDefinition,
  type DefinitionEntry,
} from "../definition.ts"

export interface ComponentContractAnnotation {
  type: "component-contract"
  description: string
}

export interface ComponentImplementationAnnotation {
  type: "component-implementation"
  description: string
}

export interface RequirementSetAnnotation {
  type: "component-contract-requirements" | "component-implementation-requirements"
  description: string
}

/** Bind runner evidence to the exact immutable Component Contract generation it claims. */
export function componentContractAnnotation(
  definition: ComponentDefinition,
): ComponentContractAnnotation {
  const contract = definition.contract
  if (!contract) {
    throw new Error(`${definition.name} needs a Component Contract before runner registration.`)
  }
  return {
    type: "component-contract",
    description: `${contract.id}@${contract.revision}`,
  }
}


/** Bind concrete runner evidence to the Implementation that owns the mechanism. */
export function componentImplementationAnnotation(
  definition: ComponentDefinition,
): ComponentImplementationAnnotation {
  const implementation = definition.implementation
  if (!implementation) {
    throw new Error(`${definition.name} needs an Implementation before runner registration.`)
  }
  return {
    type: "component-implementation",
    description: `${implementation.id}@${implementation.version}`,
  }
}

function requirementSetAnnotation(
  type: RequirementSetAnnotation["type"],
  requirements: readonly string[],
): RequirementSetAnnotation {
  if (requirements.length === 0) {
    throw new Error(`${type} needs at least one Requirement ID.`)
  }
  if (new Set(requirements).size !== requirements.length) {
    throw new Error(`${type} repeats a Requirement ID.`)
  }
  return { type, description: [...requirements].sort().join(",") }
}

/** Declare the complete executable guarantee set shipped by one Contract runner revision. */
export function componentContractRequirementsAnnotation(
  requirements: readonly string[],
): RequirementSetAnnotation {
  return requirementSetAnnotation("component-contract-requirements", requirements)
}

/** Declare the complete executable choices shipped by one concrete Implementation suite. */
export function componentImplementationRequirementsAnnotation(
  requirements: readonly string[],
): RequirementSetAnnotation {
  return requirementSetAnnotation("component-implementation-requirements", requirements)
}

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
