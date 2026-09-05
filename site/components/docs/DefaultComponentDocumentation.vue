<script setup lang="ts">
import { NBadge, NTable } from "@nagi-labs/nagi-ui/components";
import type { BlueprintChannel, BlueprintProperty } from "~/utils/blueprint-docs";
import { highlightRepositorySource, type TrustedShikiHtml } from "~/utils/highlight-source";
import CodeDisclosure from "./CodeDisclosure.vue";
import ComponentDocumentation from "./ComponentDocumentation.vue";
import InlineCode from "./InlineCode.vue";

const props = withDefaults(
  defineProps<{
    name: string;
    slug: string;
    basicGuidance: string;
    properties: BlueprintProperty[];
    models: BlueprintChannel[];
    events: BlueprintChannel[];
    documentedSlots: BlueprintChannel[];
    blueprintSources: readonly {
      path: string;
      kind: "public-component" | "internal-component" | "owned-helper";
      html: TrustedShikiHtml | "";
    }[];
    usage: string;
    nativeAttributeTarget?: string;
    behaviorApis: readonly { names: readonly string[]; html: TrustedShikiHtml | "" }[];
    componentDependencies?: readonly string[];
  }>(),
  { nativeAttributeTarget: undefined, componentDependencies: () => [] },
);

const staticComponents = new Set([
  "Avatar",
  "Badge",
  "Card",
  "EmptyState",
  "Kbd",
  "Meter",
  "Progress",
  "Separator",
  "Skeleton",
  "Spinner",
  "Table",
]);
const interactive = computed(() => !staticComponents.has(props.name));

const sourceKindLabels = {
  "public-component": "Public component",
  "internal-component": "Internal component",
  "owned-helper": "Owned helper",
} as const;

const columns = [
  { key: "name", label: "Property", rowHeader: true },
  { key: "type", label: "Value type" },
  { key: "kind", label: "Kind" },
  { key: "requirement", label: "Requirement" },
] as const;

const globalAttributes = [
  { name: "aria-*", type: "string", kind: "Global attribute", requirement: "Optional" },
  { name: "data-*", type: "unknown", kind: "Global attribute", requirement: "Optional" },
  { name: "id / title", type: "string", kind: "Global attribute", requirement: "Optional" },
  {
    name: "class / style",
    type: "HTML attribute",
    kind: "Global attribute",
    requirement: "Optional",
  },
] as const;

const channelColumns = [
  { key: "name", label: "Name", rowHeader: true },
  { key: "type", label: "Value type" },
] as const;

const rows = computed(() => [
  ...props.properties.map((property) => ({
    ...property,
    kind: "Component prop",
    requirement: property.required ? "Required" : "Optional",
  })),
  ...globalAttributes,
]);

const highlightedUsage = useState<TrustedShikiHtml | "">(
  `component-basic-source:${props.slug}`,
  () => "",
);
if (import.meta.server && !highlightedUsage.value) {
  highlightedUsage.value = await highlightRepositorySource(props.usage, "vue");
}
</script>

<template>
  <component-documentation>
    <template #basic-meta>
      <n-badge
        :label="interactive ? 'Interactive' : 'Static'"
        :tone="interactive ? 'success' : 'neutral'"
      />
    </template>
    <template #basic-description>
      <span class="text -guidance">{{ basicGuidance }}</span>
    </template>
    <template #basic>
      <component-preview
        :component-name="name"
        :properties="properties"
      />
      <code-disclosure
        summary="View code"
        :html="highlightedUsage"
      />
    </template>

    <template #api>
      <n-table
        :rows="rows"
        :columns="columns"
        :caption="`${name} API`"
        caption-hidden
      >
        <template #cell-name="{ value }">
          <div class="n-table-cell-content">
            <code class="code">{{ value }}</code>
          </div>
        </template>
        <template #cell-type="{ value }">
          <div class="n-table-cell-content">
            <code class="code">{{ value }}</code>
          </div>
        </template>
      </n-table>
      <template v-if="models.length">
        <h3 class="title -subsection">Models</h3>
        <n-table
          :rows="models"
          :columns="channelColumns"
          :caption="`${name} models`"
          caption-hidden
        >
          <template #cell-name="{ value }">
            <div class="n-table-cell-content">
              <code class="code">{{ value }}</code>
            </div>
          </template>
          <template #cell-type="{ value }">
            <div class="n-table-cell-content">
              <code class="code">{{ value }}</code>
            </div>
          </template>
        </n-table>
      </template>
      <template v-if="documentedSlots.length">
        <h3 class="title -subsection">Slots</h3>
        <n-table
          :rows="documentedSlots"
          :columns="channelColumns"
          :caption="`${name} slots`"
          caption-hidden
        >
          <template #cell-name="{ value }">
            <div class="n-table-cell-content">
              <code class="code">{{ value }}</code>
            </div>
          </template>
        </n-table>
      </template>
      <template v-if="events.length">
        <h3 class="title -subsection">Events</h3>
        <n-table
          :rows="events"
          :columns="channelColumns"
          :caption="`${name} events`"
          caption-hidden
        >
          <template #cell-name="{ value }">
            <div class="n-table-cell-content">
              <code class="code">{{ value }}</code>
            </div>
          </template>
          <template #cell-type="{ value }">
            <div class="n-table-cell-content">
              <code class="code">{{ value }}</code>
            </div>
          </template>
        </n-table>
      </template>
      <span
        v-if="nativeAttributeTarget"
        class="text"
      >
        Attribute destination: {{ nativeAttributeTarget }}.
      </span>
    </template>

    <template #source>
      <span class="text">
        <inline-code>vp exec nagi-ui own {{ slug }}</inline-code> copies an editable bundle. Its
        connected implementation files are shown below; the Definition is documented separately.
        Only files marked <strong>Public component</strong> are package component exports; internal
        components and helpers are owned implementation details.
      </span>
      <span
        v-if="componentDependencies.length"
        class="text"
      >
        Component dependency owned with this Blueprint:
        <template
          v-for="dependency in componentDependencies"
          :key="dependency"
        >
          <a
            class="link"
            :href="useSitePath(`/components/${dependency}/`)"
            >{{ dependency }}</a
          >
        </template>
        . The CLI copies it recursively and keeps this relative import connected to the owned file.
      </span>
      <code-disclosure
        v-for="source in blueprintSources"
        :key="source.path"
        :summary="`View ${source.path} · ${sourceKindLabels[source.kind]}`"
        :html="source.html"
      />
    </template>

    <section
      v-if="behaviorApis.length"
      class="section"
      :aria-labelledby="`${slug}-behavior-heading`"
    >
      <header class="header">
        <h2
          :id="`${slug}-behavior-heading`"
          class="title"
        >
          Behavior API
        </h2>
      </header>
      <span class="text">
        The owned source uses these public composables. Their exported input, return types, and
        implementation below are loaded from the package source.
      </span>
      <code-disclosure
        v-for="api in behaviorApis"
        :key="api.names.join('-')"
        :summary="`View ${api.names.join(', ')}`"
        :html="api.html"
      />
    </section>
  </component-documentation>
</template>
