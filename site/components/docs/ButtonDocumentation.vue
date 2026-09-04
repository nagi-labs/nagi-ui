<script setup lang="ts">
import { NBadge, NTable } from "@nagi-labs/nagi-ui/components";
import { highlightRepositorySource, type TrustedShikiHtml } from "~/utils/highlight-source";
import CodeDisclosure from "./CodeDisclosure.vue";
import ComponentDocumentation from "./ComponentDocumentation.vue";
import InlineCode from "./InlineCode.vue";

interface Property {
  name: string;
  type: string;
  required: boolean;
}

const props = defineProps<{
  properties: Property[];
  basicGuidance: string;
  highlightedBlueprint: TrustedShikiHtml | "";
}>();

const columns = [
  { key: "name", label: "Property", rowHeader: true },
  { key: "type", label: "Value type" },
  { key: "kind", label: "Kind" },
  { key: "requirement", label: "Requirement" },
] as const;

const nativeAttributes = [
  { name: "form", type: "string", kind: "Native attribute" },
  { name: "name", type: "string", kind: "Native attribute" },
  { name: "value", type: "string", kind: "Native attribute" },
  { name: "autofocus", type: "boolean", kind: "Native attribute" },
  { name: "aria-*", type: "string", kind: "Global attribute" },
  { name: "data-*", type: "unknown", kind: "Global attribute" },
  { name: "id / title", type: "string", kind: "Global attribute" },
  { name: "class / style", type: "HTML attribute", kind: "Global attribute" },
] as const;

const styleAxisColumns = [
  { key: "property", label: "CSS property", rowHeader: true },
  { key: "values", label: "Values" },
  { key: "responsibility", label: "Controls" },
] as const;

const styleAxisRows = [
  {
    property: "--button-tone",
    values: "neutral (default), accent, danger",
    responsibility: "Semantic palette",
  },
  {
    property: "--button-appearance",
    values: "outlined (default), solid, ghost",
    responsibility: "Background, border, and foreground",
  },
  {
    property: "--button-shape",
    values: "rounded (default), square, pill",
    responsibility: "Corner geometry",
  },
  {
    property: "--button-size",
    values: "medium (default), small, large",
    responsibility: "Height, padding, and font size",
  },
] as const;

const rows = computed(() => [
  ...props.properties.map((property) => ({
    ...property,
    kind: "Component prop",
    requirement: property.required ? "Required" : "Optional",
  })),
  ...nativeAttributes.map((attribute) => ({
    ...attribute,
    required: false,
    requirement: "Optional",
  })),
]);

const basicUsage = `<script setup lang="ts">
import { NButton } from "@nagi-labs/nagi-ui/components";
</scr${"ipt"}>

<template>
  <main class="app-button-example">
    <section class="section">
      <h3>Sizes</h3>
      <div class="actions">
        <n-button class="n-button -compact">Small</n-button>
        <n-button class="n-button">Medium</n-button>
        <n-button class="n-button -spacious">Large</n-button>
      </div>
    </section>

    <section class="section">
      <h3>Style axes</h3>
      <div class="actions">
        <n-button class="n-button">Neutral outlined</n-button>
        <n-button class="n-button -primary">Accent solid</n-button>
        <n-button class="n-button -destructive">Danger outlined rounded</n-button>
      </div>
    </section>

    <section class="section">
      <h3>Disabled</h3>
      <div class="actions">
        <n-button class="n-button" disabled>Default</n-button>
        <n-button class="n-button -primary" disabled>Accent</n-button>
        <n-button class="n-button -destructive" disabled>Danger</n-button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.app-button-example {
  > .section {
    > .actions {
      > .n-button {
        &.-compact {
          --button-size: small;
        }

        &.-spacious {
          --button-size: large;
        }

        &.-primary {
          --button-tone: accent;
          --button-appearance: solid;
        }

        &.-destructive {
          --button-tone: danger;
          --button-appearance: outlined;
          --button-shape: rounded;
        }
      }
    }
  }
}
</style>`;

const controlApi = `interface ButtonControlProps {
  readonly disabled: boolean;
  readonly focusableWhenDisabled: boolean;
}

interface ButtonBindingProps {
  readonly disabled: boolean;
  readonly "aria-disabled": "true" | undefined;
  readonly onClickCapture: (event: MouseEvent) => void;
}

interface ButtonControl {
  readonly buttonProps: ButtonBindingProps;
}

function useButton(props: ButtonControlProps): ButtonControl;`;

