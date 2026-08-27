<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import {
  Autocomplete,
  Carousel,
  ContextMenu,
  Menubar,
  MultiSelect,
  NavigationMenu,
  type NavigationMenuItem,
  OTPField,
  Resizable,
  TagsInput,
  Toolbar,
  Tree,
} from "@nagi-labs/nagi-ui/components";
import { assertNagiDom } from "@nagi-labs/nagi-ui";

declare global {
  interface Window { __assertExpandedNagiDom?: () => void }
}

const places = [
  { key: "jp", label: "Japan" },
  { key: "jm", label: "Jamaica" },
  { key: "jo", label: "Jordan" },
];
const autocomplete = ref("Custom destination");
const selected = ref<readonly string[]>(["jp"]);
const tags = ref<readonly string[]>(["vue"]);
const emptyCountries = ref<readonly string[]>([]);
const emptyTags = ref<readonly string[]>([]);
const otp = ref("12");
const carouselIndex = ref(0);
const disabledCarouselIndex = ref(0);
const localizedCarouselIndex = ref(1);
const rtlCarouselIndex = ref(1);
const panelSize = ref(50);
const rtlPanelSize = ref(50);
const selectedTree = ref<string | null>(null);
const expandedTree = ref<readonly string[]>([]);
const action = ref("No action yet");
const submission = ref("No submission yet");
const lockedContextOpen = ref(false);
const contextOpen = ref(false);
const lockedMenubarOpen = ref(false);
const lockedNavigationOpen = ref(false);
const showUnmountContext = ref(true);
const lockedAutocomplete = computed({ get: () => "Locked destination", set: () => {} });
const lockedCountries = computed<readonly string[]>({ get: () => ["jp"], set: () => {} });
const lockedTopics = computed<readonly string[]>({ get: () => ["vue"], set: () => {} });
const lockedRequiredTopics = computed<readonly string[]>({ get: () => [], set: () => {} });
const lockedOTP = computed({ get: () => "9876", set: () => {} });
const lockedContextModel = computed({ get: () => lockedContextOpen.value, set: () => {} });
const lockedMenubarModel = computed({ get: () => lockedMenubarOpen.value, set: () => {} });
const lockedNavigationModel = computed({ get: () => lockedNavigationOpen.value, set: () => {} });

const carouselItems = [
  { key: "one", label: "First release", description: "Native HTML foundation" },
  { key: "two", label: "Second release", description: "ARIA coordination" },
  { key: "three", label: "Third release", description: "Ownable blueprints" },
];
const contextItems = [
  {
    key: "copy",
    label: "Copy",
    href: "#context-link",
    navigate: () => { action.value = "context-router"; },
  },
  {
    key: "target",
    label: "Open target",
    href: "/expanded.html#context-target",
    target: "_blank",
    rel: "noreferrer",
  },
  { key: "rename", label: "Rename" },
  { key: "delete", label: "Delete", disabled: true },
];
const menus = ref([
  {
    key: "file",
    label: "File",
    items: [
      { key: "new", label: "New file" },
      { key: "open", label: "Open file", href: "#menubar-link" },
    ],
  },
  {
    key: "edit",
    label: "Edit",
    items: [
      { key: "copy", label: "Copy item" },
      { key: "paste", label: "Paste item" },
    ],
  },
]);
const navigationItems = ref<NavigationMenuItem[]>([
  {
    key: "products",
    label: "Products",
    children: [
      {
        key: "ui",
        label: "Nagi UI",
        href: "#ui",
        description: "Native-first Vue components",
        navigate: () => { action.value = "navigation-router"; },
        prefetch: () => { action.value = "navigation-prefetch"; },
      },
      { key: "css", label: "Nagi CSS", href: "#css", description: "Compile-time CSS checks" },
    ],
  },
  { key: "about", label: "About", href: "#about", target: "_self" },
]);
const toolbarItems = ref([
  { key: "bold", label: "Bold" },
  { key: "italic", label: "Italic", disabled: true },
  { key: "link", label: "Add link" },
]);
const treeItems = ref([
  {
    key: "fruit",
    label: "Fruit",
    children: [
      { key: "apple", label: "Apple" },
      { key: "citrus", label: "Citrus", children: [{ key: "lemon", label: "Lemon" }] },
    ],
  },
  { key: "vegetable", label: "Vegetable" },
]);

