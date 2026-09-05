<script setup lang="ts">
import { useCarousel, useDialog, useTabs, vDialogClose } from "@nagi-labs/nagi-ui";
import { useAlertDialog, useButton } from "@nagi-labs/nagi-ui/component-controls";
import {
  NAlertDialog,
  NButton,
  NCarousel,
  NCombobox,
  NDialog,
} from "@nagi-labs/nagi-ui/components";
import { computed, ref } from "vue";

import OwnedComboboxContractFixture from "./OwnedComboboxContractFixture.vue";

const comboboxSeed: ReadonlyArray<{ key: string; label: string; disabled?: boolean }> = [
  { key: "vue", label: "Vue" },
  { key: "react", label: "React", disabled: true },
  { key: "svelte", label: "Svelte" },
  { key: "solid", label: "Solid" },
];
const packageComboboxItems = ref([...comboboxSeed]);
const packageComboboxInput = ref("");
const packageComboboxSelected = ref<string | null>(null);
const packageDisabledComboboxInput = ref("Vue");
const packageDisabledComboboxSelected = ref<string | null>("vue");
const packageReadOnlyComboboxInput = ref("");
const packageReadOnlyComboboxSelected = ref<string | null>("vue");
const packageControlledComboboxInput = ref("");
const packageControlledComboboxSelected = ref<string | null>("vue");
const packageControlledComboboxInputRequests = ref(0);
const packageControlledComboboxSelectionRequests = ref(0);
const ownedComboboxItems = ref([...comboboxSeed]);
const ownedComboboxInput = ref("");
const ownedComboboxSelected = ref<string | null>(null);
const ownedDisabledComboboxInput = ref("Vue");
const ownedDisabledComboboxSelected = ref<string | null>("vue");
const ownedReadOnlyComboboxInput = ref("");
const ownedReadOnlyComboboxSelected = ref<string | null>("vue");
const ownedControlledComboboxInputSource = ref("");
const ownedControlledComboboxSelectedSource = ref<string | null>("vue");
const ownedControlledComboboxInputRequests = ref(0);
const ownedControlledComboboxSelectionRequests = ref(0);
const ownedControlledComboboxInput = computed({
  get: () => ownedControlledComboboxInputSource.value,
  set: () => {
    ownedControlledComboboxInputRequests.value += 1;
  },
});
const ownedControlledComboboxSelected = computed({
  get: () => ownedControlledComboboxSelectedSource.value,
  set: () => {
    ownedControlledComboboxSelectionRequests.value += 1;
  },
});

const ownedDialog = useDialog({ modal: true, closedby: "any" });
const titleId = `${ownedDialog.id}-title`;
const descriptionId = `${ownedDialog.id}-description`;
const packageDialogOpen = ref(false);
const packageAlertDialogOpen = ref(false);
const ownedAlertDialogOpen = ref(false);
const ownedAlertDialog = useAlertDialog(ownedAlertDialogOpen);
const ownedAlertTitleId = `${ownedAlertDialog.id}-title`;
const ownedAlertDescriptionId = `${ownedAlertDialog.id}-description`;

const items = [
  { key: "overview", label: "Overview" },
  { key: "billing", label: "Billing", disabled: true },
  { key: "activity", label: "Activity" },
];
const selected = ref<string | null>("overview");
const ownedTabs = useTabs({
  items,
  getKey: (item) => item.key,
  isDisabled: (item) => item.disabled ?? false,
  selected,
  label: "Owned account sections",
  orientation: "vertical",
  activationMode: "manual",
});

const enabledButton = useButton({ disabled: false, focusableWhenDisabled: false });
const nativeDisabledButton = useButton({ disabled: true, focusableWhenDisabled: false });
const focusableDisabledButton = useButton({ disabled: true, focusableWhenDisabled: true });
const focusableDisabledActivations = ref(0);
const ownedButtonActivations = ref(0);
const submittedAction = ref("none");

