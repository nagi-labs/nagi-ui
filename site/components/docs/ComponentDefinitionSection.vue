<script setup lang="ts">
import { NTable } from "@nagi-labs/nagi-ui/components";
import type {
  AnatomyMatch,
  ComponentDefinition,
  DefinitionEntry,
  DefinitionStatement,
} from "@nagi-labs/nagi-ui";
import type { DefinitionTestSection, GeneratedDefinitionTests } from "~/data/component-definitions";
import InlineCode from "./InlineCode.vue";

const props = defineProps<{
  definition: ComponentDefinition;
  testCatalog?: GeneratedDefinitionTests;
}>();

const contract = computed(() => props.definition.contract);
const implementation = computed(() => props.definition.implementation);
const adoptions = computed(() => (props.testCatalog ? [] : (props.definition.adoptions ?? [])));
const directReferences = computed(() =>
  props.testCatalog ? [] : (props.definition.references ?? []),
);
const testReferences = computed(() => props.testCatalog?.references ?? []);

function groupedRequirementIds(
  group: ComponentDefinition["contract"] | ComponentDefinition["implementation"],
) {
  if (!group) return new Set<string>();
  const local = [
    ...(group.semantics ?? []),
    ...(group.state ?? []),
    ...(group.interaction ?? []),
    ...(group.focus ?? []),
    ...(group.style ?? []),
  ].flatMap((entry) => (typeof entry === "string" ? [] : [entry.id]));
  const adopted = (group.adopts ?? []).flatMap(({ statements }) =>
    statements.map((statement) => statement.id),
  );
  return new Set([...local, ...adopted]);
}

const contractRequirementIds = computed(() => groupedRequirementIds(contract.value));
const implementationRequirementIds = computed(() => groupedRequirementIds(implementation.value));

const guaranteeDescriptions = {
  semantics: "The meaning exposed to browsers and assistive technology.",
  state: "The states the component represents and how they are exposed.",
  interaction: "What happens in response to keyboard, pointer, and consumer events.",
  focus: "How the component participates in keyboard navigation and manages focus.",
  style: "The visual style axes, states, and system preferences the component supports.",
} as const;

const guarantees = computed(
  () =>
    [
      {
        key: "semantics",
        label: "Semantics",
        description: guaranteeDescriptions.semantics,
        entries: props.definition.semantics,
      },
      {
        key: "state",
        label: "State",
        description: guaranteeDescriptions.state,
        entries: props.definition.state,
      },
      {
        key: "interaction",
        label: "Interaction",
        description: guaranteeDescriptions.interaction,
        entries: props.definition.interaction,
      },
      {
        key: "focus",
        label: "Focus",
        description: guaranteeDescriptions.focus,
        entries: props.definition.focus,
      },
      {
        key: "style",
        label: "Style",
        description: guaranteeDescriptions.style,
        entries: props.definition.style,
      },
    ] as const,
);

const browserEvidenceStatus = computed(() => {
  if (!props.testCatalog) return "Browser evidence not collected";
  const contractMatches =
    contract.value &&
    props.testCatalog.componentContract.id === contract.value.id &&
    props.testCatalog.componentContract.revision === contract.value.revision;
  const implementationMatches = implementation.value
    ? props.testCatalog.implementations.some(
        ({ id, version }) =>
          id === implementation.value?.id && version === implementation.value.version,
      )
    : props.testCatalog.implementations.length === 0;
  return props.testCatalog.status === "passing" && contractMatches && implementationMatches
    ? "Browser evidence passed"
    : "Browser evidence failed";
});

const contractAuditStatus = computed(() =>
  props.definition.status === "verified" &&
  browserEvidenceStatus.value === "Browser evidence passed"
    ? "Contract audit ready"
    : "Contract audit WIP",
);

const guaranteeColumns = [
  { key: "requirement", label: "Requirement", rowHeader: true },
  { key: "evidence", label: "Executable evidence" },
] as const;

