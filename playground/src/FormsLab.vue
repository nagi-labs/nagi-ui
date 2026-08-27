<script setup lang="ts">
import { computed, ref } from "vue";

import {
  Button,
  Checkbox,
  Combobox,
  Fieldset,
  FileInput,
  Input as NagiInput,
  InputGroup,
  Meter,
  NumberField,
  Progress,
  Radio,
  RangeSlider,
  Rating,
  Select as NagiSelect,
  Slider,
  Switch,
  type ComboboxOption,
  type NagiSelectOption,
  type RatingItem,
} from "@nagi-labs/nagi-ui/components";

const frameworks: readonly ComboboxOption[] = [
  { key: "vue", label: "Vue" },
  { key: "react", label: "React", disabled: true },
  { key: "svelte", label: "Svelte" },
  { key: "solid", label: "Solid" },
];

const plans: readonly NagiSelectOption[] = [
  { value: "standard", label: "Standard" },
  { value: "legacy", label: "Legacy (unavailable)", disabled: true },
  { value: "pro", label: "Pro" },
];

const ratingItems: readonly RatingItem[] = [
  { value: 1, label: "1 star" },
  { value: 2, label: "2 stars" },
  { value: 3, label: "3 stars" },
  { value: 4, label: "4 stars" },
  { value: 5, label: "5 stars" },
];

const fullName = ref("Ada Lovelace");
const disabledValue = ref("must not be submitted");
const agreement = ref(false);
const agreementIndeterminate = ref(true);
const marketing = ref(true);
const contact = ref<string | null>("email");
const plan = ref("standard");
const rating = ref<number | null>(3);
const priceRange = ref<readonly [number, number]>([25, 75]);
const priceRangeMin = ref(0);
const priceRangeMax = ref(100);
const priceRangeStep = ref(5);
const seats = ref<number | null>(2);
const nativeDefaultPlan = ref<string>();
const nativePlans = ref<readonly NagiSelectOption[]>(plans);
const constrainedVolume = ref(999);
const volume = ref(40);
const externalNote = ref("outside the form tree");
const externalFormOwner = ref("alignment-form");
const frameworkInput = ref("v");
const frameworkKey = ref<string | null>("vue");
const disabledFrameworkInput = ref("Solid");
const disabledFrameworkKey = ref<string | null>("solid");
const loadingInput = ref("");
const loadingKey = ref<string | null>(null);
const emptyInput = ref("zzz");
const emptyKey = ref<string | null>(null);
const readOnlyInput = ref("Svelte");
const readOnlyKey = ref<string | null>("svelte");
const submission = ref("No submission yet");

const modelState = computed(() => ({
  fullName: fullName.value,
  agreement: agreement.value,
  agreementIndeterminate: agreementIndeterminate.value,
  marketing: marketing.value,
  contact: contact.value,
  plan: plan.value,
  volume: volume.value,
  externalNote: externalNote.value,
  frameworkInput: frameworkInput.value,
  frameworkKey: frameworkKey.value,
}));

function captureSubmission(event: SubmitEvent) {
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  submission.value = JSON.stringify(Object.fromEntries(new FormData(form)));
}

function removeInitialPlanOption() {
  nativePlans.value = plans.filter((option) => option.value === "pro");
}

function narrowPriceRange() {
  priceRangeMin.value = 40;
  priceRangeMax.value = 60;
  priceRangeStep.value = 10;
}
</script>

