<script setup lang="ts">
import {
  NAutocomplete,
  NButton,
  NButtonGroup,
  NCheckbox,
  NCombobox,
  NFieldset,
  NFileInput,
  NInput,
  NInputGroup,
  NListbox,
  NMultiSelect,
  NNumberField,
  NOtpField,
  NRadio,
  NRangeSlider,
  NRating,
  NSelect,
  NSlider,
  NSwitch,
  NTagsInput,
  NTextarea,
  NToggle,
  NToggleGroup,
  NToolbar,
} from "@nagi-labs/nagi-ui/components";

defineProps<{ componentName: string }>();

const items = [
  { key: "alpha", label: "Alpha" },
  { key: "beta", label: "Beta" },
  { key: "gamma", label: "Gamma", disabled: true },
] as const;
const selectOptions = items.map(({ key, label, disabled }) => ({ value: key, label, disabled }));
const toolbarItems = [
  { key: "new", label: "New" },
  { key: "docs", label: "Documentation", href: "#usage" },
  { key: "archive", label: "Archive", disabled: true },
] as const;
const ratingItems = [1, 2, 3, 4, 5].map((value) => ({ value, label: `${value} stars` }));

const togglePressed = ref(true);
const toggleGroupValue = ref<readonly string[]>(["alpha"]);
const text = ref("maya@example.com");
const checked = ref(true);
const indeterminate = ref(true);
const radio = ref<string | null>("growth");
const selected = ref<string | undefined>("beta");
const slider = ref(42);
const range = ref<readonly [number, number]>([25, 75]);
const rating = ref<number | null>(4);
const autocomplete = ref("Al");
const comboboxText = ref("Beta");
const comboboxSelected = ref<string | null>("beta");
const listbox = ref<readonly string[]>(["beta"]);
const multiSelect = ref<readonly string[]>(["alpha", "beta"]);
const numberValue = ref<number | null>(8);
const otp = ref("381204");
const tags = ref<readonly string[]>(["enterprise", "renewal"]);
const notes = ref("Renewal review is scheduled for Friday.");
const switchValue = ref(true);
const activated = ref("None");
</script>

