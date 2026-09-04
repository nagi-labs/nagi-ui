/**
 * Component Definitions and functional anatomy verification.
 *
 * A resolved Definition records what one concrete component guarantees. A
 * portable ComponentContract and one ComponentImplementation may be
 * composed when its module is evaluated, but the Blueprint never reads the
 * result at render time. Documentation, ownership, and tests consume the same
 * resolved value instead of restating it three times.
 *
 * The anatomy is deliberately expressed over things that survive an owner's DOM
 * edits — scoped part markers, roles, native elements, and containment — never
 * over Nagi CSS class names. A class name is derived from the DOM and changes
 * when the DOM changes, so it cannot anchor a requirement about the DOM
 * (CHARTER, "Visible DOM ownership"; see
 * `docs/component-layer-audit.md`). Behavioral prose remains a reviewable
 * manifest; only anatomy is interpreted as a DOM rule.
 */

/** How a part is located in rendered DOM. */
export type AnatomyMatch =
  | { by: "root" }
  | {
      /** Match one explicitly named part in a component namespace. */
      by: "part";
      scope: string;
      part: string;
    }
  | {
      by: "role";
      role: string;
      /** Require an exact `aria-roledescription` value. */
      roleDescription?: string;
      /** Require a non-empty author-provided accessible-name attribute. */
      nameFrom?: "aria-label" | "aria-labelledby";
    }
  | { by: "element"; element: string }
  /**
   * No semantic handle exists for this part, so the Blueprint marks it. Use
   * only when role, element, or a structural relationship cannot identify the
   * part; Toast's item marker is the motivating case.
   */
  | { by: "marker"; attribute: string };

export interface AnatomyPart {
  /** Stable requirement ID when this part carries an audited anatomy rule. */
  id?: string;
  /** Test source paths that execute this audited anatomy requirement. */
  evidence?: readonly string[];
  /** Stable name used by the Definition, the docs, and tests. Never a CSS class. */
  name: string;
  /** Human-readable purpose, rendered in documentation. */
  description: string;
  match: AnatomyMatch;
  /**
   * Name of the part this must be an immediate child of. Inserting a wrapper
   * between them is a contract violation, because behavior reads direct
   * children (Carousel) or measures the immediate parent (Resizable).
   */
  directChildOf?: string;
  /** Name of the part this must be contained by at any depth. */
  within?: string;
  /** The part may appear more than once. Defaults to false. */
  multiple?: boolean;
  /** Ignore matching descendants of another match, e.g. a nested Carousel. */
  outermost?: boolean;
  /** The part must be present. Defaults to true. */
  required?: boolean;
  /** Portable conceptual part this concrete DOM part realizes, when applicable. */
  contractPart?: string;
}

/** A consumer-facing API member whose meaning is part of the portable contract. */
export interface ComponentApiMember {
  name: string;
  kind: "prop" | "model" | "event" | "slot" | "method" | "css-property";
  description: string;
}

/** A conceptual component part independent of its concrete DOM locator or nesting. */
export interface ComponentPart {
  name: string;
  description: string;
  /** The concept may occur more than once. Defaults to false. */
  multiple?: boolean;
  /** The concept is guaranteed to exist. Defaults to true. */
  required?: boolean;
}

export type DefinitionClassification =
  | "conformant"
  | "intentional-extension"
  | "implementation-constraint";

/** Whether every declared Requirement has repository-verifiable evidence. */
export type DefinitionStatus = "draft" | "verified";

export type DefinitionSection = "semantics" | "state" | "interaction" | "focus" | "style";

/** A reviewable snapshot of the external material Nagi adopted. */
export interface DefinitionReference {
  /** Stable local identity; URLs and upstream titles may change independently. */
  id: string;
  title: string;
  url: string;
  /** Distinguishes fixed specifications from continuously updated guidance. */
  kind: "standard" | "living-standard" | "pattern" | "example";
  /** Published version, upstream revision, or an explicit rolling-snapshot label. */
  revision: string;
  /** ISO date on which Nagi reviewed this revision. */
  reviewedAt: string;
}

export type DefinitionOrigin =
  | {
      /** A source-backed Requirement resolved through a versioned shared set. */
      kind: "standard";
      requirementSet: string;
      requirementSetVersion: string;
      requirement: string;
      referenceIds: readonly string[];
    }
  | {
      /** Component-specific standards provenance that is not a reusable set. */
      kind: "reference";
      referenceIds: readonly string[];
    }
  | {
      kind: "nagi";
      policy: string;
      policyVersion: string;
    };