<template>
  <main class="n-forms-lab">
    <header class="header">
      <p class="text -eyebrow">Base UI alignment B</p>
      <h1 class="title">Native form controls</h1>
      <p class="text">
        These package Blueprints preserve browser form, validation, reset, and keyboard
        behavior while keeping Vue models observable below.
      </p>
    </header>

    <section class="section" aria-labelledby="form-heading">
      <h2 id="form-heading" class="title">Form-associated controls</h2>
      <form id="alignment-form" class="form" @submit.prevent="captureSubmission">
        <div class="unit">
          <NagiInput
            v-model="fullName"
            data-testid="full-name"
            label="Full name"
            name="fullName"
            autocomplete="name"
            required
          />
          <NagiInput
            v-model="disabledValue"
            data-testid="disabled-field"
            label="Disabled value"
            name="disabledField"
            disabled
          />
          <Checkbox
            v-model="agreement"
            v-model:indeterminate="agreementIndeterminate"
            data-testid="agreement"
            label="Accept the agreement"
            name="agreement"
            value="accepted"
          />
          <Switch
            v-model="marketing"
            data-testid="marketing"
            label="Product updates"
            name="marketing"
            value="enabled"
          />
        </div>

        <Fieldset legend="Contact preference">
          <Radio
            v-model="contact"
            data-testid="contact-email"
            label="Email"
            name="contact"
            value="email"
            required
          />
          <Radio
            v-model="contact"
            data-testid="contact-sms"
            label="SMS"
            name="contact"
            value="sms"
          />
        </Fieldset>

        <div class="unit">
          <NagiSelect
            v-model="plan"
            data-testid="plan"
            label="Plan"
            name="plan"
            :options="plans"
            required
          />
          <Slider
            v-model="volume"
            data-testid="volume"
            label="Volume"
            name="volume"
            :min="0"
            :max="100"
            :step="10"
          />
        </div>

        <div class="unit">
          <Combobox
            v-model="frameworkInput"
            v-model:selected="frameworkKey"
            label="Framework"
            name="framework"
            placeholder="Type to filter"
            :items="frameworks"
            clearable
            clear-label="Clear framework"
            required
          />
          <p class="text">
            committed key:
            <output data-testid="framework-key">{{ frameworkKey ?? "none" }}</output>
          </p>
          <Combobox
            v-model="disabledFrameworkInput"
            v-model:selected="disabledFrameworkKey"
            label="Disabled framework"
            name="disabledFramework"
            :items="frameworks"
            disabled
          />
        </div>

        <div class="actions">
          <button class="button" type="submit">Submit form</button>
          <button class="button" type="reset">Reset form</button>
        </div>
      </form>
    </section>

    <section class="section" aria-labelledby="interactive-form-heading">
      <h2 id="interactive-form-heading" class="title">Small interactive controls</h2>
      <form id="interactive-form" class="form" @submit.prevent>
        <div class="unit">
          <Rating
            v-model="rating"
            label="Release rating"
            name="rating"
            :items="ratingItems"
            required
          />
          <FileInput
            data-testid="release-file"
            label="Release attachment"
            name="attachment"
            accept="text/plain,.md"
          />
          <NumberField
            v-model="seats"
            label="Seats"
            name="seats"
            :min="0"
            :max="8"
            decrement-label="Decrease seats"
            increment-label="Increase seats"
          />
          <NagiSelect
            v-model="nativeDefaultPlan"
            label="Native default plan"
            name="nativeDefaultPlan"
            :options="nativePlans"
          />
          <Slider
            v-model="constrainedVolume"
            label="Constrained volume"
            name="constrainedVolume"
            :min="10"
            :max="20"
            :step="3"
          />
          <RangeSlider
            v-model="priceRange"
            label="Price range"
            lower-label="Minimum price"
            upper-label="Maximum price"
            lower-name="priceMin"
            upper-name="priceMax"
            :min="priceRangeMin"
            :max="priceRangeMax"
            :step="priceRangeStep"
          />
          <InputGroup prefix="https://" suffix=".dev">
            <input
              class="n-input-group-control"
              type="text"
              name="projectUrl"
              value="nagi-ui"
              aria-label="Project URL"
              autocomplete="url"
            />
            <template #action>
              <Button class="n-input-group-action" type="submit">Open</Button>
            </template>
          </InputGroup>
        </div>
        <div class="actions">
          <button class="button" type="button" @click="removeInitialPlanOption">
            Remove initial plan option
          </button>
          <button class="button" type="button" @click="narrowPriceRange">
            Narrow price bounds
          </button>
          <button class="button" type="reset">Reset interactive controls</button>
        </div>
      </form>
      <output data-testid="rating-value">rating: {{ rating ?? "none" }}</output>
      <output data-testid="seats-value">seats: {{ seats ?? "none" }}</output>
      <output data-testid="native-default-plan-value">
        native plan: {{ nativeDefaultPlan ?? "none" }}
      </output>
      <output data-testid="constrained-volume-value">
        constrained volume: {{ constrainedVolume }}
      </output>
      <output data-testid="price-range-value">
        price range: {{ priceRange[0] }}–{{ priceRange[1] }}
      </output>
    </section>

    <section class="section" aria-labelledby="external-heading">
      <h2 id="external-heading" class="title">Form owner rebinding test</h2>
      <p class="text">
        Development fixture: the input is outside both forms. Change its
        <code class="code">form</code> owner, then verify that only the new
        owner's reset restores the model.
      </p>
      <NagiInput
        v-model="externalNote"
        data-testid="external-note"
        label="External note"
        name="externalNote"
        :form="externalFormOwner"
      />
      <div class="actions">
        <button
          class="button"
          type="button"
          @click="externalFormOwner = 'alternate-form'"
        >
          1. Assign to alternate form
        </button>
        <form id="alternate-form" class="form">
          <button class="button" type="reset">2. Reset alternate form</button>
        </form>
      </div>
    </section>

    <section class="section" aria-labelledby="status-heading">
      <h2 id="status-heading" class="title">Native status elements</h2>
      <div class="unit">
        <Progress
          data-testid="determinate-progress"
          label="Build progress"
          :value="0.65"
          :max="1"
        />
        <Progress data-testid="indeterminate-progress" label="Waiting for server" />
        <Meter
          data-testid="storage-meter"
          label="Storage used"
          :value="72"
          :min="0"
          :max="100"
          :low="35"
          :high="80"
          :optimum="20"
        />
      </div>
    </section>

    <section class="section" aria-labelledby="combobox-states-heading">
      <h2 id="combobox-states-heading" class="title">Combobox states</h2>
      <div class="unit">
        <Combobox
          v-model="loadingInput"
          v-model:selected="loadingKey"
          label="Loading choices"
          :items="frameworks"
          loading
          loading-text="Loading frameworks…"
        />
        <Combobox
          v-model="emptyInput"
          v-model:selected="emptyKey"
          label="Empty choices"
          :items="frameworks"
          empty-text="No matching framework"
        />
        <Combobox
          v-model="readOnlyInput"
          v-model:selected="readOnlyKey"
          label="Read-only choice"
          :items="frameworks"
          read-only
          clearable
        />
        <p class="text">
          read-only key:
          <output data-testid="read-only-key">{{ readOnlyKey ?? "none" }}</output>
        </p>
      </div>
    </section>

    <section class="section" aria-labelledby="observation-heading">
      <h2 id="observation-heading" class="title">Observable result</h2>
      <dl class="list -state">
        <div class="item">
          <dt class="term">Vue models</dt>
          <dd class="definition">
            <code class="code" data-testid="model-state">{{ JSON.stringify(modelState) }}</code>
          </dd>
        </div>
        <div class="item">
          <dt class="term">FormData</dt>
          <dd class="definition">
            <code class="code" data-testid="submission">{{ submission }}</code>
          </dd>
        </div>
      </dl>
    </section>
  </main>