<template>
  <div class="site-actions-forms-preview">
    <div
      v-if="componentName === 'Button'"
      class="unit -examples"
    >
      <section class="section -sizes">
        <h3 class="title">Sizes</h3>
        <span class="actions -compact"><n-button>Small</n-button></span
        ><n-button>Medium</n-button
        ><span class="actions -spacious"><n-button>Large</n-button></span>
      </section>
      <section class="section -variants">
        <h3 class="title">Composable style axes</h3>
        <n-button>Neutral outlined</n-button
        ><span class="actions -primary"><n-button>Accent solid</n-button></span
        ><span class="actions -destructive"><n-button>Danger outlined rounded</n-button></span>
      </section>
      <section class="section -availability">
        <h3 class="title">Disabled</h3>
        <n-button disabled>Default</n-button
        ><span class="actions -primary"><n-button disabled>Accent</n-button></span
        ><span class="actions -destructive"><n-button disabled>Danger</n-button></span>
        <n-button
          focusable-when-disabled
          aria-describedby="button-disabled-note"
        >
          Unavailable action
        </n-button>
        <span
          id="button-disabled-note"
          class="text"
        >
          The last button remains discoverable by keyboard.
        </span>
      </section>
    </div>
    <div
      v-else-if="componentName === 'ButtonGroup'"
      class="actions -compact"
    >
      <n-button-group
        label="History"
        orientation="horizontal"
      >
        <n-button>Back</n-button><n-button>Forward</n-button>
      </n-button-group>
    </div>
    <div
      v-else-if="componentName === 'Toggle'"
      class="unit"
    >
      <n-toggle v-model="togglePressed">Bold</n-toggle
      ><output class="output">Pressed: {{ togglePressed }}</output>
    </div>
    <div
      v-else-if="componentName === 'ToggleGroup'"
      class="unit"
    >
      <n-toggle-group
        v-model="toggleGroupValue"
        label="Alignment"
        :items="items"
        mode="multiple"
      />
      <output class="output">Selected: {{ toggleGroupValue.join(", ") || "None" }}</output>
    </div>
    <div
      v-else-if="componentName === 'Toolbar'"
      class="unit"
    >
      <n-toolbar
        label="Record actions"
        :items="toolbarItems"
        @activate="activated = $event.label"
      />
      <output class="output">Activated: {{ activated }}</output>
    </div>
    <div
      v-else-if="componentName === 'Autocomplete'"
      class="unit"
    >
      <n-autocomplete
        v-model="autocomplete"
        label="Destination"
        :items="items"
        empty-text="No destinations"
      />
      <output class="output">Text: {{ autocomplete }}</output>
    </div>
    <div
      v-else-if="componentName === 'Checkbox'"
      class="unit"
    >
      <n-checkbox
        v-model="checked"
        v-model:indeterminate="indeterminate"
        label="Select all records"
      />
      <output class="output">Checked: {{ checked }} · Indeterminate: {{ indeterminate }}</output>
    </div>
    <div
      v-else-if="componentName === 'Combobox'"
      class="unit"
    >
      <n-combobox
        v-model="comboboxText"
        v-model:selected="comboboxSelected"
        label="Customer"
        :items="items"
        clearable
      />
      <output class="output"
        >Text: {{ comboboxText }} · Selected: {{ comboboxSelected ?? "None" }}</output
      >
    </div>
    <n-fieldset
      v-else-if="componentName === 'Fieldset'"
      legend="Notification channel"
    >
      <n-radio
        v-model="radio"
        label="Email"
        value="email"
        name="fieldset-channel"
      />
      <n-radio
        v-model="radio"
        label="Phone"
        value="phone"
        name="fieldset-channel"
      />
    </n-fieldset>
    <n-file-input
      v-else-if="componentName === 'FileInput'"
      label="Attachments"
      accept="image/*,.pdf"
      multiple
    />
    <div
      v-else-if="componentName === 'Input'"
      class="unit"
    >
      <n-input
        v-model="text"
        label="Work email"
        type="email"
        required
      />
      <output class="output">Value: {{ text }}</output>
    </div>
    <div
      v-else-if="componentName === 'InputGroup'"
      class="actions -compact"
    >
      <n-input-group
        prefix="https://"
        suffix=".nagi.dev"
      >
        <n-input label="Workspace URL" />
        <template #action>
          <n-button>Check</n-button>
        </template>
      </n-input-group>
    </div>
    <div
      v-else-if="componentName === 'Listbox'"
      class="unit"
    >
      <n-listbox
        v-model:selected="listbox"
        label="Plan"
        :items="items"
        mode="multiple"
      />
      <output class="output">Selected: {{ listbox.join(", ") || "None" }}</output>
    </div>
    <div
      v-else-if="componentName === 'MultiSelect'"
      class="unit"
    >
      <n-multi-select
        v-model="multiSelect"
        label="Teams"
        :items="items"
        name="teams"
      />
      <output class="output">Selected: {{ multiSelect.join(", ") || "None" }}</output>
    </div>
    <div
      v-else-if="componentName === 'NumberField'"
      class="unit"
    >
      <n-number-field
        v-model="numberValue"
        label="Seats"
        :min="1"
        :max="10"
        :step="1"
      />
      <output class="output">Seats: {{ numberValue ?? "Empty" }}</output>
    </div>
    <div
      v-else-if="componentName === 'OTPField'"
      class="unit"
    >
      <n-otp-field
        v-model="otp"
        label="Verification code"
        :length="6"
        kind="numeric"
      />
      <output class="output">Value: {{ otp }}</output>
    </div>
    <div
      v-else-if="componentName === 'Radio'"
      class="unit"
    >
      <n-radio
        v-model="radio"
        label="Growth"
        value="growth"
        name="plan"
      />
      <n-radio
        v-model="radio"
        label="Enterprise"
        value="enterprise"
        name="plan"
      />
      <output class="output">Plan: {{ radio ?? "None" }}</output>
    </div>
    <div
      v-else-if="componentName === 'RangeSlider'"
      class="unit"
    >
      <n-range-slider
        v-model="range"
        label="Healthy usage range"
        :min="0"
        :max="100"
        lower-name="minimum"
        upper-name="maximum"
      />
      <output class="output">Range: {{ range[0] }}–{{ range[1] }}</output>
    </div>
    <div
      v-else-if="componentName === 'Rating'"
      class="unit"
    >
      <n-rating
        v-model="rating"
        label="Customer health"
        name="health"
        :items="ratingItems"
      />
      <output class="output">Rating: {{ rating ?? "None" }}</output>
    </div>
    <div
      v-else-if="componentName === 'Select'"
      class="unit"
    >
      <n-select
        v-model="selected"
        label="Plan"
        :options="selectOptions"
        required
      />
      <output class="output">Selected: {{ selected ?? "None" }}</output>
    </div>
    <div
      v-else-if="componentName === 'Slider'"
      class="unit"
    >
      <n-slider
        v-model="slider"
        label="Alert threshold"
        :min="0"
        :max="100"
        :step="5"
      />
      <output class="output">Threshold: {{ slider }}</output>
    </div>
    <div
      v-else-if="componentName === 'Switch'"
      class="unit"
    >
      <n-switch
        v-model="switchValue"
        label="Enable customer portal"
        name="portal"
      />
      <output class="output">Enabled: {{ switchValue }}</output>
    </div>
    <div
      v-else-if="componentName === 'TagsInput'"
      class="unit"
    >
      <n-tags-input
        v-model="tags"
        label="Account tags"
        name="tags"
        :max="5"
        add-on-blur
      />
      <output class="output">Tags: {{ tags.join(", ") || "None" }}</output>
    </div>
    <div
      v-else-if="componentName === 'Textarea'"
      class="unit"
    >
      <n-textarea
        v-model="notes"
        label="Internal notes"
        :rows="4"
        maxlength="240"
      />
      <output class="output">Characters: {{ notes.length }} / 240</output>
    </div>
  </div>
</template>

<style scoped>
.site-actions-forms-preview {
  > .unit {
    display: flex;
    flex-wrap: wrap;
    gap: var(--n-space-5);
    align-items: center;

    > .output,
    > .text {
      flex-basis: 100%;
      margin: 0;
      color: var(--nagi-color-text-muted);
      font-size: var(--nagi-font-size-label);
    }
  }

  > .unit.-examples {
    display: grid;
    gap: var(--n-space-7);
    inline-size: min(100%, 42rem);

    > .section {
      display: flex;
      flex-wrap: wrap;
      gap: var(--n-space-4);
      align-items: center;

      > .title {
        flex-basis: 100%;
        margin: 0;
        color: var(--nagi-color-text-muted);
        font-size: var(--nagi-font-size-label);
      }

      > .text {
        flex-basis: 100%;
        margin: 0;
        color: var(--nagi-color-text-muted);
        font-size: var(--nagi-font-size-label);
      }
    }
  }
}
</style>