export interface DefinitionStatement {
  /** Stable requirement ID shared by the audit, Definition, and tests. */
  id: string;
  /** Whether the statement comes from the adopted pattern or from Nagi policy. */
  classification: DefinitionClassification;
  /** Human-readable authority, such as the APG Carousel Pattern or Nagi policy. */
  source: string;
  /** Observable requirement or policy, without implementation-only rationale. */
  text: string;
  /** Test names or files that provide executable evidence for this statement. */
  evidence: readonly string[];
  /** Machine-readable provenance; optional while older Definitions migrate. */
  origin?: DefinitionOrigin;
}

export type DefinitionEntry = string | DefinitionStatement;

/** One reusable requirement before a component supplies its evidence mapping. */
export interface RequirementSetStatement {
  /** Section-local suffix such as `SEM-01`; the component supplies its prefix. */
  id: string;
  section: DefinitionSection;
  classification: DefinitionClassification;
  text: string;
  referenceIds: readonly string[];
  /** Marks a shared Nagi choice instead of misattributing it to the references. */
  policy?: {
    name: string;
    version: string;
  };
}

/** A locally versioned snapshot of requirements adopted from existing specifications. */
export interface RequirementSet {
  id: string;
  title: string;
  version: string;
  /** Allowed adoption choices. A component must select exactly one value per key. */
  profile: Readonly<Record<string, readonly AdoptionProfileValue[]>>;
  references: readonly DefinitionReference[];
  requirements: readonly RequirementSetStatement[];
}

export type AdoptionProfileValue = string | number | boolean;

/** Provenance retained on the fully resolved component Definition. */
export interface RequirementSetAdoption {
  requirementSet: string;
  requirementSetVersion: string;
  title: string;
  profile: Readonly<Record<string, AdoptionProfileValue>>;
  references: readonly DefinitionReference[];
  requirementIds: readonly string[];
}

export interface AdoptedRequirementSet {
  adoption: RequirementSetAdoption;
  statements: readonly (DefinitionStatement & { section: DefinitionSection })[];
}

/**
 * Implementation-independent guarantees shared by every implementation that
 * claims this component contract. The contract may adopt reviewed standards,
 * but it must not require one particular renderer, native element, presence
 * mechanism, or animation library.
 */
export interface ComponentContract {
  id: string;
  /** Immutable compatibility generation. Changed guarantees require a new revision. */
  revision: string;
  description: string;
  /** Public capabilities relevant to the component guarantee, not generated API documentation. */
  api?: readonly ComponentApiMember[];
  /** Portable vocabulary of user-facing parts, independent of DOM structure. */
  parts?: readonly ComponentPart[];
  references?: readonly DefinitionReference[];
  adopts?: readonly AdoptedRequirementSet[];
  semantics?: readonly DefinitionEntry[];
  state?: readonly DefinitionEntry[];
  interaction?: readonly DefinitionEntry[];
  focus?: readonly DefinitionEntry[];
  style?: readonly DefinitionEntry[];
}

/** One explicit choice made by a concrete Blueprint implementation. */
export interface ImplementationDecision {
  /** Stable vocabulary such as `element`, `presence`, or `navigation`. */
  name: string;
  /** Machine-readable selected value, such as `button` or `native-scroll`. */
  value: AdoptionProfileValue;
  /** Why this implementation makes the choice. */
  description: string;
  /** Tests or source contracts that keep the choice reviewable. */
  evidence: readonly string[];
}

/**
 * A concrete implementation of a ComponentContract. The standard Blueprints
 * normally use a platform-first strategy; owned implementations may declare a
 * delegated or custom implementation without changing Nagi's shared contract.
 */
export interface ComponentImplementation {
  id: string;
  title: string;
  version: string;
  strategy: string;
  description: string;
  decisions: readonly ImplementationDecision[];
  references?: readonly DefinitionReference[];
  adopts?: readonly AdoptedRequirementSet[];
  semantics?: readonly DefinitionEntry[];
  state?: readonly DefinitionEntry[];
  interaction?: readonly DefinitionEntry[];
  focus?: readonly DefinitionEntry[];
  anatomy: readonly AnatomyPart[];
  style?: readonly DefinitionEntry[];
}