function guaranteeRows(entries: readonly DefinitionEntry[], section: DefinitionTestSection) {
  if (props.testCatalog) {
    return props.testCatalog.requirements
      .filter((requirement) => requirement.sections.includes(section) && section !== "anatomy")
      .map((requirement) => ({
        requirement: requirement.title,
        id: requirement.key,
        statement: requirement.title,
        basis: `${requirement.layer === "component-contract" ? "Component Contract" : `Implementation · ${requirement.implementation?.id ?? "unknown"}`} · ${requirement.sections.map((facet) => facet[0]?.toUpperCase() + facet.slice(1)).join(" · ")} · collected from an ordinary ${requirement.runner} test`,
        source: undefined,
        evidence: [
          `${requirement.runner} · ${requirement.evidence.map(({ fixture }) => fixture).join(" + ")} · ${requirement.evidence.every(({ status }) => status === "passed") ? "passed" : "failed"}`,
        ],
      }));
  }

  return entries.map((entry, index) =>
    typeof entry === "string"
      ? {
          requirement: entry,
          id: String(index + 1),
          statement: entry,
          basis: "Unclassified",
          source: undefined,
          evidence: ["Not mapped"],
        }
      : {
          requirement: entry.text,
          id: entry.id,
          statement: entry.text,
          basis: requirementBasis(entry),
          source: entry.source,
          evidence: entry.evidence,
        },
  );
}

function guaranteeCount(entries: readonly DefinitionEntry[], section: DefinitionTestSection) {
  return guaranteeRows(entries, section).length;
}

function requirementBasis(entry: DefinitionStatement) {
  const layer = contractRequirementIds.value.has(entry.id)
    ? "Shared contract"
    : implementationRequirementIds.value.has(entry.id)
      ? "Implementation"
      : "Legacy flat Definition";
  if (entry.origin?.kind === "standard") {
    const adoption = props.definition.adoptions?.find(
      (candidate) => candidate.requirementSet === entry.origin?.requirementSet,
    );
    return `${layer} · Adopted foundation · ${adoption?.title ?? entry.origin.requirementSet} · revision ${entry.origin.requirementSetVersion}`;
  }
  if (entry.origin?.kind === "nagi") {
    return `${layer} · Nagi policy · ${entry.origin.policy} · revision ${entry.origin.policyVersion}`;
  }
  if (entry.origin?.kind === "reference") {
    const titles = entry.origin.referenceIds.map(
      (referenceId) =>
        props.definition.references?.find((reference) => reference.id === referenceId)?.title ??
        referenceId,
    );
    return `${layer} · Reviewed source · ${titles.join(" + ")}`;
  }
  return `${layer} · ${entry.classification} · ${entry.source}`;
}

function adoptionChoiceEntries(choices: Readonly<Record<string, string | number | boolean>>) {
  return Object.entries(choices).map(([name, value]) => `${name}: ${String(value)}`);
}

