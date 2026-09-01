import { readFileSync } from "node:fs"
import path from "node:path"

import {
  assertDefinition,
  type ComponentDefinition,
  type DefinitionEntry,
} from "../../packages/core/src/definition.ts"

interface RequirementEvidence {
  id: string
  sources: readonly string[]
}

function statementEvidence(entries: readonly DefinitionEntry[]): RequirementEvidence[] {
  return entries.flatMap((entry) =>
    typeof entry === "string" ? [] : [{ id: entry.id, sources: entry.evidence }],
  )
}

function definitionRequirementEvidence(
  definition: ComponentDefinition,
): readonly RequirementEvidence[] {
  return [
    ...statementEvidence(definition.semantics),
    ...statementEvidence(definition.state),
    ...statementEvidence(definition.interaction),
    ...statementEvidence(definition.focus),
    ...definition.anatomy.flatMap((part) =>
      part.id ? [{ id: part.id, sources: part.evidence ?? [] }] : [],
    ),
    ...statementEvidence(definition.style),
  ]
}

/**
 * Verify repository evidence links for a Definition declared as verified.
 *
 * This Node-only audit stays outside the browser-safe `@nagi-labs/nagi-ui/test`
 * entry point. It establishes traceability; the corresponding suites and
 * mutation probes still determine whether an assertion matches its prose.
 */
export function assertDefinitionEvidence(
  definition: ComponentDefinition,
  repositoryRoot: string,
): void {
  assertDefinition(definition)
  if (definition.status !== "verified") {
    throw new Error(`${definition.name} Definition is not declared verified.`)
  }

  const root = path.resolve(repositoryRoot)
  for (const requirement of definitionRequirementEvidence(definition)) {
    for (const source of requirement.sources) {
      const resolved = path.resolve(root, source)
      const relative = path.relative(root, resolved)
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new Error(
          `${definition.name} evidence for ${requirement.id} escapes the repository: "${source}".`,
        )
      }
      const contents = readFileSync(resolved, "utf8")
      if (!contents.includes(requirement.id)) {
        throw new Error(
          `${definition.name} evidence "${source}" does not name ${requirement.id}.`,
        )
      }
    }
  }
}
