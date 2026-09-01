<script setup lang="ts">
import { NTable } from "@nagi-labs/nagi-ui/components";
import type {
  AnatomyMatch,
  ComponentDefinition,
  DefinitionEntry,
  DefinitionStatement,
} from "@nagi-labs/nagi-ui";
import InlineCode from "./InlineCode.vue";

const props = defineProps<{ definition: ComponentDefinition }>();

const adoptions = computed(() => props.definition.adoptions ?? []);
const directReferences = computed(() => props.definition.references ?? []);

const guaranteeDescriptions = {
  semantics: "The meaning exposed to browsers and assistive technology.",
  state: "The states the component represents and how they are exposed.",
  interaction: "What happens in response to keyboard, pointer, and consumer events.",
  focus: "How the component participates in keyboard navigation and manages focus.",
  style: "The visual style axes, states, and system preferences the component supports.",
} as const;

const guarantees = computed(() => [
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
]);

const verificationStatus = computed(() =>
  props.definition.status === "verified" ? "Verified" : "Draft",
);

const guaranteeColumns = [
  { key: "requirement", label: "Requirement", rowHeader: true },
  { key: "evidence", label: "Executable evidence" },
] as const;

function guaranteeRows(entries: readonly DefinitionEntry[]) {
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

function requirementBasis(entry: DefinitionStatement) {
  if (entry.origin?.kind === "standard") {
    const adoption = props.definition.adoptions?.find(
      (candidate) => candidate.requirementSet === entry.origin?.requirementSet,
    );
    return `Adopted foundation · ${adoption?.title ?? entry.origin.requirementSet} · revision ${entry.origin.requirementSetVersion}`;
  }
  if (entry.origin?.kind === "nagi") {
    return `Nagi policy · ${entry.origin.policy} · revision ${entry.origin.policyVersion}`;
  }
  if (entry.origin?.kind === "reference") {
    const titles = entry.origin.referenceIds.map(
      (referenceId) =>
        props.definition.references?.find((reference) => reference.id === referenceId)?.title ??
        referenceId,
    );
    return `Reviewed source · ${titles.join(" + ")}`;
  }
  return `${entry.classification} · ${entry.source}`;
}

function profileEntries(profile: Readonly<Record<string, string | number | boolean>>) {
  return Object.entries(profile).map(([name, value]) => `${name}: ${String(value)}`);
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
  { key: "rule", label: "Machine rule" },
] as const;

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
          {{ definition.name }} {{ definition.version }} · {{ verificationStatus }}
        </small>
      </header>

      <p class="text">
        A maintenance map owned alongside the source. Anatomy runs against rendered DOM. The other
        sections link stable requirement IDs to executable tests; their prose does not become a test
        automatically. Running
        <inline-code>vp exec nagi-ui own {{ definition.name.toLowerCase() }}</inline-code> copies it
        with the Blueprint.
      </p>
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
        <p class="text">
          Component-specific sources remain pinned here when their Requirements are not shared by
          another component.
        </p>
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
        <p class="text">
          Existing platform requirements are reviewed, versioned by Nagi, and expanded into the
          complete requirements below. Upstream changes never alter this Definition automatically.
        </p>
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

          <div class="seg -foundation">
            <h5 class="title">Adopted profile</h5>
            <span class="text -profile">
              <inline-code
                v-for="entry in profileEntries(adoption.profile)"
                :key="entry"
                >{{ entry }}</inline-code
              >
            </span>
          </div>

          <div class="seg -foundation">
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
          </div>
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
        <p class="text">
          Component-specific locators combine a semantic match with its required structural scope.
        </p>
      </header>

      <p class="text">
        CSS classes are deliberately excluded because they are derived from the DOM being checked.
        <template v-if="constrained">
          An inserted wrapper violates an immediate-child requirement and produces
          <inline-code>misplaced-part</inline-code>.
        </template>
      </p>
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
          <span class="text -declared -status">{{ verificationStatus }}</span>
        </div>
        <p class="text">
          <template v-if="definition.status === 'verified'">
            Every Requirement names its provenance and in-repository evidence. Repository auditing
            checks that each source exists and contains the Requirement ID; the named test suites
            must still pass.
          </template>
          <template v-else>
            This draft remains reviewable, but it is not presented as a complete guarantee until
            every Requirement has traceable evidence and the corresponding suites pass.
          </template>
        </p>
      </header>

      <div class="unit -guarantees">
        <details
          v-for="group in guarantees"
          :key="group.key"
          class="details -guarantee"
          :open="group.key === 'semantics'"
        >
          <summary class="summary">
            <span class="text -group-name">{{ group.label }}</span>
            <span class="text -meta">{{ group.entries.length }} statements</span>
          </summary>
          <div class="seg -content">
            <p class="text -description">{{ group.description }}</p>
            <n-table
              class="n-table"
              :rows="guaranteeRows(group.entries)"
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

        > .seg.-foundation {
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

      > .details.-guarantee {
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