export interface ComponentDefinition {
  /** Component name as exported and documented. */
  name: string;
  /** Definition version, used as the provenance baseline for owned source. */
  version: string;
  /** Omitted Definitions are treated as drafts while the catalog migrates. */
  status?: DefinitionStatus;
  /** Portable guarantees that this concrete implementation claims to satisfy. */
  contract?: ComponentContract;
  /** Renderer and lifecycle choices made by this concrete implementation. */
  implementation?: ComponentImplementation;
  /** Reviewed sources used only by this component rather than a shared set. */
  references?: readonly DefinitionReference[];
  /** Standard foundations expanded into the complete section arrays below. */
  adoptions?: readonly RequirementSetAdoption[];
  /** Consumer-facing API members inherited from the portable Contract. */
  api: readonly ComponentApiMember[];
  /** Portable conceptual parts inherited from the Contract. */
  parts: readonly ComponentPart[];
  /** Roles, accessible names, and ARIA relationships the component guarantees. */
  semantics: readonly DefinitionEntry[];
  /** Observable states and the policy that governs them. */
  state: readonly DefinitionEntry[];
  /** How the component is operated, including declared policy choices. */
  interaction: readonly DefinitionEntry[];
  /** Focus movement, containment, and restoration. */
  focus: readonly DefinitionEntry[];
  /** Structural requirements behavior depends on. */
  anatomy: readonly AnatomyPart[];
  /** Visual contract: variants, sizes, and states the design supports. */
  style: readonly DefinitionEntry[];
}

export interface ComponentDefinitionInput {
  name: string;
  version: string;
  status?: DefinitionStatus;
  contract?: ComponentContract;
  implementation?: ComponentImplementation;
  references?: readonly DefinitionReference[];
  adopts?: readonly AdoptedRequirementSet[];
  api?: readonly ComponentApiMember[];
  parts?: readonly ComponentPart[];
  semantics?: readonly DefinitionEntry[];
  state?: readonly DefinitionEntry[];
  interaction?: readonly DefinitionEntry[];
  focus?: readonly DefinitionEntry[];
  anatomy?: readonly AnatomyPart[];
  style?: readonly DefinitionEntry[];
}

/** Preserve an implementation-independent contract as a typed value. */
export function defineComponentContract<const Contract extends ComponentContract>(
  contract: Contract,
): Contract {
  if (!contract.id.trim() || !contract.revision.trim() || !contract.description.trim()) {
    throw new Error("A Component Contract needs a non-empty id, revision, and description.");
  }
  return contract;
}

/** Preserve one concrete implementation of a Component Contract as a typed value. */
export function defineComponentImplementation<const Implementation extends ComponentImplementation>(
  implementation: Implementation,
): Implementation {
  if (
    !implementation.id.trim() ||
    !implementation.title.trim() ||
    !implementation.version.trim() ||
    !implementation.strategy.trim() ||
    !implementation.description.trim()
  ) {
    throw new Error(
      "A component implementation needs a non-empty id, title, version, strategy, and description.",
    );
  }
  const decisions = new Set<string>();
  for (const decision of implementation.decisions) {
    if (decisions.has(decision.name)) {
      throw new Error(
        `${implementation.id}@${implementation.version} repeats decision "${decision.name}".`,
      );
    }
    decisions.add(decision.name);
    if (
      !decision.name.trim() ||
      !String(decision.value).trim() ||
      !decision.description.trim() ||
      decision.evidence.length === 0 ||
      decision.evidence.some((value) => !value.trim())
    ) {
      throw new Error(
        `${implementation.id}@${implementation.version} decision "${decision.name}" is incomplete.`,
      );
    }
  }
  return implementation;
}

/** Preserve a standard Requirement set as a typed, locally versioned value. */
export function defineRequirementSet<const Set extends RequirementSet>(set: Set): Set {
  const referenceIds = new Set<string>();
  for (const reference of set.references) {
    if (referenceIds.has(reference.id)) {
      throw new Error(`${set.id}@${set.version} repeats source "${reference.id}".`);
    }
    referenceIds.add(reference.id);
  }
  const requirementIds = new Set<string>();
  for (const requirement of set.requirements) {
    if (requirementIds.has(requirement.id)) {
      throw new Error(`${set.id}@${set.version} repeats requirement "${requirement.id}".`);
    }
    requirementIds.add(requirement.id);
    for (const referenceId of requirement.referenceIds) {
      if (!referenceIds.has(referenceId)) {
        throw new Error(
          `${set.id}@${set.version} requirement "${requirement.id}" references unknown source "${referenceId}".`,
        );
      }
    }
    if (
      requirement.policy !== undefined &&
      (!requirement.policy.name.trim() || !requirement.policy.version.trim())
    ) {
      throw new Error(
        `${set.id}@${set.version} requirement "${requirement.id}" has an empty Nagi policy identity.`,
      );
    }
  }
  return set;
}