const carouselItems = [
  { key: "alpha", label: "Owned Alpha", description: "First owned slide." },
  { key: "beta", label: "Owned Beta", description: "Second owned slide." },
  { key: "gamma", label: "Owned Gamma", description: "Third owned slide." },
] as const;
const ownedCarouselIndex = ref(0);
const ownedCarousel = useCarousel({
  items: carouselItems,
  index: ownedCarouselIndex,
  label: "Owned release highlights",
  slidesLabel: "Owned release slides",
  carouselRoleDescription: "owned carousel",
  slidesRoleDescription: "owned slides",
  slideRoleDescription: "owned slide",
  landmark: true,
});
const ownedLoopedCarouselIndex = ref(0);
const ownedLoopedCarousel = useCarousel({
  items: carouselItems,
  index: ownedLoopedCarouselIndex,
  label: "Owned looped highlights",
  loop: true,
});
const ownedRejectedCarouselSource = ref(0);
const ownedRejectedCarouselRequests = ref(0);
const ownedRejectedCarouselIndex = computed({
  get: () => ownedRejectedCarouselSource.value,
  set: () => {
    ownedRejectedCarouselRequests.value += 1;
  },
});
const ownedRejectedCarousel = useCarousel({
  items: carouselItems,
  index: ownedRejectedCarouselIndex,
  label: "Owned locked highlights",
});
const ownedOutOfRangeCarouselIndex = ref(99);
const ownedOutOfRangeCarousel = useCarousel({
  items: carouselItems,
  index: ownedOutOfRangeCarouselIndex,
  label: "Owned bounded highlights",
});
const disabledCarouselIndex = ref(0);
const disabledCarousel = useCarousel({
  items: carouselItems,
  index: disabledCarouselIndex,
  label: "Owned disabled highlights",
  slidesLabel: "Owned disabled slides",
  carouselRoleDescription: "owned carousel",
  slidesRoleDescription: "owned slides",
  slideRoleDescription: "owned slide",
  landmark: true,
  disabled: true,
});

const packageFocusableDisabledActivations = ref(0);
const packageButtonActivations = ref(0);
const packageSubmission = ref("none");
const packageCarouselIndex = ref(0);
const packageDisabledCarouselIndex = ref(0);
const packageLoopedCarouselIndex = ref(0);
const packageRejectedCarouselIndex = ref(0);
const packageRejectedCarouselRequests = ref(0);
const packageOutOfRangeCarouselIndex = ref(99);
</script>