</template>

<style scoped>
.n-forms-lab {
  display: grid;
  gap: 1rem;
  max-inline-size: 70rem;
  padding: 2rem;
  background: var(--playground-color-canvas, #f6fafb);
  color: var(--nagi-color-text, #17323b);
  font-family: ui-sans-serif, system-ui, sans-serif;

  > .header {
    > .title {
      margin-block: 0.35rem 0;
      font-size: 1.65rem;
    }

    > .text {
      max-inline-size: 48rem;
      color: var(--nagi-color-text-muted, #50676f);

      &.-eyebrow {
        margin: 0;
        color: var(--nagi-color-accent, #16768b);
        font-size: var(--nagi-font-size-label, 0.72rem);
        font-weight: 750;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
    }
  }

  > .section {
    padding: 1rem;
    border: 1px solid var(--nagi-color-border-muted, #c8d8dd);
    border-radius: var(--nagi-radius-overlay, 0.65rem);
    background: var(--nagi-color-surface, #fff);

    > .title {
      margin-block: 0 0.75rem;
      font-size: 1.05rem;
    }

    > .text {
      color: var(--nagi-color-text-muted, #50676f);

      > .code {
        font-family: ui-monospace, monospace;
      }
    }

    > .form {
      display: grid;
      gap: 1rem;

      > .unit {
        display: grid;
        align-items: start;
        grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
        gap: 1rem;

        > .text {
          margin: 0;
          color: var(--nagi-color-text-muted, #50676f);
        }
      }

      > .actions {
        display: flex;
        gap: 0.55rem;

        > .button {
          min-block-size: var(--nagi-size-control, 2rem);
          padding: var(--nagi-space-control, 0.5rem 0.75rem);
          border: 1px solid var(--nagi-color-border, #b9cbd1);
          border-radius: var(--nagi-radius-control, 0.55rem);
          background: var(--nagi-color-surface, #fff);
          color: inherit;
          font: inherit;
          cursor: pointer;

          &:focus-visible {
            outline: none;
            box-shadow: var(--nagi-shadow-focus, 0 0 0 2px rgb(117 173 186 / 0.35));
          }
        }
      }
    }

    > .unit {
      display: grid;
      align-items: start;
      grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
      gap: 1rem;

      > .text {
        margin: 0;
        color: var(--nagi-color-text-muted, #50676f);
      }
    }

    > .list {
      &.-state {
        display: grid;
        gap: 0.65rem;
        margin: 0;

        > .item {
          display: grid;
          grid-template-columns: 7rem minmax(0, 1fr);

          > .term {
            color: var(--nagi-color-text-muted, #50676f);
          }

          > .definition {
            min-inline-size: 0;
            margin: 0;
            overflow-wrap: anywhere;

            > .code {
              font-family: ui-monospace, monospace;
            }
          }
        }
      }
    }
  }
}
</style>
