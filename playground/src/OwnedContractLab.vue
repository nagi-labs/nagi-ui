<script setup lang="ts">
import { useCarousel, useCombobox, useDialog, useTabs, vDialogClose } from "@nagi-labs/nagi-ui";
import { useAlertDialog, useButton } from "@nagi-labs/nagi-ui/component-controls";
import {
  NAlertDialog,
  NButton,
  NCarousel,
  NCombobox,
  NDialog,
} from "@nagi-labs/nagi-ui/components";
import { ref } from "vue";

const comboboxSeed: ReadonlyArray<{ key: string; label: string; disabled?: boolean }> = [
  { key: "vue", label: "Vue" },
  { key: "react", label: "React", disabled: true },
  { key: "svelte", label: "Svelte" },
  { key: "solid", label: "Solid" },
];
const packageComboboxItems = ref([...comboboxSeed]);
const packageComboboxInput = ref("");
const packageComboboxSelected = ref<string | null>(null);
const ownedComboboxItems = ref([...comboboxSeed]);
const ownedComboboxInput = ref("");
const ownedComboboxSelected = ref<string | null>(null);
const ownedCombobox = useCombobox({
  items: ownedComboboxItems,
  getKey: (item) => item.key,
  getTextValue: (item) => item.label,
  isDisabled: (item) => item.disabled ?? false,
  inputValue: ownedComboboxInput,
  selected: ownedComboboxSelected,
});
const ownedComboboxLabelId = `${ownedCombobox.id}-label`;

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
        <n-button type="submit">Package submit</n-button>
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

      <n-dialog
        v-model:open="packageDialogOpen"
        id="package-owned-contract-dialog"
        trigger-label="Open package definition dialog"
        title="Package definition dialog"
        description="A package dialog exercising native modal state."
      >
        <p>Package modal content.</p>
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
        <button
          v-bind="enabledButton.buttonProps"
          type="submit"
          data-scope="button"
          data-part="root"
          class="owned-button"
        >
          Owned submit
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
      <div
        data-scope="combobox"
        data-part="root"
        class="owned-combobox"
      >
        <label
          :id="ownedComboboxLabelId"
          :for="ownedCombobox.inputId"
          >Owned framework</label
        >
        <div class="owned-control-wrapper">
          <input
            data-scope="combobox"
            data-part="input"
            type="text"
            :aria-labelledby="ownedComboboxLabelId"
            v-bind="ownedCombobox.inputProps"
          />
        </div>
        <div
          data-scope="combobox"
          data-part="popup"
          popover
          v-bind="ownedCombobox.popupProps"
        >
          <div class="owned-popup-wrapper">
            <ul
              data-scope="combobox"
              data-part="listbox"
              :aria-labelledby="ownedComboboxLabelId"
              v-bind="ownedCombobox.listboxProps"
            >
              <li
                v-for="item in ownedCombobox.visibleItems.value"
                :key="item.key"
                data-scope="combobox"
                data-part="option"
                v-bind="ownedCombobox.optionProps(item)"
              >
                {{ item.label }}
              </li>
            </ul>
          </div>
        </div>
      </div>
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
      <nav v-bind="ownedTabs.tablistProps">
        <button
          v-for="item in items"
          :key="item.key"
          v-bind="ownedTabs.tabProps(item)"
        >
          {{ item.label }}
        </button>
      </nav>
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