/**
 * Bind a reusable standard set to one component's stable IDs and executable evidence.
 * Missing evidence is rejected here instead of producing an incomplete Definition.
 */
export function adoptRequirementSet(
  set: RequirementSet,
  options: {
    prefix: string;
    profile: Readonly<Record<string, AdoptionProfileValue>>;
    evidence: Readonly<Record<string, readonly string[]>>;
  },
): AdoptedRequirementSet {
  const expectedProfile = Object.keys(set.profile);
  const actualProfile = Object.keys(options.profile);
  for (const key of expectedProfile) {
    const value = options.profile[key];
    if (value === undefined) {
      throw new Error(`${set.id}@${set.version} adoption is missing profile choice "${key}".`);
    }
    const allowed = set.profile[key] ?? [];
    if (!allowed.includes(value)) {
      throw new Error(
        `${set.id}@${set.version} profile "${key}" does not accept "${String(value)}".`,
      );
    }
  }
  for (const key of actualProfile) {
    if (key in set.profile) continue;
    throw new Error(`${set.id}@${set.version} has no profile choice named "${key}".`);
  }

  const requirementIds = new Set(set.requirements.map((requirement) => requirement.id));
  for (const requirementId of Object.keys(options.evidence)) {
    if (requirementIds.has(requirementId)) continue;
    throw new Error(
      `${set.id}@${set.version} evidence names unknown requirement "${requirementId}".`,
    );
  }

  const references = new Map(set.references.map((reference) => [reference.id, reference]));
  const statements = set.requirements.map((requirement) => {
    const evidence = options.evidence[requirement.id];
    if (!evidence?.length) {
      throw new Error(
        `${set.id}@${set.version} requirement "${requirement.id}" needs component evidence.`,
      );
    }
    const sources = requirement.referenceIds.map((id) => {
      const reference = references.get(id);
      if (!reference) {
        throw new Error(
          `${set.id}@${set.version} requirement "${requirement.id}" references unknown source "${id}".`,
        );
      }
      return reference.title;
    });
    const origin: DefinitionOrigin = requirement.policy
      ? {
          kind: "nagi",
          policy: requirement.policy.name,
          policyVersion: requirement.policy.version,
        }
      : {
          kind: "standard",
          requirementSet: set.id,
          requirementSetVersion: set.version,
          requirement: requirement.id,
          referenceIds: requirement.referenceIds,
        };
    return {
      id: `${options.prefix}-${requirement.id}`,
      section: requirement.section,
      classification: requirement.classification,
      source: sources.join(" and "),
      text: requirement.text,
      evidence,
      origin,
    };
  });

  return {
    adoption: {
      requirementSet: set.id,
      requirementSetVersion: set.version,
      title: set.title,
      profile: options.profile,
      references: set.references,
      requirementIds: statements.map((statement) => statement.id),
    },
    statements,
  };
}

/**
 * Resolve adopted standards, a portable Contract, and one Implementation into
 * the complete Definition consumed by existing verifiers.
 */
export function defineComponentDefinition(input: ComponentDefinitionInput): ComponentDefinition {
  const adoptedSets = [
    ...(input.contract?.adopts ?? []),
    ...(input.implementation?.adopts ?? []),
    ...(input.adopts ?? []),
  ];
  const adoptedBySection = new Map<DefinitionSection, DefinitionStatement[]>();
  for (const adopted of adoptedSets) {
    for (const statement of adopted.statements) {
      const { section, ...resolved } = statement;
      const entries = adoptedBySection.get(section) ?? [];
      entries.push(resolved);
      adoptedBySection.set(section, entries);
    }
  }

  function entries(
    section: DefinitionSection,
    local: readonly DefinitionEntry[] | undefined,
  ): readonly DefinitionEntry[] {
    return [
      ...(adoptedBySection.get(section) ?? []),
      ...(input.contract?.[section] ?? []),
      ...(input.implementation?.[section] ?? []),
      ...(local ?? []),
    ];
  }

  const references = [
    ...(input.contract?.references ?? []),
    ...(input.implementation?.references ?? []),
    ...(input.references ?? []),
  ];

  return {
    name: input.name,
    version: input.version,
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.contract === undefined ? {} : { contract: input.contract }),
    ...(input.implementation === undefined ? {} : { implementation: input.implementation }),
    ...(references.length === 0 ? {} : { references }),
    adoptions: adoptedSets.map((adopted) => adopted.adoption),
    api: [...(input.contract?.api ?? []), ...(input.api ?? [])],
    parts: [...(input.contract?.parts ?? []), ...(input.parts ?? [])],
    semantics: entries("semantics", input.semantics),
    state: entries("state", input.state),
    interaction: entries("interaction", input.interaction),
    focus: entries("focus", input.focus),
    anatomy: [...(input.implementation?.anatomy ?? []), ...(input.anatomy ?? [])],
    style: entries("style", input.style),
  };
}