function submit(event: SubmitEvent) {
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return;
  const values: Record<string, string | string[]> = {};
  for (const [name, value] of new FormData(form)) {
    if (typeof value !== "string") continue;
    const previous = values[name];
    values[name] = previous === undefined
      ? value
      : Array.isArray(previous) ? [...previous, value] : [previous, value];
  }
  submission.value = JSON.stringify(values);
}

onMounted(() => {
  window.__assertExpandedNagiDom = () => assertNagiDom(document);
});
onBeforeUnmount(() => {
  delete window.__assertExpandedNagiDom;
});
</script>

<template>
  <main>
    <h1>Expanded catalog components</h1>

    <section aria-labelledby="forms-heading">
      <h2 id="forms-heading">Text and collection fields</h2>
      <form id="expanded-form" @submit.prevent="submit">
        <Autocomplete
          v-model="autocomplete"
          label="Destination"
          name="destination"
          :items="places"
        />
        <MultiSelect
          v-model="selected"
          label="Countries"
          name="countries"
          :items="places"
          aria-describedby="countries-help"
          required
        />
        <span id="countries-help">Choose one or more countries.</span>
        <TagsInput v-model="tags" label="Topics" name="topics" aria-describedby="topics-help" required />
        <span id="topics-help">Enter a topic and press Enter.</span>
        <OTPField
          v-model="otp"
          label="Verification code"
          name="code"
          :length="4"
          aria-describedby="otp-help"
          enterkeyhint="done"
          required
        />
        <span id="otp-help">Enter the four-character code.</span>
        <MultiSelect label="Disabled countries" name="disabledCountries" :items="places" :model-value="['jm']" disabled />
        <TagsInput label="Disabled topics" name="disabledTopics" :model-value="['ignored']" disabled />
        <OTPField label="Disabled code" name="disabledCode" model-value="9999" disabled />
        <div class="actions">
          <button type="submit">Submit expanded form</button>
          <button type="reset">Reset expanded form</button>
        </div>
      </form>
      <output data-testid="autocomplete-model">{{ autocomplete }}</output>
      <output data-testid="multi-model">{{ selected.join(',') }}</output>
      <output data-testid="tags-model">{{ tags.join(',') }}</output>
      <output data-testid="otp-model">{{ otp }}</output>
      <output data-testid="submission">{{ submission }}</output>
      <form @submit.prevent>
        <MultiSelect v-model="emptyCountries" label="Empty required countries" :items="places" required />
        <button type="submit">Submit empty countries</button>
      </form>
      <form @submit.prevent>
        <TagsInput v-model="emptyTags" label="Empty required topics" required />
        <button type="submit">Submit empty topics</button>
      </form>
      <Autocomplete v-model="lockedAutocomplete" label="Locked destination" :items="places" />
      <MultiSelect v-model="lockedCountries" label="Locked countries" :items="places" />
      <TagsInput v-model="lockedTopics" label="Locked topics" />
      <form @submit.prevent>
        <TagsInput v-model="lockedRequiredTopics" label="Locked required topics" required />
        <button type="submit">Submit locked required topics</button>
      </form>
      <OTPField v-model="lockedOTP" label="Locked verification code" :length="4" />
    </section>

    <section aria-labelledby="movement-heading">
      <h2 id="movement-heading">Movement and layout</h2>
      <Toolbar
        label="Formatting"
        :items="toolbarItems"
        @activate="(item) => { action = `toolbar:${item.key}`; }"
      />
      <button
        data-testid="remove-active-toolbar-item"
        type="button"
        @click="toolbarItems = toolbarItems.filter((item) => item.key !== 'bold')"
      >Remove active toolbar item</button>
      <Toolbar label="RTL formatting" dir="rtl" :items="toolbarItems" />
      <Carousel v-model="carouselIndex" label="Release highlights" :items="carouselItems" />
      <output data-testid="carousel-model">{{ carouselIndex }}</output>
      <button type="button" @click="carouselIndex = 2">Show third release</button>
      <Carousel v-model="disabledCarouselIndex" label="Disabled release highlights" :items="carouselItems" disabled />
      <output data-testid="disabled-carousel-model">{{ disabledCarouselIndex }}</output>
      <Carousel
        v-model="localizedCarouselIndex"
        label="注目記事"
        track-label="記事一覧"
        :items="carouselItems"
        :format-announcement="(position, count) => position === null ? '記事なし' : `${count}件中${position}件目`"
        :format-slide-label="(_item, position, count) => `${count}件中${position}件目の記事`"
      />
      <output data-testid="localized-carousel-model">{{ localizedCarouselIndex }}</output>
      <div dir="rtl">
        <Carousel v-model="rtlCarouselIndex" label="RTL highlights" :items="carouselItems" />
      </div>
      <output data-testid="rtl-carousel-model">{{ rtlCarouselIndex }}</output>
      <Resizable v-model="panelSize" label="Workspace panels">
        <template #first><p>Editor panel</p></template>
        <template #second><p>Preview panel</p></template>
      </Resizable>
      <Resizable v-model="panelSize" class="vertical-resizable" label="Vertical workspace panels" orientation="vertical">
        <template #first><p>Top panel</p></template>
        <template #second><p>Bottom panel</p></template>
      </Resizable>
      <Resizable v-model="rtlPanelSize" label="RTL workspace panels" dir="rtl">
        <template #first><p>RTL primary panel</p></template>
        <template #second><p>RTL secondary panel</p></template>
      </Resizable>
      <output data-testid="resizable-model">{{ panelSize }}</output>
      <output data-testid="rtl-resizable-model">{{ rtlPanelSize }}</output>
    </section>

    <section aria-labelledby="menus-heading">
      <h2 id="menus-heading">Menus and navigation</h2>
      <ContextMenu
        v-model:open="contextOpen"
        :items="contextItems"
        @select="(item) => { action = `context:${item.key}`; }"
      >
        <a class="context-target" href="#context-target-activated" @click="action = 'context-target-activated'">Open the project context menu here</a>
      </ContextMenu>
      <button type="button" @click="contextOpen = false">Close project context menu</button>
      <Menubar
        label="Application"
        :items="menus"
        @select="(item) => { action = `menubar:${item.key}`; }"
      />
      <button
        data-testid="remove-active-menubar-menu"
        type="button"
        @click="menus = menus.filter((menu) => menu.key !== 'file')"
      >Remove active menubar menu</button>
      <Menubar label="RTL application" dir="rtl" :items="menus" />
      <NavigationMenu label="Primary navigation" :items="navigationItems" />
      <button
        data-testid="remove-active-navigation-item"
        type="button"
        @click="navigationItems = navigationItems.filter((item) => item.key !== 'products')"
      >Remove active navigation item</button>
      <button type="button" @click="lockedContextOpen = true">Externally open context menu</button>
      <button type="button" @click="lockedContextOpen = false">Externally close context menu</button>
      <ContextMenu v-model:open="lockedContextModel" label="Locked context menu" :items="contextItems">
        <button type="button">Locked context target</button>
      </ContextMenu>
      <ContextMenu v-if="showUnmountContext" label="Unmount context menu" :items="contextItems" :long-press-delay="100">
        <button type="button">Unmount context target</button>
      </ContextMenu>
      <button type="button" @click="showUnmountContext = false">Unmount context menu</button>
      <button type="button" @click="lockedMenubarOpen = true">Externally open menubar</button>
      <button type="button" @click="lockedMenubarOpen = false">Externally close menubar</button>
      <Menubar v-model:open="lockedMenubarModel" label="Locked application" :items="menus" />
      <button type="button" @click="lockedNavigationOpen = true">Externally open navigation</button>
      <button type="button" @click="lockedNavigationOpen = false">Externally close navigation</button>
      <NavigationMenu v-model:open="lockedNavigationModel" label="Locked navigation" :items="navigationItems" />
    </section>

    <section aria-labelledby="tree-heading">
      <h2 id="tree-heading">Tree</h2>
      <Tree
        v-model="selectedTree"
        v-model:expanded="expandedTree"
        label="Project files"
        :items="treeItems"
      />
      <button type="button" @click="treeItems = treeItems.filter((item) => item.key !== 'fruit')">Remove fruit branch</button>
      <output data-testid="tree-model">{{ selectedTree }}</output>
      <output data-testid="tree-expanded">{{ expandedTree.join(',') }}</output>
    </section>

    <output data-testid="action">{{ action }}</output>
    <button type="button">Outside target</button>
  </main>
</template>

<style scoped>
main { display: grid; gap: 2rem; max-inline-size: 56rem; margin-inline: auto; padding: 2rem; font-family: system-ui, sans-serif; }
section, form { display: grid; gap: 1rem; }
h1, h2, p { margin: 0; }
.actions { display: flex; gap: .5rem; }
.context-target { min-block-size: 5rem; padding: 1rem; border: 1px dashed currentColor; }
.n-carousel, .n-resizable { max-inline-size: 36rem; }
.vertical-resizable { block-size: 20rem; }
output { display: block; overflow-wrap: anywhere; }
</style>