const compiledCss = `/* authored */
.app-button-example {
  > .section {
    > .actions {
      > .n-button.-destructive {
        --button-tone: danger;
        --button-appearance: outlined;
        --button-shape: rounded;
      }
    }
  }
}

/* added at build time; the public declarations remain */
.app-button-example > .section > .actions > .n-button.-destructive {
  --_button-tone-color: var(--nagi-color-danger);
  --_button-tone-border: var(--nagi-color-danger);
  --_button-background: var(--nagi-color-surface);
  --_button-border-color: var(--_button-tone-border, var(--nagi-color-border));
  --_button-radius: var(--nagi-radius-control);
}`;

const highlightedBasic = useState<TrustedShikiHtml | "">("button-basic-source", () => "");
const highlightedControlApi = useState<TrustedShikiHtml | "">("button-control-api", () => "");
const highlightedCompiledCss = useState<TrustedShikiHtml | "">("button-compiled-css", () => "");

if (
  import.meta.server &&
  (!highlightedBasic.value || !highlightedControlApi.value || !highlightedCompiledCss.value)
) {
  highlightedBasic.value ||= await highlightRepositorySource(basicUsage, "vue");
  highlightedControlApi.value ||= await highlightRepositorySource(controlApi, "ts");
  highlightedCompiledCss.value ||= await highlightRepositorySource(compiledCss, "css");
}
</script>

<template>
  <component-documentation>
    <template #basic-meta>
      <n-badge
        label="Interactive"
        tone="success"
      />
    </template>
    <template #basic-description>
      <p class="text -guidance">{{ basicGuidance }}</p>
    </template>
    <template #basic>
      <component-preview component-name="Button" />
      <code-disclosure
        summary="View code"
        :html="highlightedBasic"
      />
    </template>

    <template #api>
      <n-table
        :rows="rows"
        :columns="columns"
        caption="Button API"
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

    <template #source>
      <p class="text">
        <inline-code>vp exec nagi-ui own button</inline-code> copies this canonical Vue SFC. The
        code below is loaded directly from the shipped Blueprint, not duplicated in the docs.
      </p>
      <code-disclosure
        summary="View code"
        :html="highlightedBlueprint"
      />
    </template>

    <section
      id="style-axes"
      class="section -style"
      aria-labelledby="button-style-heading"
    >
      <header class="header">
        <h2
          id="button-style-heading"
          class="title"
        >
          CSS style axes
        </h2>
      </header>
      <p class="text">
        Set each visual decision independently in consumer CSS. Tone supplies a palette; appearance
        decides how to use it; shape and size own separate geometry. The build compiler validates
        each literal value and adds the private variables consumed by Button.
      </p>
      <p class="text">
        The source example follows Nagi CSS: <inline-code>app-button-example</inline-code> is the
        <inline-code>ButtonExample.vue</inline-code> surface, <inline-code>n-button</inline-code> is
        the package boundary, and the leading-hyphen names are static context variants. The
        native-only <inline-code>button</inline-code> class is not placed on
        <inline-code>&lt;n-button&gt;</inline-code>.
      </p>
      <n-table
        :rows="styleAxisRows"
        :columns="styleAxisColumns"
        caption="Button CSS style axes"
        caption-hidden
      >
        <template #cell-property="{ value }">
          <div class="n-table-cell-content">
            <code class="code">{{ value }}</code>
          </div>
        </template>
      </n-table>
      <code-disclosure
        summary="See the mechanical expansion"
        :html="highlightedCompiledCss"
      />
    </section>

    <section
      id="behavior-helper"
      class="section -behavior"
      aria-labelledby="button-helper-heading"
    >
      <header class="header">
        <h2
          id="button-helper-heading"
          class="title"
        >
          useButton
        </h2>
      </header>
      <p class="text">
        The owned source passes its reactive props to <inline-code>useButton</inline-code> and binds
        the returned <inline-code>buttonProps</inline-code> to the native button.
      </p>
      <code-disclosure
        summary="View types"
        :html="highlightedControlApi"
      />
    </section>
  </component-documentation>
</template>