export type AnatomyIssueCode =
  | "missing-part"
  | "missing-parent"
  | "misplaced-part"
  | "ambiguous-part"
  | "unknown-parent";

export interface AnatomyIssue {
  code: AnatomyIssueCode;
  message: string;
  part: string;
  element?: Element;
}

export type DefinitionIssueCode =
  | "duplicate-requirement-id"
  | "empty-requirement-field"
  | "misclassified-requirement-id"
  | "duplicate-adoption"
  | "empty-adoption-field"
  | "unknown-adoption"
  | "unknown-reference"
  | "duplicate-reference"
  | "empty-reference-field"
  | "verified-legacy-entry"
  | "verified-missing-origin"
  | "verified-missing-evidence"
  | "duplicate-api-member"
  | "empty-api-member"
  | "duplicate-contract-part"
  | "empty-contract-part"
  | "unknown-contract-part"
  | "duplicate-part-name"
  | "empty-part-field"
  | "unknown-part-parent";

export interface DefinitionIssue {
  code: DefinitionIssueCode;
  message: string;
  field: string;
}

const statementSections = [
  ["semantics", "SEM"],
  ["state", "STATE"],
  ["interaction", "INT"],
  ["focus", "FOCUS"],
  ["style", "STYLE"],
] as const;

/**
 * Validate the Definition as a maintenance manifest before its DOM is rendered.
 *
 * This does not claim that prose is executable. It prevents the manifest from
 * silently losing traceability through duplicate IDs, empty evidence, or
 * impossible anatomy relationships. Behavioral evidence still has to run in
 * the consumer's test suite.
 */
