<script setup lang="ts">
import { NBadge, NDatePicker, NTable } from "@nagi-labs/nagi-ui/components";
import type { BlueprintProperty } from "~/utils/blueprint-docs";
import { highlightRepositorySource, type TrustedShikiHtml } from "~/utils/highlight-source";
import CodeDisclosure from "./CodeDisclosure.vue";
import ComponentDocumentation from "./ComponentDocumentation.vue";
import ExampleFrame from "./ExampleFrame.vue";
import InlineCode from "./InlineCode.vue";

const props = defineProps<{
  properties: BlueprintProperty[];
  basicGuidance: string;
  highlightedBlueprint: TrustedShikiHtml | "";
  behaviorApis: readonly { names: readonly string[]; html: TrustedShikiHtml | "" }[];
}>();
const date = ref<string | null>("2026-08-28");
const constrainedDate = ref<string | null>(null);
const propertyColumns = [
  { key: "name", label: "Property", rowHeader: true },
  { key: "type", label: "Value type" },
  { key: "requirement", label: "Requirement" },
] as const;
const propertyRows = computed(() =>
  props.properties.map((property) => ({
    ...property,
    requirement: property.required ? "Required" : "Optional",
  })),
);
const modelColumns = [
  { key: "name", label: "Model", rowHeader: true },
  { key: "type", label: "Value type" },
  { key: "meaning", label: "Meaning" },
] as const;
const modelRows = [
  { name: "v-model", type: "string | null", meaning: "Committed ISO date." },
  { name: "v-model:open", type: "boolean", meaning: "Controlled native popover state." },
] as const;
const usage = `<script setup lang="ts">
import { NDatePicker } from "@nagi-labs/nagi-ui/components";
const date = ref<string | null>("2026-08-28");
</scr${"ipt"}>

<template>
  <n-date-picker v-model="date" label="Deployment date" name="deployment-date" />
</template>`;
const highlightedUsage = useState<TrustedShikiHtml | "">("date-picker-basic-source", () => "");
if (import.meta.server && !highlightedUsage.value) {
  highlightedUsage.value = await highlightRepositorySource(usage, "vue");
}
</script>

<template>
  <component-documentation>
    <!-- prettier-ignore -->
    <template #basic-meta>
      <n-badge
        label="Interactive"
        tone="success"
      />
    </template>
    <template #basic-description>
      <span class="text -guidance">{{ basicGuidance }}</span>
    </template>
    <template #basic>
      <example-frame>
        <n-date-picker
          v-model="date"
          label="Deployment date"
          name="deployment-date"
        />
        <output class="output">Model: {{ date ?? "null" }}</output>
      </example-frame>
      <code-disclosure
        summary="View code"
        :html="highlightedUsage"
      />
    </template>
    <template #api>
      <n-table
        :rows="propertyRows"
        :columns="propertyColumns"
        caption="DatePicker API"
        caption-hidden
      />
      <h3 class="title -subsection">Models</h3>
      <n-table
        :rows="modelRows"
        :columns="modelColumns"
        caption="DatePicker models"
        caption-hidden
      />
    </template>
    <template #source>
      <span class="text">
        <inline-code>vp exec nagi-ui own date-picker</inline-code> copies the shipped canonical Vue
        SFC.
      </span>
      <code-disclosure
        summary="View code"
        :html="highlightedBlueprint"
      />
    </template>
    <section
      class="section -constraints"
      aria-labelledby="date-picker-constraints-heading"
    >
      <header class="header">
        <h2
          id="date-picker-constraints-heading"
          class="title"
        >
          Constraints
        </h2>
      </header>
      <span class="text">
        Min, max, and unavailable ISO dates constrain both fields and calendar navigation.
      </span>
      <example-frame>
        <n-date-picker
          v-model="constrainedDate"
          label="Review date"
          min="2026-08-20"
          max="2026-09-10"
          :unavailable-dates="['2026-08-29', '2026-08-30']"
          required
        />
      </example-frame>
    </section>
    <section
      class="section -behavior"
      aria-labelledby="date-picker-behavior-heading"
    >
      <header class="header">
        <h2
          id="date-picker-behavior-heading"
          class="title"
        >
          Behavior API
        </h2>
      </header>
      <span class="text">
        The public composables keep field, calendar, popover, and native form state synchronized.
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
