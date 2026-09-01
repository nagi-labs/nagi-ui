<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { NButton, NCarousel } from "@nagi-labs/nagi-ui/components";
import { verifyAnatomy, type AnatomyIssue } from "@nagi-labs/nagi-ui";
import { buttonDefinition } from "@nagi-labs/nagi-ui/blueprints/button/button.definition.ts";
import { carouselDefinition } from "@nagi-labs/nagi-ui/blueprints/carousel/carousel.definition.ts";

/**
 * Functional anatomy verification against real rendered DOM.
 *
 * The "edited" carousel reproduces the mistake an owner is most likely to make:
 * wrapping the slides in a layout element. The current contract deliberately
 * accepts that edit: `useCarousel` discovers semantic slide descendants inside
 * its registered viewport, and anatomy verifies the explicit part scope.
 */

const items = [
  { key: "a", label: "First", description: "Slide one." },
  { key: "b", label: "Second", description: "Slide two." },
  { key: "c", label: "Third", description: "Slide three." },
];

const index = ref(0);
const canonicalCarousel = useTemplateRef<HTMLElement>("canonicalCarousel");
const editedCarousel = useTemplateRef<HTMLElement>("editedCarousel");
const canonicalButton = useTemplateRef<HTMLElement>("canonicalButton");

const results = ref<Record<string, readonly AnatomyIssue[]>>({});

function format(issues: readonly AnatomyIssue[]) {
  return issues.length === 0 ? "ok" : issues.map((issue) => `${issue.code}:${issue.part}`).join(" ");
}

function run() {
  const edited = editedCarousel.value;
  const editedRegion = edited?.querySelector<HTMLElement>('[role="region"]');
  results.value = {
    button: canonicalButton.value ? verifyAnatomy(buttonDefinition, canonicalButton.value) : [],
    canonical: canonicalCarousel.value
      ? verifyAnatomy(carouselDefinition, canonicalCarousel.value)
      : [],
    edited: editedRegion ? verifyAnatomy(carouselDefinition, editedRegion) : [],
  };
}

onMounted(run);
</script>

<template>
  <main class="lab">
    <h1>Anatomy verification</h1>

    <section aria-labelledby="canonical-heading">
      <h2 id="canonical-heading">Canonical</h2>
      <div ref="canonicalButton">
        <n-button>Canonical button</n-button>
      </div>
      <div ref="canonicalCarousel">
        <n-carousel v-model="index" :items="items" label="Canonical content" />
      </div>
    </section>

    <section ref="editedCarousel" aria-labelledby="edited-heading">
      <h2 id="edited-heading">Owner layout wrapper that preserves the contract</h2>
      <!--
        Hand-written copy of the Carousel Blueprint with one change: the slides
        are wrapped in an additional layout element. Anatomy requires only
        containment in the behavior viewport, not immediate parentage.
      -->
      <section
        data-scope="carousel"
        data-part="root"
        role="region"
        aria-roledescription="carousel"
        aria-label="Edited content"
        class="n-carousel"
      >
        <div class="actions">
          <button type="button" aria-label="Previous slide">‹</button>
          <button type="button" aria-label="Next slide">›</button>
        </div>
        <div
          data-scope="carousel"
          data-part="viewport"
          role="group"
          aria-roledescription="slides"
          aria-label="Edited content"
          class="unit -viewport"
        >
          <div class="unit -rail">
            <article
              v-for="(item, itemIndex) in items"
              :key="item.key"
              data-scope="carousel"
              data-part="slide"
              role="group"
              aria-roledescription="slide"
              :aria-label="`${item.label}, ${itemIndex + 1} / ${items.length}`"
              class="article -slide"
            >
              <h3>{{ item.label }}</h3>
            </article>
          </div>
        </div>
      </section>
    </section>

    <section aria-labelledby="results-heading">
      <h2 id="results-heading">Results</h2>
      <output id="anatomy-button">{{ format(results.button ?? []) }}</output>
      <output id="anatomy-canonical">{{ format(results.canonical ?? []) }}</output>
      <output id="anatomy-edited">{{ format(results.edited ?? []) }}</output>
      <p id="anatomy-edited-message">{{ (results.edited ?? [])[0]?.message ?? "" }}</p>
    </section>
  </main>
</template>

<style scoped>
.lab {
  display: grid;
  gap: 1.5rem;
  padding: 1.5rem;
  font-family: system-ui, sans-serif;

  > section > output {
    display: block;
    font-family: ui-monospace, monospace;
  }
}
</style>