function textSegments(value: string) {
  return value
    .split(/(`[^`]+`)/)
    .filter(Boolean)
    .map((text) => ({
      code: text.startsWith("`") && text.endsWith("`"),
      text: text.startsWith("`") && text.endsWith("`") ? text.slice(1, -1) : text,
    }));
}

const anatomyColumns = [
  { key: "name", label: "Part", rowHeader: true },
  { key: "contractPart", label: "Contract concept" },
  { key: "rule", label: "Machine rule" },
] as const;

const apiColumns = [
  { key: "member", label: "Public API", rowHeader: true },
  { key: "meaning", label: "Guaranteed meaning" },
] as const;

const partColumns = [
  { key: "part", label: "Conceptual part", rowHeader: true },
  { key: "meaning", label: "User-facing purpose" },
] as const;

const apiRows = computed(() =>
  props.definition.api.map((member) => ({
    member: `${member.kind}: ${member.name}`,
    meaning: member.description,
  })),
);

const partRows = computed(() =>
  props.definition.parts.map((part) => ({
    part: `${part.name}${part.multiple ? " (repeated)" : ""}`,
    meaning: part.description,
  })),
);

const decisionColumns = [
  { key: "decision", label: "Decision", rowHeader: true },
  { key: "meaning", label: "Why this Blueprint chooses it" },
] as const;

const decisionRows = computed(() =>
  (implementation.value?.decisions ?? []).map((decision) => ({
    decision: `${decision.name}: ${String(decision.value)}`,
    meaning: decision.description,
  })),
);

function foundBy(match: AnatomyMatch) {
  switch (match.by) {
    case "root":
      return "component root";
    case "part":
      return `[data-scope="${match.scope}"][data-part="${match.part}"]`;
    case "role":
      return `[role="${match.role}"]${match.roleDescription ? `[aria-roledescription="${match.roleDescription}"]` : ""}${match.nameFrom ? `[${match.nameFrom}]` : ""}`;
    case "element":
      return `<${match.element}>`;
    case "marker":
      return `[${match.attribute}]`;
  }
}

function anatomyRule(part: ComponentDefinition["anatomy"][number]) {
  const match = foundBy(part.match);
  if (part.match.by === "root") return match;
  if (part.directChildOf !== undefined) return `${match}; direct child of ${part.directChildOf}`;
  if (part.within !== undefined) return `${match}; anywhere inside ${part.within}`;
  return `${match}; anywhere in component`;
}

const anatomyRows = computed(() =>
  props.definition.anatomy.map((part) => ({
    name: `${part.id ? `${part.id} · ` : ""}${part.name}${part.multiple ? " (repeated)" : ""}`,
    description: part.description,
    contractPart: part.contractPart ?? "Implementation-only",
    rule: anatomyRule(part),
  })),
);

const constrained = computed(() =>
  props.definition.anatomy.some((part) => part.directChildOf !== undefined),
);
</script>

<template>
  <div class="site-component-definition-section">
    <section
      class="section -overview"
      aria-labelledby="component-definition-heading"
    >
      <header class="header">
        <h2
          id="component-definition-heading"
          class="title"
        >
          Definition
        </h2>
        <small class="note">
          {{ definition.name }} {{ definition.version }} · {{ contractAuditStatus }} ·
          {{ browserEvidenceStatus }}
        </small>
      </header>

      <span class="text">
        The maintenance view for this concrete component: a portable Contract plus one
        Implementation.
        <template v-if="testCatalog">
          Requirement IDs come from named test functions and descriptions come from Playwright test
          titles. The browser evidence status reports only those recorded assertions; Contract audit
          maturity separately reports whether the Contract boundary and sufficiency review is
          complete.
        </template>
        <template v-else>
          This component still uses the compatibility Definition manifest while its test catalog is
          WIP.
        </template>
        Running
        <inline-code>vp exec nagi-ui own {{ definition.name.toLowerCase() }}</inline-code> copies it
        with the Blueprint.
      </span>
    </section>

    <section
      v-if="testReferences.length"
      class="section -foundations"
      aria-labelledby="definition-suite-references-heading"
    >
      <header class="header -subsection">
        <div class="unit -heading">
          <h3
            id="definition-suite-references-heading"
            class="title"
          >
            Suite references
          </h3>
          <span class="text -status">Authoring context</span>
        </div>
        <span class="text">
          These references are collected once from Component Contract or Implementation suite
          annotations. They explain the design baseline; the test assertions are the executable
          evidence.
        </span>
      </header>
      <ul class="list -sources">
        <li
          v-for="reference in testReferences"
          :key="`${reference.layer}:${reference.url}`"
          class="item"
        >
          <a
            class="link"
            :href="reference.url"
            >{{ reference.url }}</a
          >
          <small class="note">{{ reference.layer }}</small>
        </li>
      </ul>
    </section>

    <section
      v-if="contract && implementation"
      class="section -composition"
      aria-labelledby="definition-composition-heading"
    >
      <header class="header -subsection">
        <div class="unit -heading">
          <h3
            id="definition-composition-heading"
            class="title"
          >
            Definition = Component Contract + Implementation
          </h3>
          <span class="text -status">Separated</span>
        </div>
        <span class="text">
          These are not runtime variants. The Component Contract records what every compatible
          implementation must preserve. The Implementation records how this source provides it. An
          owned or Motion implementation may replace the mechanism while retaining the same Contract
          revision and supplying its own Implementation evidence.
        </span>
      </header>

      <div class="unit -composition">
        <article class="article">
          <h4 class="title">Component Contract · shared compatibility</h4>
          <span class="text">{{ contract.description }}</span>
          <small class="note">
            <inline-code>{{ contract.id }}</inline-code> revision {{ contract.revision }}
          </small>
        </article>

        <article class="article">
          <h4 class="title">Implementation · how this source provides it</h4>
          <span class="text">{{ implementation.description }}</span>
          <small class="note">
            {{ implementation.title }} · <inline-code>{{ implementation.id }}</inline-code> revision
            {{ implementation.version }} · {{ implementation.strategy }}
          </small>
        </article>
      </div>

      <n-table
        v-if="decisionRows.length"
        class="n-table"
        :rows="decisionRows"
        :columns="decisionColumns"
        :caption="`${definition.name} Blueprint implementation decisions`"
        caption-hidden
      >
        <template #cell-decision="{ value }">
          <inline-code>{{ value }}</inline-code>
        </template>
      </n-table>

      <n-table
        v-if="apiRows.length"
        class="n-table"
        :rows="apiRows"
        :columns="apiColumns"
        :caption="`${definition.name} portable public API`"
        caption-hidden
      >
        <template #cell-member="{ value }">
          <inline-code>{{ value }}</inline-code>
        </template>
      </n-table>

      <n-table
        v-if="partRows.length"
        class="n-table"
        :rows="partRows"
        :columns="partColumns"
        :caption="`${definition.name} conceptual parts`"
        caption-hidden
      >
        <template #cell-part="{ value }">
          <inline-code>{{ value }}</inline-code>
        </template>
      </n-table>
    </section>

    <section
      v-if="directReferences.length"
      class="section -foundations"
      aria-labelledby="definition-component-sources-heading"
    >
      <header class="header -subsection">
        <div class="unit -heading">
          <h3
            id="definition-component-sources-heading"
            class="title"
          >
            Component sources
          </h3>
          <span class="text -status">Reviewed locally</span>
        </div>
        <span class="text">
          Component-specific sources remain pinned here when their Requirements are not shared by
          another component.
        </span>
      </header>
      <ul class="list -sources">
        <li
          v-for="reference in directReferences"
          :key="reference.id"
          class="item"
        >
          <a
            class="link"
            :href="reference.url"
            >{{ reference.title }}</a
          >
          <small class="note">
            {{ reference.revision }} · reviewed {{ reference.reviewedAt }}
          </small>
        </li>
      </ul>
    </section>

    <section
      v-if="adoptions.length"
      class="section -foundations"
      aria-labelledby="definition-foundations-heading"
    >
      <header class="header -subsection">
        <div class="unit -heading">
          <h3
            id="definition-foundations-heading"
            class="title"
          >
            Adopted foundations
          </h3>
          <span class="text -status">Locally versioned</span>
        </div>
        <span class="text">
          Existing platform requirements are reviewed, versioned by Nagi, and expanded into the
          complete requirements below. Upstream changes never alter this Definition automatically.
        </span>
      </header>

      <div class="unit -foundations">
        <article
          v-for="adoption in adoptions"
          :key="adoption.requirementSet"
          class="article"
        >
          <header class="header">
            <h4 class="title">{{ adoption.title }}</h4>
            <small class="note">Revision {{ adoption.requirementSetVersion }}</small>
          </header>

          <section class="section">
            <h5 class="title">Adopted choices</h5>
            <span class="text -profile">
              <inline-code
                v-for="entry in adoptionChoiceEntries(adoption.profile)"
                :key="entry"
                >{{ entry }}</inline-code
              >
            </span>
          </section>

          <section class="section">
            <h5 class="title">Reviewed sources</h5>
            <ul class="list -sources">
              <li
                v-for="reference in adoption.references"
                :key="reference.id"
                class="item"
              >
                <a
                  class="link"
                  :href="reference.url"
                  >{{ reference.title }}</a
                >
                <small class="note">
                  {{ reference.revision }} · reviewed {{ reference.reviewedAt }}
                </small>
              </li>
            </ul>
          </section>
        </article>
      </div>
    </section>

    <section
      class="section -anatomy"
      aria-labelledby="definition-anatomy-heading"
    >
      <header class="header -subsection">
        <div class="unit -heading">
          <h3
            id="definition-anatomy-heading"
            class="title"
          >
            Executable anatomy
          </h3>
          <span class="text -status">Executed in browser contracts</span>
        </div>
        <span class="text">
          The Implementation maps portable concepts to concrete DOM locators and structural scope.
          Parts without a Component Contract concept exist only to support this implementation.
        </span>
      </header>

      <span class="text">
        CSS classes are deliberately excluded because they are derived from the DOM being checked.
        <template v-if="constrained">
          An inserted wrapper violates an immediate-child requirement and produces
          <inline-code>misplaced-part</inline-code>.
        </template>
      </span>
      <n-table
        class="n-table"
        :rows="anatomyRows"
        :columns="anatomyColumns"
        :caption="`${definition.name} anatomy`"
        caption-hidden
      >
        <template #cell-name="{ row, value }">
          <span class="text -part-name">{{ value }}</span>
          <small class="note -part-description">{{ row.description }}</small>
        </template>
        <template #cell-contractPart="{ value }">
          <inline-code>{{ value }}</inline-code>
        </template>
        <!-- prettier-ignore -->
        <template #cell-rule="{ value }">
          <inline-code>{{ value }}</inline-code>
        </template>
      </n-table>
    </section>

    <section
      class="section -documented"
      aria-labelledby="definition-documented-heading"
    >
      <header class="header -subsection">
        <div class="unit -heading">
          <h3
            id="definition-documented-heading"
            class="title"
          >
            Behavior requirements
          </h3>
          <span class="text -declared -status">{{ browserEvidenceStatus }}</span>
        </div>
        <span class="text">
          <template v-if="testCatalog">
            Each row below is collected from a normal Playwright test. The named function supplies
            the stable ID, native tags attach one or more Definition facets, the test title supplies
            the description, and the test body supplies the evidence. A meaningful guarantee can
            therefore appear under several headings without becoming several Requirements.
          </template>
          <template v-else>
            This compatibility view still maps manually authored Requirements to repository paths
            while its runner-native catalog is being migrated. It is not presented as verified.
          </template>
        </span>
      </header>

      <div class="unit -guarantees">
        <details
          v-for="group in guarantees"
          :key="group.key"
          class="details"
          :open="group.key === 'semantics'"
        >
          <summary class="summary">
            <span class="text -group-name">{{ group.label }}</span>
            <span class="text -meta"> {{ guaranteeCount(group.entries, group.key) }} tests </span>
          </summary>
          <div class="seg -content">
            <span class="text -description">{{ group.description }}</span>
            <n-table
              class="n-table"
              :rows="guaranteeRows(group.entries, group.key)"
              :columns="guaranteeColumns"
              :caption="`${definition.name} ${group.label.toLowerCase()} statements`"
              caption-hidden
            >
              <template #cell-requirement="{ row }">
                <span class="text -requirement-id">{{ row.id }}</span>
                <span class="text -requirement-statement">
                  <template
                    v-for="(segment, index) in textSegments(String(row.statement))"
                    :key="index"
                  >
                    <inline-code v-if="segment.code">{{ segment.text }}</inline-code>
                    <template v-else>{{ segment.text }}</template>
                  </template>
                </span>
                <small class="note -basis">{{ row.basis }}</small>
                <small
                  v-if="row.source"
                  class="note -authority"
                  >{{ row.source }}</small
                >
              </template>
              <template #cell-evidence="{ value }">
                <span class="text -evidence">
                  <inline-code
                    v-for="source in value"
                    :key="source"
                    >{{ source }}</inline-code
                  >
                </span>
              </template>
            </n-table>
          </div>
        </details>
      </div>
    </section>
  </div>
</template>

<style scoped>
.site-component-definition-section {
  --local-status-radius: 999px;

  display: grid;
  gap: calc(2 * var(--n-space-8));

  > .section {
    display: grid;
    gap: var(--n-space-7);

    > .header {
      display: flex;
      align-items: end;
      justify-content: space-between;

      > .title {
        margin: 0;
        color: var(--site-color-ink-strong);
        font-size: var(--n-font-size-6);
      }

      > .note {
        color: var(--nagi-color-text-muted);
        font-family: var(--site-font-code);
      }
    }

    > .title {
      margin: 0;
      color: var(--site-color-ink-strong);
      font-size: var(--n-font-size-6);
    }

    > .text {
      max-inline-size: 54rem;
      margin: 0;
      color: var(--nagi-color-text-muted);
    }

    > .header.-subsection {
      display: grid;
      gap: var(--n-space-3);

      > .unit.-heading {
        display: flex;
        flex-wrap: wrap;
        gap: var(--n-space-3);
        align-items: center;

        > .title {
          margin: 0;
          color: var(--site-color-ink-strong);
          font-size: var(--n-font-size-6);
        }

        > .text.-status {
          padding: var(--n-space-1) var(--n-space-3);
          border: var(--n-border-width-1) solid var(--nagi-color-border);
          border-radius: var(--local-status-radius);
          background: var(--nagi-color-surface-accent);
          color: var(--nagi-color-text);
          font-size: var(--n-font-size-2);
          font-weight: 700;

          &.-declared {
            border-color: var(--nagi-color-border-muted);
            background: var(--nagi-color-surface);
            color: var(--nagi-color-text-muted);
          }
        }
      }

      > .text {
        max-inline-size: 54rem;
        margin: 0;
        color: var(--nagi-color-text-muted);
      }
    }

    :deep(.text.-part-name),
    :deep(.note.-part-description) {
      display: block;
    }

    > .unit.-foundations {
      display: grid;
      gap: var(--n-space-5);

      > .article {
        display: grid;
        gap: var(--n-space-6);
        padding: var(--n-space-7);
        border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
        border-radius: var(--nagi-radius-control);
        background: var(--nagi-color-surface);

        > .header {
          display: flex;
          flex-wrap: wrap;
          gap: var(--n-space-3);
          align-items: center;
          justify-content: space-between;

          > .title {
            margin: 0;
            color: var(--site-color-ink-strong);
            font-size: var(--n-font-size-5);
          }

          > .note {
            color: var(--nagi-color-text-muted);
          }
        }

        > .section {
          display: grid;
          gap: var(--n-space-3);

          > .title {
            margin: 0;
            color: var(--nagi-color-text-muted);
            font-size: var(--n-font-size-2);
            text-transform: uppercase;
          }

          > .text.-profile {
            display: flex;
            flex-wrap: wrap;
            gap: var(--n-space-2);
          }

          > .list.-sources {
            display: grid;
            gap: var(--n-space-3);
            padding: 0;
            margin: 0;
            list-style: none;

            > .item {
              display: grid;
              gap: var(--n-space-1);

              > .link {
                color: var(--nagi-color-text);
              }

              > .note {
                color: var(--nagi-color-text-muted);
              }
            }
          }
        }
      }
    }

    > .unit.-composition {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
      gap: var(--n-space-5);

      > .article {
        display: grid;
        gap: var(--n-space-3);
        padding: var(--n-space-6);
        border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
        border-radius: var(--nagi-radius-control);
        background: var(--nagi-color-surface);

        > .title,
        > .text {
          margin: 0;
        }

        > .text,
        > .note {
          color: var(--nagi-color-text-muted);
        }
      }
    }

    > .list.-sources {
      display: grid;
      gap: var(--n-space-3);
      padding: 0;
      margin: 0;
      list-style: none;

      > .item {
        display: grid;
        gap: var(--n-space-1);

        > .link {
          color: var(--nagi-color-text);
        }

        > .note {
          color: var(--nagi-color-text-muted);
        }
      }
    }

    :deep(.note.-part-description) {
      max-inline-size: 20rem;
      margin-block-start: var(--n-space-2);
      color: var(--nagi-color-text-muted);
      font-weight: 400;
    }

    > .unit.-guarantees {
      display: grid;
      gap: calc(2 * var(--n-space-8));

      > .details {
        border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
        border-radius: var(--nagi-radius-control);
        background: var(--nagi-color-surface);

        > .summary {
          display: flex;
          justify-content: space-between;
          padding: var(--n-space-5) var(--n-space-7);
          cursor: pointer;

          > .text.-group-name {
            color: var(--site-color-ink-strong);
            font-weight: 700;
          }

          > .text.-meta {
            color: var(--nagi-color-text-muted);
            font-size: var(--n-font-size-2);
          }
        }

        > .seg.-content {
          display: grid;
          gap: var(--n-space-5);
          padding: 0 var(--n-space-7) var(--n-space-7);

          > .text.-description {
            max-inline-size: 48rem;
            margin: 0;
            color: var(--nagi-color-text-muted);
          }
        }

        :deep(.text.-requirement-id),
        :deep(.text.-requirement-statement),
        :deep(.note.-basis),
        :deep(.note.-authority),
        :deep(.text.-evidence) {
          display: block;
        }

        :deep(.text.-requirement-id) {
          margin-block-end: var(--n-space-2);
          color: var(--nagi-color-text-muted);
          font-family: var(--site-font-code);
          font-size: var(--n-font-size-2);
        }

        :deep(.text.-requirement-statement) {
          max-inline-size: 48rem;
          color: var(--nagi-color-text);
          font-weight: 400;
        }

        :deep(.note.-basis) {
          margin-block-start: var(--n-space-3);
          color: var(--nagi-color-text-muted);
          font-weight: 400;
        }

        :deep(.note.-authority) {
          margin-block-start: var(--n-space-1);
          color: var(--nagi-color-text-muted);
          font-weight: 400;
        }

        :deep(.text.-evidence) {
          display: grid;
          gap: var(--n-space-2);
          min-inline-size: 15rem;
        }
      }
    }
  }
}
</style>
