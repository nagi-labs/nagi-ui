<script setup lang="ts">
import { NButton } from "@nagi-labs/nagi-ui/components";
import ButtonDocumentation from "~/components/docs/ButtonDocumentation.vue";
import ComponentDefinitionSection from "~/components/docs/ComponentDefinitionSection.vue";
import ComponentDefinitionWipSection from "~/components/docs/ComponentDefinitionWipSection.vue";
import DatePickerDocumentation from "~/components/docs/DatePickerDocumentation.vue";
import DefaultComponentDocumentation from "~/components/docs/DefaultComponentDocumentation.vue";
import { componentDefinition, componentDefinitionTests } from "~/data/component-definitions";
import { componentExampleSource } from "~/data/component-examples";
import { componentNativeTarget } from "~/data/component-native-targets";
import { componentDocument, componentDocuments } from "~/data/components";
import {
  blueprintComponentDependencies,
  blueprintEvents,
  blueprintModels,
  blueprintProperties,
  blueprintSlots,
  loadBlueprintBehaviorApis,
  loadBlueprintSources,
} from "~/utils/blueprint-docs";
import { highlightRepositorySource, type TrustedShikiHtml } from "~/utils/highlight-source";

const route = useRoute();
const slug = computed(() => String(route.params.component));
const entry = computed(() => componentDocument(slug.value));
if (!entry.value) throw createError({ statusCode: 404, statusMessage: "Component not found" });

const position = computed(() => componentDocuments.findIndex((item) => item.slug === slug.value));
const previous = computed(() => componentDocuments[position.value - 1]);
const next = computed(() => componentDocuments[position.value + 1]);
const blueprintSources = await loadBlueprintSources(entry.value.name);
const blueprintSource = blueprintSources[0]?.source ?? "";
const componentDependencies = blueprintComponentDependencies(blueprintSource);
const behaviorApis = await loadBlueprintBehaviorApis(blueprintSource);
const highlightedBlueprintSources = useState<TrustedShikiHtml[]>(
  `blueprint-sources:${entry.value.slug}`,
  () => [],
);
const highlightedBehaviorApis = useState<TrustedShikiHtml[]>(
  `behavior-api:${entry.value.slug}`,
  () => [],
);
if (import.meta.server && highlightedBlueprintSources.value.length !== blueprintSources.length) {
  highlightedBlueprintSources.value = await Promise.all(
    blueprintSources.map((file) =>
      highlightRepositorySource(file.source, file.path.endsWith(".vue") ? "vue" : "ts"),
    ),
  );
}
if (import.meta.server && highlightedBehaviorApis.value.length !== behaviorApis.length) {
  highlightedBehaviorApis.value = await Promise.all(
    behaviorApis.map((api) => highlightRepositorySource(api.source, "ts")),
  );
}
const documentedBehaviorApis = computed(() =>
  behaviorApis.map((api, index) => ({
    names: api.names,
    html: highlightedBehaviorApis.value[index] ?? "",
  })),
);
const highlightedBlueprint = computed(() => highlightedBlueprintSources.value[0] ?? "");
const documentedBlueprintSources = computed(() =>
  blueprintSources.map((file, index) => ({
    path: file.path,
    kind: file.kind,
    html: highlightedBlueprintSources.value[index] ?? "",
  })),
);

const properties = blueprintProperties(blueprintSource);
const models = blueprintModels(blueprintSource);
const events = blueprintEvents(blueprintSource);
const slots = blueprintSlots(blueprintSource);
const usage = computed(() => componentExampleSource(entry.value.name));
const nativeAttributeTarget = computed(() => componentNativeTarget(entry.value.name));
const definition = computed(() => componentDefinition(entry.value?.name ?? ""));
const definitionTests = computed(() => componentDefinitionTests(entry.value?.name ?? ""));
useHead({ title: () => entry.value?.name ?? "Component" });
</script>

<template>
  <div
    v-if="entry"
    class="site-[component]"
  >
    <page-heading
      :eyebrow="entry.category"
      :title="entry.name"
      :description="entry.description"
    >
      <n-button @click="navigateTo('/components/')">All components</n-button>
    </page-heading>

    <button-documentation
      v-if="entry.name === 'Button'"
      :properties="properties"
      :basic-guidance="entry.basicGuidance"
      :highlighted-blueprint="highlightedBlueprint"
    />
    <date-picker-documentation
      v-else-if="entry.name === 'DatePicker'"
      :properties="properties"
      :basic-guidance="entry.basicGuidance"
      :highlighted-blueprint="highlightedBlueprint"
      :behavior-apis="documentedBehaviorApis"
      :component-dependencies="componentDependencies"
    />
    <default-component-documentation
      v-else
      :name="entry.name"
      :slug="entry.slug"
      :basic-guidance="entry.basicGuidance"
      :properties="properties"
      :models="models"
      :events="events"
      :documented-slots="slots"
      :blueprint-sources="documentedBlueprintSources"
      :usage="usage"
      :native-attribute-target="nativeAttributeTarget"
      :behavior-apis="documentedBehaviorApis"
      :component-dependencies="componentDependencies"
    />

    <component-definition-section
      v-if="definition"
      :definition="definition"
      :test-catalog="definitionTests"
    />
    <component-definition-wip-section
      v-else
      :name="entry.name"
    />

    <nav
      class="nav -adjacent"
      aria-label="Adjacent components"
    >
      <a
        v-if="previous"
        class="link"
        :href="useSitePath(`/components/${previous.slug}`)"
      >
        <small class="note">Previous</small><strong class="strong">← {{ previous.name }}</strong>
      </a>
      <span
        v-else
        class="unit"
      />
      <a
        v-if="next"
        class="link"
        :href="useSitePath(`/components/${next.slug}`)"
      >
        <small class="note">Next</small><strong class="strong">{{ next.name }} →</strong>
      </a>
    </nav>
  </div>
</template>

<style scoped>
.site-\[component\] {
  display: grid;
  gap: calc(2 * var(--n-space-8));
  max-inline-size: 74rem;
  inline-size: 100%;
  padding: calc(3 * var(--n-space-8)) max(var(--n-space-8), 4vw);

  > .nav.-adjacent {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--n-space-5);
    padding-block-start: var(--n-space-8);
    border-block-start: var(--n-border-width-1) solid var(--nagi-color-border-muted);

    > .link {
      display: grid;
      gap: var(--n-space-2);
      padding: var(--n-space-6);
      border-radius: var(--n-radius-2);
      color: var(--nagi-color-text);
      text-decoration: none;

      &:last-child {
        justify-items: end;
        text-align: end;
      }
      &:hover {
        background: var(--nagi-color-surface-active);
      }
      > .note {
        color: var(--nagi-color-text-muted);
        font-size: var(--n-font-size-2);
      }
    }
  }
}
</style>