<template>
  <main>
    <section aria-labelledby="package-definition-heading">
      <h1 id="package-definition-heading">Package Definition contract</h1>
      <n-button>Package save</n-button>
      <n-button disabled>Package native disabled</n-button>
      <n-button
        disabled
        focusable-when-disabled
        @click="packageFocusableDisabledActivations += 1"
        >Package focusable disabled</n-button
      >
      <output
        role="status"
        aria-label="Package disabled activations"
      >
        {{ packageFocusableDisabledActivations }}
      </output>
      <n-button
        data-contract-owner="package"
        @click="packageButtonActivations += 1"
      >
        Package activate
      </n-button>
      <output
        role="status"
        aria-label="Package button activations"
      >
        {{ packageButtonActivations }}
      </output>
      <form @submit.prevent="packageSubmission = 'submitted'">
        <label>
          Package form value
          <input
            aria-label="Package form value"
            value="initial"
          />
        </label>
        <n-button>Package form action</n-button>
        <n-button type="submit">Package submit</n-button>
        <n-button type="reset">Package reset</n-button>
      </form>
      <output
        role="status"
        aria-label="Package submission result"
        >{{ packageSubmission }}</output
      >
      <n-button class="package-styled-button">Package styled action</n-button>

      <n-carousel
        v-model="packageCarouselIndex"
        :items="carouselItems"
        label="Package release highlights"
        slides-label="Package release slides"
        landmark
      />
      <output
        role="status"
        aria-label="Package carousel model"
        >{{ packageCarouselIndex }}</output
      >
      <button
        type="button"
        @click="packageCarouselIndex = 2"
      >
        Set package carousel to third
      </button>
      <n-carousel
        v-model="packageLoopedCarouselIndex"
        :items="carouselItems"
        label="Package looped highlights"
        loop
      />
      <output
        role="status"
        aria-label="Package looped carousel model"
      >
        {{ packageLoopedCarouselIndex }}
      </output>
      <n-carousel
        :model-value="packageRejectedCarouselIndex"
        :items="carouselItems"
        label="Package locked highlights"
        @update:model-value="packageRejectedCarouselRequests += 1"
      />
      <output
        role="status"
        aria-label="Package locked carousel model"
      >
        {{ packageRejectedCarouselIndex }}
      </output>
      <output
        role="status"
        aria-label="Package locked carousel requests"
      >
        {{ packageRejectedCarouselRequests }}
      </output>
      <n-carousel
        v-model="packageOutOfRangeCarouselIndex"
        :items="carouselItems"
        label="Package bounded highlights"
      />
      <output
        role="status"
        aria-label="Package bounded carousel model"
      >
        {{ packageOutOfRangeCarouselIndex }}
      </output>
      <n-carousel
        v-model="packageDisabledCarouselIndex"
        :items="carouselItems"
        label="Package disabled highlights"
        slides-label="Package disabled slides"
        landmark
        disabled
      />
      <output
        role="status"
        aria-label="Package disabled carousel model"
      >
        {{ packageDisabledCarouselIndex }}
      </output>
      <button
        type="button"
        @click="packageDisabledCarouselIndex = 1"
      >
        Set package disabled carousel to second
      </button>

      <n-combobox
        v-model="packageComboboxInput"
        v-model:selected="packageComboboxSelected"
        label="Package framework"
        :items="packageComboboxItems"
      />
      <output
        role="status"
        aria-label="Package combobox input"
        >{{ packageComboboxInput }}</output
      >
      <output
        role="status"
        aria-label="Package combobox selection"
        >{{ packageComboboxSelected ?? "none" }}</output
      >
      <button
        type="button"
        @click="packageComboboxItems = packageComboboxItems.filter((item) => item.key !== 'vue')"
      >
        Remove package active option
      </button>
      <button type="button">Dismiss package combobox popup</button>

      <n-combobox
        v-model="packageDisabledComboboxInput"
        v-model:selected="packageDisabledComboboxSelected"
        label="Package disabled framework"
        :items="comboboxSeed"
        disabled
      />
      <output
        role="status"
        aria-label="Package disabled combobox input"
      >
        {{ packageDisabledComboboxInput }}
      </output>
      <output
        role="status"
        aria-label="Package disabled combobox selection"
      >
        {{ packageDisabledComboboxSelected ?? "none" }}
      </output>
      <button
        type="button"
        @click="packageDisabledComboboxSelected = 'solid'"
      >
        Set package disabled combobox to Solid
      </button>

      <n-combobox
        v-model="packageReadOnlyComboboxInput"
        v-model:selected="packageReadOnlyComboboxSelected"
        label="Package readonly framework"
        :items="comboboxSeed"
        read-only
      />
      <output
        role="status"
        aria-label="Package readonly combobox input"
      >
        {{ packageReadOnlyComboboxInput }}
      </output>
      <output
        role="status"
        aria-label="Package readonly combobox selection"
      >
        {{ packageReadOnlyComboboxSelected ?? "none" }}
      </output>

      <n-combobox
        :model-value="packageControlledComboboxInput"
        :selected="packageControlledComboboxSelected"
        label="Package controlled framework"
        :items="comboboxSeed"
        @update:model-value="packageControlledComboboxInputRequests += 1"
        @update:selected="packageControlledComboboxSelectionRequests += 1"
      />
      <output
        role="status"
        aria-label="Package controlled combobox input"
      >
        {{ packageControlledComboboxInput }}
      </output>
      <output
        role="status"
        aria-label="Package controlled combobox selection"
      >
        {{ packageControlledComboboxSelected ?? "none" }}
      </output>
      <output
        role="status"
        aria-label="Package controlled combobox input requests"
      >
        {{ packageControlledComboboxInputRequests }}
      </output>
      <output
        role="status"
        aria-label="Package controlled combobox selection requests"
      >
        {{ packageControlledComboboxSelectionRequests }}
      </output>

      <n-dialog
        v-model:open="packageDialogOpen"
        id="package-owned-contract-dialog"
        trigger-label="Open package definition dialog"
        title="Package definition dialog"
        description="A package dialog exercising native modal state."
      >
        <p>Package modal content.</p>
        <template #actions="{ close }">
          <n-button @click="close"> Save package dialog </n-button>
        </template>
      </n-dialog>
      <output
        role="status"
        aria-label="Package dialog model"
        >{{ packageDialogOpen }}</output
      >

      <n-alert-dialog
        v-model:open="packageAlertDialogOpen"
        trigger-label="Review package contract deletion"
        title="Delete package contract?"
        description="This package contract cannot be restored."
        cancel-label="Keep package contract"
        action-label="Delete package contract"
        action-tone="danger"
      />
      <output
        role="status"
        aria-label="Package alert dialog model"
      >
        {{ packageAlertDialogOpen }}
      </output>
    </section>

    <section aria-labelledby="owned-button-heading">
      <h1 id="owned-button-heading">Owned Button contract</h1>
      <button
        v-bind="enabledButton.buttonProps"
        type="button"
        data-scope="button"
        data-part="root"
        class="owned-button"
      >
        Owned save
      </button>
      <button
        v-bind="nativeDisabledButton.buttonProps"
        type="button"
        data-scope="button"
        data-part="root"
        class="owned-button"
      >
        Owned native disabled
      </button>
      <button
        v-bind="focusableDisabledButton.buttonProps"
        type="button"
        data-scope="button"
        data-part="root"
        class="owned-button"
        @click="focusableDisabledActivations += 1"
      >
        Owned focusable disabled
      </button>
      <output
        role="status"
        aria-label="Owned disabled activations"
      >
        {{ focusableDisabledActivations }}
      </output>
      <button
        v-bind="enabledButton.buttonProps"
        type="button"
        data-scope="button"
        data-part="root"
        data-contract-owner="owned"
        class="owned-button"
        @click="ownedButtonActivations += 1"
      >
        Owned activate
      </button>
      <output
        role="status"
        aria-label="Owned button activations"
      >
        {{ ownedButtonActivations }}
      </output>
      <form @submit.prevent="submittedAction = 'submitted'">
        <label>
          Owned form value
          <input
            aria-label="Owned form value"
            value="initial"
          />
        </label>
        <button
          v-bind="enabledButton.buttonProps"
          type="button"
          data-scope="button"
          data-part="root"
          class="owned-button"
        >
          Owned form action
        </button>
        <button
          v-bind="enabledButton.buttonProps"
          type="submit"
          data-scope="button"
          data-part="root"
          class="owned-button"
        >
          Owned submit
        </button>
        <button
          v-bind="enabledButton.buttonProps"
          type="reset"
          data-scope="button"
          data-part="root"
          class="owned-button"
        >
          Owned reset
        </button>
      </form>
      <output
        role="status"
        aria-label="Owned submission result"
        >{{ submittedAction }}</output
      >
      <button
        v-bind="enabledButton.buttonProps"
        type="button"
        data-scope="button"
        data-part="root"
        class="owned-button -styled"
      >
        Owned styled action
      </button>
    </section>

    <section aria-labelledby="owned-carousel-heading">
      <h1 id="owned-carousel-heading">Owned Carousel contract</h1>
      <section
        v-bind="ownedCarousel.rootProps"
        data-scope="carousel"
        data-part="root"
        class="owned-carousel"
      >
        <div
          v-bind="ownedCarousel.viewportProps"
          data-scope="carousel"
          data-part="viewport"
          class="viewport"
        >
          <div class="owned-layout-wrapper">
            <div class="slides">
              <article
                v-for="(item, itemIndex) in carouselItems"
                :key="item.key"
                v-bind="ownedCarousel.slideProps(item, itemIndex)"
                data-scope="carousel"
                data-part="slide"
                class="slide"
              >
                <h2 v-bind="ownedCarousel.slideLabelProps(itemIndex)">
                  {{ item.label }}
                  <span class="position">, {{ ownedCarousel.slidePosition(item, itemIndex) }}</span>
                </h2>
                <p>{{ item.description }}</p>
              </article>
            </div>
          </div>
        </div>
        <nav aria-label="Owned carousel actions">
          <button v-bind="ownedCarousel.previousButtonProps">‹</button>
          <output
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {{ ownedCarousel.announcement.value }}
          </output>
          <button v-bind="ownedCarousel.nextButtonProps">›</button>
        </nav>
      </section>
      <output
        role="status"
        aria-label="Owned carousel model"
        >{{ ownedCarouselIndex }}</output
      >
      <button
        type="button"
        @click="ownedCarouselIndex = 2"
      >
        Set owned carousel to third
      </button>

      <section
        v-bind="ownedLoopedCarousel.rootProps"
        data-scope="carousel"
        data-part="root"
        class="owned-carousel"
      >
        <div
          v-bind="ownedLoopedCarousel.viewportProps"
          data-scope="carousel"
          data-part="viewport"
          class="viewport"
        >
          <div class="owned-layout-wrapper">
            <div class="slides">
              <article
                v-for="(item, itemIndex) in carouselItems"
                :key="item.key"
                v-bind="ownedLoopedCarousel.slideProps(item, itemIndex)"
                data-scope="carousel"
                data-part="slide"
                class="slide"
              >
                <h2 v-bind="ownedLoopedCarousel.slideLabelProps(itemIndex)">
                  {{ item.label }}
                  <span class="position">
                    , {{ ownedLoopedCarousel.slidePosition(item, itemIndex) }}
                  </span>
                </h2>
              </article>
            </div>
          </div>
        </div>
        <nav aria-label="Owned looped carousel actions">
          <button v-bind="ownedLoopedCarousel.previousButtonProps">‹</button>
          <output
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {{ ownedLoopedCarousel.announcement.value }}
          </output>
          <button v-bind="ownedLoopedCarousel.nextButtonProps">›</button>
        </nav>
      </section>
      <output
        role="status"
        aria-label="Owned looped carousel model"
      >
        {{ ownedLoopedCarouselIndex }}
      </output>

      <section
        v-bind="ownedRejectedCarousel.rootProps"
        data-scope="carousel"
        data-part="root"
        class="owned-carousel"
      >
        <div
          v-bind="ownedRejectedCarousel.viewportProps"
          data-scope="carousel"
          data-part="viewport"
          class="viewport"
        >
          <div class="owned-layout-wrapper">
            <div class="slides">
              <article
                v-for="(item, itemIndex) in carouselItems"
                :key="item.key"
                v-bind="ownedRejectedCarousel.slideProps(item, itemIndex)"
                data-scope="carousel"
                data-part="slide"
                class="slide"
              >
                <h2 v-bind="ownedRejectedCarousel.slideLabelProps(itemIndex)">
                  {{ item.label }}
                  <span class="position">
                    , {{ ownedRejectedCarousel.slidePosition(item, itemIndex) }}
                  </span>
                </h2>
              </article>
            </div>
          </div>
        </div>
        <nav aria-label="Owned locked carousel actions">
          <button v-bind="ownedRejectedCarousel.previousButtonProps">‹</button>
          <output
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {{ ownedRejectedCarousel.announcement.value }}
          </output>
          <button v-bind="ownedRejectedCarousel.nextButtonProps">›</button>
        </nav>
      </section>
      <output
        role="status"
        aria-label="Owned locked carousel model"
      >
        {{ ownedRejectedCarouselSource }}
      </output>
      <output
        role="status"
        aria-label="Owned locked carousel requests"
      >
        {{ ownedRejectedCarouselRequests }}
      </output>

      <section
        v-bind="ownedOutOfRangeCarousel.rootProps"
        data-scope="carousel"
        data-part="root"
        class="owned-carousel"
      >
        <div
          v-bind="ownedOutOfRangeCarousel.viewportProps"
          data-scope="carousel"
          data-part="viewport"
          class="viewport"
        >
          <div class="owned-layout-wrapper">
            <div class="slides">
              <article
                v-for="(item, itemIndex) in carouselItems"
                :key="item.key"
                v-bind="ownedOutOfRangeCarousel.slideProps(item, itemIndex)"
                data-scope="carousel"
                data-part="slide"
                class="slide"
              >
                <h2 v-bind="ownedOutOfRangeCarousel.slideLabelProps(itemIndex)">
                  {{ item.label }}
                  <span class="position">
                    , {{ ownedOutOfRangeCarousel.slidePosition(item, itemIndex) }}
                  </span>
                </h2>
              </article>
            </div>
          </div>
        </div>
        <nav aria-label="Owned bounded carousel actions">
          <button v-bind="ownedOutOfRangeCarousel.previousButtonProps">‹</button>
          <output
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {{ ownedOutOfRangeCarousel.announcement.value }}
          </output>
          <button v-bind="ownedOutOfRangeCarousel.nextButtonProps">›</button>
        </nav>
      </section>
      <output
        role="status"
        aria-label="Owned bounded carousel model"
      >
        {{ ownedOutOfRangeCarouselIndex }}
      </output>

      <section
        v-bind="disabledCarousel.rootProps"
        data-scope="carousel"
        data-part="root"
        class="owned-carousel"
      >
        <div
          v-bind="disabledCarousel.viewportProps"
          data-scope="carousel"
          data-part="viewport"
          class="viewport"
        >
          <div class="owned-layout-wrapper">
            <div class="slides">
              <article
                v-for="(item, itemIndex) in carouselItems"
                :key="item.key"
                v-bind="disabledCarousel.slideProps(item, itemIndex)"
                data-scope="carousel"
                data-part="slide"
                class="slide"
              >
                <h2 v-bind="disabledCarousel.slideLabelProps(itemIndex)">
                  {{ item.label }} disabled
                  <span class="position"
                    >, {{ disabledCarousel.slidePosition(item, itemIndex) }}</span
                  >
                </h2>
              </article>
            </div>
          </div>
        </div>
        <nav aria-label="Owned disabled carousel actions">
          <button v-bind="disabledCarousel.previousButtonProps">‹</button>
          <output
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {{ disabledCarousel.announcement.value }}
          </output>
          <button v-bind="disabledCarousel.nextButtonProps">›</button>
        </nav>
      </section>
      <output
        role="status"
        aria-label="Owned disabled carousel model"
      >
        {{ disabledCarouselIndex }}
      </output>
      <button
        type="button"
        @click="disabledCarouselIndex = 1"
      >
        Set owned disabled carousel to second
      </button>
    </section>

    <section aria-labelledby="owned-combobox-heading">
      <h1 id="owned-combobox-heading">Owned Combobox contract</h1>
      <owned-combobox-contract-fixture
        v-model="ownedComboboxInput"
        v-model:selected="ownedComboboxSelected"
        label="Owned framework"
        :items="ownedComboboxItems"
      />
      <output
        role="status"
        aria-label="Owned combobox input"
        >{{ ownedComboboxInput }}</output
      >
      <output
        role="status"
        aria-label="Owned combobox selection"
        >{{ ownedComboboxSelected ?? "none" }}</output
      >
      <button
        type="button"
        @click="ownedComboboxItems = ownedComboboxItems.filter((item) => item.key !== 'vue')"
      >
        Remove owned active option
      </button>
      <button type="button">Dismiss owned combobox popup</button>

      <owned-combobox-contract-fixture
        v-model="ownedDisabledComboboxInput"
        v-model:selected="ownedDisabledComboboxSelected"
        label="Owned disabled framework"
        :items="comboboxSeed"
        disabled
      />
      <output
        role="status"
        aria-label="Owned disabled combobox input"
      >
        {{ ownedDisabledComboboxInput }}
      </output>
      <output
        role="status"
        aria-label="Owned disabled combobox selection"
      >
        {{ ownedDisabledComboboxSelected ?? "none" }}
      </output>
      <button
        type="button"
        @click="ownedDisabledComboboxSelected = 'solid'"
      >
        Set owned disabled combobox to Solid
      </button>

      <owned-combobox-contract-fixture
        v-model="ownedReadOnlyComboboxInput"
        v-model:selected="ownedReadOnlyComboboxSelected"
        label="Owned readonly framework"
        :items="comboboxSeed"
        read-only
      />
      <output
        role="status"
        aria-label="Owned readonly combobox input"
      >
        {{ ownedReadOnlyComboboxInput }}
      </output>
      <output
        role="status"
        aria-label="Owned readonly combobox selection"
      >
        {{ ownedReadOnlyComboboxSelected ?? "none" }}
      </output>

      <owned-combobox-contract-fixture
        v-model="ownedControlledComboboxInput"
        v-model:selected="ownedControlledComboboxSelected"
        label="Owned controlled framework"
        :items="comboboxSeed"
      />
      <output
        role="status"
        aria-label="Owned controlled combobox input"
      >
        {{ ownedControlledComboboxInputSource }}
      </output>
      <output
        role="status"
        aria-label="Owned controlled combobox selection"
      >
        {{ ownedControlledComboboxSelectedSource ?? "none" }}
      </output>
      <output
        role="status"
        aria-label="Owned controlled combobox input requests"
      >
        {{ ownedControlledComboboxInputRequests }}
      </output>
      <output
        role="status"
        aria-label="Owned controlled combobox selection requests"
      >
        {{ ownedControlledComboboxSelectionRequests }}
      </output>
    </section>

    <div
      data-scope="dialog"
      data-part="root"
    >
      <button
        data-scope="dialog"
        data-part="trigger"
        type="button"
        v-bind="ownedDialog.triggerProps"
      >
        Open owned dialog
      </button>
      <dialog
        data-scope="dialog"
        data-part="surface"
        v-bind="ownedDialog.dialogProps"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
      >
        <nav aria-label="Owned dialog actions">
          <button
            v-dialog-close="ownedDialog.id"
            data-scope="dialog"
            data-part="close"
            type="button"
          >
            Dismiss owned dialog
          </button>
          <button
            v-dialog-close="ownedDialog.id"
            type="button"
          >
            Save owned dialog
          </button>
        </nav>
        <article>
          <p
            data-scope="dialog"
            data-part="description"
            :id="descriptionId"
          >
            Its footer moved before the title and body.
          </p>
          <section><p>Owned applications may rearrange this hierarchy.</p></section>
          <h1
            data-scope="dialog"
            data-part="title"
            :id="titleId"
          >
            Owned profile editor
          </h1>
        </article>
      </dialog>
    </div>
    <output
      role="status"
      aria-label="Owned dialog model"
    >
      {{ ownedDialog.open }}
    </output>

    <div
      data-scope="alert-dialog"
      data-part="root"
    >
      <button
        v-bind="ownedAlertDialog.triggerProps"
        data-scope="alert-dialog"
        data-part="trigger"
        type="button"
      >
        Review owned contract deletion
      </button>
      <dialog
        v-bind="ownedAlertDialog.dialogProps"
        data-scope="alert-dialog"
        data-part="surface"
        role="alertdialog"
        :aria-labelledby="ownedAlertTitleId"
        :aria-describedby="ownedAlertDescriptionId"
      >
        <article>
          <p
            :id="ownedAlertDescriptionId"
            data-scope="alert-dialog"
            data-part="description"
          >
            This owned contract cannot be restored.
          </p>
          <h1
            :id="ownedAlertTitleId"
            data-scope="alert-dialog"
            data-part="title"
          >
            Delete owned contract?
          </h1>
        </article>
        <footer>
          <button
            v-dialog-close="ownedAlertDialog.id"
            data-scope="alert-dialog"
            data-part="cancel"
            type="button"
            autofocus
          >
            Keep owned contract
          </button>
          <button
            v-dialog-close="ownedAlertDialog.id"
            data-scope="alert-dialog"
            data-part="action"
            type="button"
          >
            Delete owned contract
          </button>
        </footer>
      </dialog>
    </div>
    <output
      role="status"
      aria-label="Owned alert dialog model"
    >
      {{ ownedAlertDialogOpen }}
    </output>

    <section>
      <section
        v-for="item in items"
        :key="item.key"
        v-bind="ownedTabs.panelProps(item)"
      >
        <p>{{ item.label }} panel</p>
      </section>
      <div
        v-bind="ownedTabs.tablistProps"
        role="tablist"
      >
        <button
          v-for="item in items"
          :key="item.key"
          v-bind="ownedTabs.tabProps(item)"
        >
          {{ item.label }}
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.n-button.package-styled-button {
  --button-tone: danger;
  --button-appearance: outlined;
  --button-shape: rounded;
  --button-size: small;
}