export function validateDefinition(definition: ComponentDefinition): DefinitionIssue[] {
  const issues: DefinitionIssue[] = [];
  const ids = new Set<string>();
  const adoptions = new Map<string, RequirementSetAdoption>();
  const verified = definition.status === "verified";
  const directReferences = new Set<string>();

  const apiMembers = new Set<string>();
  for (const [index, member] of definition.api.entries()) {
    const field = `api[${index}]`;
    const key = `${member.kind}:${member.name}`;
    if (apiMembers.has(key)) {
      issues.push({
        code: "duplicate-api-member",
        message: `Component API member "${key}" is declared more than once.`,
        field,
      });
    }
    apiMembers.add(key);
    if (!member.name.trim() || !member.description.trim()) {
      issues.push({
        code: "empty-api-member",
        message: `${field} must have a non-empty name and description.`,
        field,
      });
    }
  }

  const contractParts = new Set<string>();
  for (const [index, part] of definition.parts.entries()) {
    const field = `parts[${index}]`;
    if (contractParts.has(part.name)) {
      issues.push({
        code: "duplicate-contract-part",
        message: `Conceptual part "${part.name}" is declared more than once.`,
        field: `${field}.name`,
      });
    }
    contractParts.add(part.name);
    if (!part.name.trim() || !part.description.trim()) {
      issues.push({
        code: "empty-contract-part",
        message: `${field} must have a non-empty name and description.`,
        field,
      });
    }
  }

  for (const [index, reference] of (definition.references ?? []).entries()) {
    const field = `references[${index}]`;
    if (directReferences.has(reference.id)) {
      issues.push({
        code: "duplicate-reference",
        message: `Definition source "${reference.id}" is declared more than once.`,
        field: `${field}.id`,
      });
    }
    directReferences.add(reference.id);
    for (const [name, value] of [
      ["id", reference.id],
      ["title", reference.title],
      ["url", reference.url],
      ["revision", reference.revision],
      ["reviewedAt", reference.reviewedAt],
    ] as const) {
      if (value.trim()) continue;
      issues.push({
        code: "empty-reference-field",
        message: `${field}.${name} must not be empty.`,
        field: `${field}.${name}`,
      });
    }
  }

  for (const [index, adoption] of (definition.adoptions ?? []).entries()) {
    const field = `adoptions[${index}]`;
    if (adoptions.has(adoption.requirementSet)) {
      issues.push({
        code: "duplicate-adoption",
        message: `Requirement set "${adoption.requirementSet}" is adopted more than once.`,
        field: `${field}.requirementSet`,
      });
    }
    adoptions.set(adoption.requirementSet, adoption);
    for (const [name, value] of [
      ["requirementSet", adoption.requirementSet],
      ["requirementSetVersion", adoption.requirementSetVersion],
      ["title", adoption.title],
    ] as const) {
      if (value.trim()) continue;
      issues.push({
        code: "empty-adoption-field",
        message: `${field}.${name} must not be empty.`,
        field: `${field}.${name}`,
      });
    }
    for (const [referenceIndex, reference] of adoption.references.entries()) {
      for (const [name, value] of [
        ["id", reference.id],
        ["title", reference.title],
        ["url", reference.url],
        ["revision", reference.revision],
        ["reviewedAt", reference.reviewedAt],
      ] as const) {
        if (value.trim()) continue;
        issues.push({
          code: "empty-adoption-field",
          message: `${field}.references[${referenceIndex}].${name} must not be empty.`,
          field: `${field}.references[${referenceIndex}].${name}`,
        });
      }
    }
  }

  for (const [section, token] of statementSections) {
    for (const [index, entry] of definition[section].entries()) {
      const field = `${section}[${index}]`;
      if (typeof entry === "string") {
        if (verified) {
          issues.push({
            code: "verified-legacy-entry",
            message: `${field} must be a structured Requirement before the Definition is verified.`,
            field,
          });
        }
        continue;
      }
      if (ids.has(entry.id)) {
        issues.push({
          code: "duplicate-requirement-id",
          message: `Requirement ID "${entry.id}" is declared more than once.`,
          field: `${field}.id`,
        });
      }
      ids.add(entry.id);
      if (!entry.id.includes(`-${token}-`)) {
        issues.push({
          code: "misclassified-requirement-id",
          message: `Requirement ID "${entry.id}" does not belong to ${section}.`,
          field: `${field}.id`,
        });
      }
      for (const [name, value] of [
        ["id", entry.id],
        ["source", entry.source],
        ["text", entry.text],
      ] as const) {
        if (value.trim()) continue;
        issues.push({
          code: "empty-requirement-field",
          message: `${field}.${name} must not be empty.`,
          field: `${field}.${name}`,
        });
      }
      if (entry.evidence.length === 0 || entry.evidence.some((value) => !value.trim())) {
        issues.push({
          code: "empty-requirement-field",
          message: `${field}.evidence must name at least one non-empty test source.`,
          field: `${field}.evidence`,
        });
      }
      if (verified && entry.origin === undefined) {
        issues.push({
          code: "verified-missing-origin",
          message: `${entry.id} must identify its adopted standard or Nagi policy before the Definition is verified.`,
          field: `${field}.origin`,
        });
      }
      if (entry.origin?.kind === "standard") {
        const adoption = adoptions.get(entry.origin.requirementSet);
        if (
          !adoption ||
          adoption.requirementSetVersion !== entry.origin.requirementSetVersion ||
          !adoption.requirementIds.includes(entry.id)
        ) {
          issues.push({
            code: "unknown-adoption",
            message: `${entry.id} does not resolve to its declared Requirement-set adoption.`,
            field: `${field}.origin`,
          });
        } else {
          const referenceIds = new Set(adoption.references.map((reference) => reference.id));
          for (const referenceId of entry.origin.referenceIds) {
            if (referenceIds.has(referenceId)) continue;
            issues.push({
              code: "unknown-reference",
              message: `${entry.id} references unknown adopted source "${referenceId}".`,
              field: `${field}.origin.referenceIds`,
            });
          }
        }
      } else if (entry.origin?.kind === "reference") {
        for (const referenceId of entry.origin.referenceIds) {
          if (directReferences.has(referenceId)) continue;
          issues.push({
            code: "unknown-reference",
            message: `${entry.id} references unknown component source "${referenceId}".`,
            field: `${field}.origin.referenceIds`,
          });
        }
      } else if (entry.origin?.kind === "nagi") {
        if (!entry.origin.policy.trim() || !entry.origin.policyVersion.trim()) {
          issues.push({
            code: "empty-requirement-field",
            message: `${entry.id} must name a non-empty Nagi policy and policy version.`,
            field: `${field}.origin`,
          });
        }
      }
    }
  }

  const parts = new Set<string>();
  for (const [index, part] of definition.anatomy.entries()) {
    const field = `anatomy[${index}]`;
    if (part.id !== undefined) {
      if (ids.has(part.id)) {
        issues.push({
          code: "duplicate-requirement-id",
          message: `Requirement ID "${part.id}" is declared more than once.`,
          field: `${field}.id`,
        });
      }
      ids.add(part.id);
      if (!part.id.includes("-ANAT-")) {
        issues.push({
          code: "misclassified-requirement-id",
          message: `Requirement ID "${part.id}" does not belong to anatomy.`,
          field: `${field}.id`,
        });
      }
      if (!part.id.trim()) {
        issues.push({
          code: "empty-part-field",
          message: `${field}.id must not be empty.`,
          field: `${field}.id`,
        });
      }
      if (
        verified &&
        (part.evidence === undefined ||
          part.evidence.length === 0 ||
          part.evidence.some((value) => !value.trim()))
      ) {
        issues.push({
          code: "verified-missing-evidence",
          message: `${part.id} must name at least one non-empty anatomy test source before the Definition is verified.`,
          field: `${field}.evidence`,
        });
      }
    }
    if (!part.name.trim() || !part.description.trim()) {
      issues.push({
        code: "empty-part-field",
        message: `${field} must have a non-empty name and description.`,
        field,
      });
    }
    if (part.contractPart !== undefined && !contractParts.has(part.contractPart)) {
      issues.push({
        code: "unknown-contract-part",
        message: `Anatomy part "${part.name}" maps to unknown conceptual part "${part.contractPart}".`,
        field: `${field}.contractPart`,
      });
    }
    if (parts.has(part.name)) {
      issues.push({
        code: "duplicate-part-name",
        message: `Anatomy part "${part.name}" is declared more than once.`,
        field: `${field}.name`,
      });
    }
    const parent = part.directChildOf ?? part.within;
    if (parent !== undefined && !parts.has(parent)) {
      issues.push({
        code: "unknown-part-parent",
        message: `Anatomy part "${part.name}" references "${parent}" before it is declared.`,
        field: part.directChildOf === undefined ? `${field}.within` : `${field}.directChildOf`,
      });
    }
    parts.add(part.name);
  }

  return issues;
}

