export const actionsFormsExamples: Readonly<Record<string, string>> = {
  Button: `<script setup lang="ts">
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
        <n-button class="n-button" focusable-when-disabled aria-describedby="button-disabled-note">Unavailable action</n-button>
      </div>
      <p id="button-disabled-note">The last button remains discoverable by keyboard.</p>
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
</style>`,
  ButtonGroup: `<script setup lang="ts">
import { NButton, NButtonGroup } from "@nagi-labs/nagi-ui/components";
</scr${"ipt"}>
<template>
  <main class="app-button-group-example">
    <n-button-group
      class="n-button-group"
      label="History"
      orientation="horizontal"
    >
      <n-button class="n-button-group-content">Back</n-button>
      <n-button class="n-button-group-content">Forward</n-button>
    </n-button-group>
  </main>
</template>
<style scoped>
.app-button-group-example {
  > .n-button-group {
    .n-button-group-content {
      --button-size: small;
    }
  }
}
</style>`,
  Toggle: `<script setup lang="ts">
import { NToggle } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const pressed = ref(true);
</scr${"ipt"}>
<template>
  <n-toggle v-model="pressed">Bold</n-toggle>
  <output>Pressed: {{ pressed }}</output>
</template>`,
  ToggleGroup: `<script setup lang="ts">
import { NToggleGroup } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const selected = ref<readonly string[]>(["alpha"]);
const items = [{ key: "alpha", label: "Alpha" }, { key: "beta", label: "Beta" }, { key: "gamma", label: "Gamma", disabled: true }];
</scr${"ipt"}>
<template>
  <n-toggle-group v-model="selected" label="Alignment" :items="items" mode="multiple" />
  <output>Selected: {{ selected.join(", ") || "None" }}</output>
</template>`,
  Toolbar: `<script setup lang="ts">
import { NToolbar } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const items = [{ key: "new", label: "New" }, { key: "docs", label: "Documentation", href: "#usage" }, { key: "archive", label: "Archive", disabled: true }];
const activated = ref("None");
</scr${"ipt"}>
<template>
  <n-toolbar label="Record actions" :items="items" @activate="activated = $event.label" />
  <output>Activated: {{ activated }}</output>
</template>`,
  Autocomplete: `<script setup lang="ts">
import { NAutocomplete } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const value = ref("Al");
const items = [{ key: "alpha", label: "Alpha" }, { key: "beta", label: "Beta" }, { key: "gamma", label: "Gamma", disabled: true }];
</scr${"ipt"}>
<template>
  <n-autocomplete v-model="value" label="Destination" :items="items" empty-text="No destinations" />
  <output>Text: {{ value }}</output>
</template>`,
  Checkbox: `<script setup lang="ts">
import { NCheckbox } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const checked = ref(true);
const indeterminate = ref(true);
</scr${"ipt"}>
<template>
  <n-checkbox v-model="checked" v-model:indeterminate="indeterminate" label="Select all records" />
  <output>Checked: {{ checked }} · Indeterminate: {{ indeterminate }}</output>
</template>`,
  Combobox: `<script setup lang="ts">
import { NCombobox } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const text = ref("Beta");
const selected = ref<string | null>("beta");
const items = [{ key: "alpha", label: "Alpha" }, { key: "beta", label: "Beta" }, { key: "gamma", label: "Gamma", disabled: true }];
</scr${"ipt"}>
<template>
  <n-combobox v-model="text" v-model:selected="selected" label="Customer" :items="items" clearable />
  <output>Text: {{ text }} · Selected: {{ selected ?? "None" }}</output>
</template>`,
  Fieldset: `<script setup lang="ts">
import { NFieldset, NRadio } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const channel = ref<string | null>("growth");
</scr${"ipt"}>
<template>
  <n-fieldset legend="Notification channel">
    <n-radio v-model="channel" label="Email" value="email" name="fieldset-channel" />
    <n-radio v-model="channel" label="Phone" value="phone" name="fieldset-channel" />
  </n-fieldset>
</template>`,
  FileInput: `<script setup lang="ts">
import { NFileInput } from "@nagi-labs/nagi-ui/components";
</scr${"ipt"}>
<template><n-file-input label="Attachments" accept="image/*,.pdf" multiple /></template>`,
  Input: `<script setup lang="ts">
import { NInput } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const email = ref("maya@example.com");
</scr${"ipt"}>
<template>
  <n-input v-model="email" label="Work email" type="email" required />
  <output>Value: {{ email }}</output>
</template>`,
  InputGroup: `<script setup lang="ts">
import { NButton, NInput, NInputGroup } from "@nagi-labs/nagi-ui/components";
</scr${"ipt"}>
<template>
  <main class="app-input-group-example">
    <n-input-group
      class="n-input-group"
      prefix="https://"
      suffix=".nagi.dev"
    >
      <n-input label="Workspace URL" />
      <template #action>
        <n-button class="n-input-group-action">Check</n-button>
      </template>
    </n-input-group>
  </main>
</template>
<style scoped>
.app-input-group-example {
  > .n-input-group {
    .n-input-group-action {
      --button-size: small;
    }
  }
}
</style>`,
  Listbox: `<script setup lang="ts">
import { NListbox } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const selected = ref<readonly string[]>(["beta"]);
const items = [{ key: "alpha", label: "Alpha" }, { key: "beta", label: "Beta" }, { key: "gamma", label: "Gamma", disabled: true }];
</scr${"ipt"}>
<template>
  <n-listbox v-model:selected="selected" label="Plan" :items="items" mode="multiple" />
  <output>Selected: {{ selected.join(", ") || "None" }}</output>
</template>`,
  MultiSelect: `<script setup lang="ts">
import { NMultiSelect } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const selected = ref<readonly string[]>(["alpha", "beta"]);
const items = [{ key: "alpha", label: "Alpha" }, { key: "beta", label: "Beta" }, { key: "gamma", label: "Gamma", disabled: true }];
</scr${"ipt"}>
<template>
  <n-multi-select v-model="selected" label="Teams" :items="items" name="teams" />
  <output>Selected: {{ selected.join(", ") || "None" }}</output>
</template>`,
  NumberField: `<script setup lang="ts">
import { NNumberField } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const seats = ref<number | null>(8);
</scr${"ipt"}>
<template>
  <n-number-field v-model="seats" label="Seats" :min="1" :max="10" :step="1" />
  <output>Seats: {{ seats ?? "Empty" }}</output>
</template>`,
  OTPField: `<script setup lang="ts">
import { NOtpField } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const code = ref("381204");
</scr${"ipt"}>
<template>
  <n-otp-field v-model="code" label="Verification code" :length="6" kind="numeric" />
  <output>Value: {{ code }}</output>
</template>`,
  Radio: `<script setup lang="ts">
import { NRadio } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const plan = ref<string | null>("growth");
</scr${"ipt"}>
<template>
  <n-radio v-model="plan" label="Growth" value="growth" name="plan" />
  <n-radio v-model="plan" label="Enterprise" value="enterprise" name="plan" />
  <output>Plan: {{ plan ?? "None" }}</output>
</template>`,
  RangeSlider: `<script setup lang="ts">
import { NRangeSlider } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const range = ref<readonly [number, number]>([25, 75]);
</scr${"ipt"}>
<template>
  <n-range-slider v-model="range" label="Healthy usage range" :min="0" :max="100" lower-name="minimum" upper-name="maximum" />
  <output>Range: {{ range[0] }}–{{ range[1] }}</output>
</template>`,
  Rating: `<script setup lang="ts">
import { NRating } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const rating = ref<number | null>(4);
const items = [1, 2, 3, 4, 5].map(value => ({ value, label: \`\${value} stars\` }));
</scr${"ipt"}>
<template>
  <n-rating v-model="rating" label="Customer health" name="health" :items="items" />
  <output>Rating: {{ rating ?? "None" }}</output>
</template>`,
  Select: `<script setup lang="ts">
import { NSelect } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const selected = ref<string | undefined>("beta");
const options = [{ value: "alpha", label: "Alpha" }, { value: "beta", label: "Beta" }, { value: "gamma", label: "Gamma", disabled: true }];
</scr${"ipt"}>
<template>
  <n-select v-model="selected" label="Plan" :options="options" required />
  <output>Selected: {{ selected ?? "None" }}</output>
</template>`,
  Slider: `<script setup lang="ts">
import { NSlider } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const threshold = ref(42);
</scr${"ipt"}>
<template>
  <n-slider v-model="threshold" label="Alert threshold" :min="0" :max="100" :step="5" />
  <output>Threshold: {{ threshold }}</output>
</template>`,
  Switch: `<script setup lang="ts">
import { NSwitch } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const enabled = ref(true);
</scr${"ipt"}>
<template>
  <n-switch v-model="enabled" label="Enable customer portal" name="portal" />
  <output>Enabled: {{ enabled }}</output>
</template>`,
  TagsInput: `<script setup lang="ts">
import { NTagsInput } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const tags = ref<readonly string[]>(["enterprise", "renewal"]);
</scr${"ipt"}>
<template>
  <n-tags-input v-model="tags" label="Account tags" name="tags" :max="5" add-on-blur />
  <output>Tags: {{ tags.join(", ") || "None" }}</output>
</template>`,
  Textarea: `<script setup lang="ts">
import { NTextarea } from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";
const notes = ref("Renewal review is scheduled for Friday.");
</scr${"ipt"}>
<template>
  <n-textarea v-model="notes" label="Internal notes" :rows="4" maxlength="240" />
  <output>Characters: {{ notes.length }} / 240</output>
</template>`,
};