.owned-button[data-scope="button"][data-part="root"] {
  display: inline-flex;
  align-items: center;
  min-block-size: var(--_button-min-block-size, 2rem);
  padding: var(--_button-padding, 0.25rem 0.75rem);
  border: 1px solid var(--_button-tone-border, currentcolor);
  border-radius: var(--_button-radius, 0.25rem);
  background: var(--_button-background, Canvas);
  color: var(--_button-tone-color, CanvasText);
  font: inherit;

  &:focus-visible {
    outline: 2px solid Highlight;
  }

  &.-styled {
    --button-tone: danger;
    --button-appearance: outlined;
    --button-shape: rounded;
    --button-size: small;
  }
}

.owned-carousel {
  display: grid;
  gap: 0.5rem;
  max-inline-size: 32rem;

  > .viewport {
    overflow: auto;
    scroll-snap-type: inline mandatory;
    scroll-behavior: smooth;

    > .owned-layout-wrapper > .slides {
      display: flex;
      inline-size: 100%;

      > .slide {
        box-sizing: border-box;
        flex: 0 0 100%;
        padding: 1rem;
        border: 1px solid currentcolor;
        scroll-snap-align: start;

        > h2 {
          margin: 0;

          > .position {
            position: absolute;
            inline-size: 1px;
            block-size: 1px;
            overflow: hidden;
            clip-path: inset(50%);
          }
        }
      }
    }
  }

  > nav {
    display: flex;
    justify-content: space-between;
  }
}

@media (prefers-reduced-motion: reduce) {
  .owned-carousel > .viewport {
    scroll-behavior: auto;
  }
}
</style>