/** Throw when a Definition cannot serve as an unambiguous maintenance manifest. */
export function assertDefinition(definition: ComponentDefinition): void {
  const issues = validateDefinition(definition);
  if (issues.length === 0) return;
  throw new AggregateError(
    issues.map((issue) => new Error(issue.message)),
    `${definition.name} Definition validation failed with ${issues.length} issue${
      issues.length === 1 ? "" : "s"
    }.`,
  );
}

/**
 * Check anatomy in a browser-serializable function.
 *
 * All helpers intentionally live inside this function so Playwright can pass it
 * directly to `locator.evaluate`. This keeps browser contracts and local DOM
 * checks on one anatomy algorithm instead of reimplementing part matching.
 */
export function inspectAnatomy(root: Element, anatomy: readonly AnatomyPart[]): AnatomyIssue[] {
  function matches(element: Element, match: AnatomyMatch): boolean {
    switch (match.by) {
      case "root":
        return false;
      case "part":
        return (
          element.getAttribute("data-scope") === match.scope &&
          element.getAttribute("data-part") === match.part
        );
      case "role":
        return (
          element.getAttribute("role") === match.role &&
          (!match.roleDescription ||
            element.getAttribute("aria-roledescription") === match.roleDescription) &&
          (!match.nameFrom || Boolean(element.getAttribute(match.nameFrom)?.trim()))
        );
      case "element":
        return element.tagName.toLowerCase() === match.element;
      case "marker":
        return element.hasAttribute(match.attribute);
    }
  }

  function candidatesWithin(scope: Element, match: AnatomyMatch, includeSelf: boolean): Element[] {
    if (match.by === "root") return includeSelf ? [scope] : [];
    const found = Array.from(scope.querySelectorAll("*")).filter((element) =>
      matches(element, match),
    );
    return includeSelf && matches(scope, match) ? [scope, ...found] : found;
  }

  function isDescendantOf(element: Element, ancestor: Element): boolean {
    let parent = element.parentElement;
    while (parent) {
      if (parent === ancestor) return true;
      parent = parent.parentElement;
    }
    return false;
  }

  const issues: AnatomyIssue[] = [];
  const resolved = new Map<string, Element[]>();

  for (const [position, part] of anatomy.entries()) {
    const required = part.required ?? true;
    const parentName = part.directChildOf ?? part.within;
    let scope: Element = root;

    if (parentName !== undefined) {
      const parents = resolved.get(parentName);
      if (!parents) {
        issues.push({
          code: "unknown-parent",
          message: `Part "${part.name}" references "${parentName}", which is not declared before it.`,
          part: part.name,
        });
        continue;
      }
      const parent = parents[0];
      if (!parent) {
        if (required) {
          issues.push({
            code: "missing-parent",
            message: `Part "${part.name}" cannot be checked because "${parentName}" is missing.`,
            part: part.name,
          });
        }
        continue;
      }
      scope = parent;
    } else if (position > 0) {
      const [first] = anatomy;
      const roots = first ? resolved.get(first.name) : undefined;
      scope = roots?.[0] ?? root;
    }

    let found = candidatesWithin(scope, part.match, position === 0);

    if (part.outermost) {
      found = found.filter(
        (element) =>
          !found.some(
            (possibleAncestor) =>
              possibleAncestor !== element && isDescendantOf(element, possibleAncestor),
          ),
      );
    }

    const accepted =
      part.directChildOf === undefined
        ? found
        : found.filter((element) => element.parentElement === scope);

    if (part.directChildOf !== undefined) {
      // Once a repeated part has resolved at the required level, matching
      // descendants belong to that part's consumer-owned content. They are not
      // misplaced siblings. This lets a Carousel slide contain its own named
      // groups without those groups being mistaken for wrapped slides.
      const misplaced = found.filter(
        (element) =>
          element.parentElement !== scope &&
          !accepted.some((resolvedPart) => isDescendantOf(element, resolvedPart)),
      );
      const reported = part.multiple
        ? misplaced
        : accepted.length === 0
          ? misplaced.slice(0, 1)
          : [];
      for (const element of reported) {
        issues.push({
          code: "misplaced-part",
          message: `Part "${part.name}" must be an immediate child of "${part.directChildOf}". Remove the element wrapping it.`,
          part: part.name,
          element,
        });
      }
      if (reported.length > 0 && accepted.length === 0) {
        resolved.set(part.name, []);
        continue;
      }
    }

    if (accepted.length === 0 && required) {
      issues.push({
        code: "missing-part",
        message: `Part "${part.name}" was not found${
          parentName === undefined ? "" : ` inside "${parentName}"`
        }.`,
        part: part.name,
      });
    }

    // A singular part must resolve uniquely. More than one match means the
    // rendered structure no longer distinguishes this part from its siblings —
    // which is how a removed container surfaces when a parent and its children
    // share a role.
    const first = accepted[0];
    if (!part.multiple && accepted.length > 1 && first) {
      issues.push({
        code: "ambiguous-part",
        message: `Part "${part.name}" matched ${accepted.length} elements but is declared once. The structure no longer distinguishes it.`,
        part: part.name,
        element: first,
      });
      resolved.set(part.name, []);
      continue;
    }

    resolved.set(part.name, accepted);
  }

  return issues;
}

/**
 * Check that rendered DOM satisfies a Definition's functional anatomy.
 *
 * Parts resolve in declaration order. `directChildOf` rejects wrappers while
 * `within` permits them.
 */
export function verifyAnatomy(definition: ComponentDefinition, root: Element): AnatomyIssue[] {
  return inspectAnatomy(root, definition.anatomy);
}

/** Throw an AggregateError suitable for tests and explicit dev assertions. */
export function assertAnatomy(definition: ComponentDefinition, root: Element): void {
  const issues = verifyAnatomy(definition, root);
  if (issues.length === 0) return;
  throw new AggregateError(
    issues.map((issue) => new Error(issue.message)),
    `${definition.name} anatomy verification failed with ${issues.length} issue${
      issues.length === 1 ? "" : "s"
    }.`,
  );
}
