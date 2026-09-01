<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import {
  NAutocomplete,
  NCarousel,
  NContextMenu,
  NMenubar,
  NMultiSelect,
  NNavigationMenu,
  type NavigationMenuItem,
  NOtpField,
  NResizable,
  NTagsInput,
  NToolbar,
  NTree,
} from "@nagi-labs/nagi-ui/components";
import { assertNagiDom } from "@nagi-labs/nagi-ui";

declare global {
  interface Window {
    __assertExpandedNagiDom?: () => void;
  }
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
    navigate: () => {
      action.value = "context-router";
    },
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
        navigate: () => {
          action.value = "navigation-router";
        },
        prefetch: () => {
          action.value = "navigation-prefetch";
        },
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
    values[name] =
      previous === undefined
        ? value
        : Array.isArray(previous)
          ? [...previous, value]
          : [previous, value];
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
      <form
        id="expanded-form"
        @submit.prevent="submit"
      >
        <n-autocomplete
          v-model="autocomplete"
          label="Destination"
          name="destination"
          :items="places"
        />
        <n-multi-select
          v-model="selected"
          label="Countries"
          name="countries"
          :items="places"
          aria-describedby="countries-help"
          required
        />
        <span id="countries-help">Choose one or more countries.</span>
        <n-tags-input
          v-model="tags"
          label="Topics"
          name="topics"
          aria-describedby="topics-help"
          required
        />
        <span id="topics-help">Enter a topic and press Enter.</span>
        <n-otp-field
          v-model="otp"
          label="Verification code"
          name="code"
          :length="4"
          aria-describedby="otp-help"
          enterkeyhint="done"
          required
        />
        <span id="otp-help">Enter the four-character code.</span>
        <n-multi-select
          label="Disabled countries"
          name="disabledCountries"
          :items="places"
          :model-value="['jm']"
          disabled
        />
        <n-tags-input
          label="Disabled topics"
          name="disabledTopics"
          :model-value="['ignored']"
          disabled
        />
        <n-otp-field
          label="Disabled code"
          name="disabledCode"
          model-value="9999"
          disabled
        />
        <div class="actions">
          <button type="submit">Submit expanded form</button>
          <button type="reset">Reset expanded form</button>
        </div>
      </form>
      <output id="autocomplete-model">{{ autocomplete }}</output>
      <output id="multi-model">{{ selected.join(",") }}</output>
      <output id="tags-model">{{ tags.join(",") }}</output>
      <output id="otp-model">{{ otp }}</output>
      <output id="submission">{{ submission }}</output>
      <form @submit.prevent>
        <n-multi-select
          v-model="emptyCountries"
          label="Empty required countries"
          :items="places"
          required
        />
        <button type="submit">Submit empty countries</button>
      </form>
      <form @submit.prevent>
        <n-tags-input
          v-model="emptyTags"
          label="Empty required topics"
          required
        />
        <button type="submit">Submit empty topics</button>
      </form>
      <n-autocomplete
        v-model="lockedAutocomplete"
        label="Locked destination"
        :items="places"
      />
      <n-multi-select
        v-model="lockedCountries"
        label="Locked countries"
        :items="places"
      />
      <n-tags-input
        v-model="lockedTopics"
        label="Locked topics"
      />
      <form @submit.prevent>
        <n-tags-input
          v-model="lockedRequiredTopics"
          label="Locked required topics"
          required
        />
        <button type="submit">Submit locked required topics</button>
      </form>
      <n-otp-field
        v-model="lockedOTP"
        label="Locked verification code"
        :length="4"
      />
    </section>

    <section aria-labelledby="movement-heading">
      <h2 id="movement-heading">Movement and layout</h2>
      <n-toolbar
        label="Formatting"
        :items="toolbarItems"
        @activate="
          (item) => {
            action = `toolbar:${item.key}`;
          }
        "
      />
      <button
        id="remove-active-toolbar-item"
        type="button"
        @click="toolbarItems = toolbarItems.filter((item) => item.key !== 'bold')"
      >
        Remove active toolbar item
      </button>
      <n-toolbar
        label="RTL formatting"
        dir="rtl"
        :items="toolbarItems"
      />
      <n-carousel
        v-model="carouselIndex"
        label="Release highlights"
        :items="carouselItems"
        landmark
      />
      <output id="carousel-model">{{ carouselIndex }}</output>
      <button
        type="button"
        @click="carouselIndex = 2"
      >
        Show third release
      </button>
      <n-carousel
        v-model="disabledCarouselIndex"
        label="Disabled release highlights"
        :items="carouselItems"
        landmark
        disabled
      />
      <output id="disabled-carousel-model">{{ disabledCarouselIndex }}</output>
      <n-carousel
        v-model="localizedCarouselIndex"
        label="注目記事"
        slides-label="記事一覧"
        carousel-role-description="カルーセル"
        slides-role-description="スライド一覧"
        slide-role-description="スライド"
        :items="carouselItems"
        :format-announcement="
          (position, count) => (position === null ? '記事なし' : `${count}件中${position}件目`)
        "
        :format-slide-label="(_item, position, count) => `${count}件中${position}件目の記事`"
      />
      <output id="localized-carousel-model">{{ localizedCarouselIndex }}</output>
      <div dir="rtl">
        <n-carousel
          v-model="rtlCarouselIndex"
          label="RTL highlights"
          :items="carouselItems"
        />
      </div>
      <output id="rtl-carousel-model">{{ rtlCarouselIndex }}</output>
      <n-resizable
        v-model="panelSize"
        label="Workspace panels"
      >
        <template #first>
          <p>Editor panel</p>
        </template>
        <template #second>
          <p>Preview panel</p>
        </template>
      </n-resizable>
      <n-resizable
        v-model="panelSize"
        class="vertical-resizable"
        label="Vertical workspace panels"
        orientation="vertical"
      >
        <template #first>
          <p>Top panel</p>
        </template>
        <template #second>
          <p>Bottom panel</p>
        </template>
      </n-resizable>
      <n-resizable
        v-model="rtlPanelSize"
        label="RTL workspace panels"
        dir="rtl"
      >
        <template #first>
          <p>RTL primary panel</p>
        </template>
        <template #second>
          <p>RTL secondary panel</p>
        </template>
      </n-resizable>
      <output id="resizable-model">{{ panelSize }}</output>
      <output id="rtl-resizable-model">{{ rtlPanelSize }}</output>
    </section>

    <section aria-labelledby="menus-heading">
      <h2 id="menus-heading">Menus and navigation</h2>
      <n-context-menu
        v-model:open="contextOpen"
        :items="contextItems"
        @select="
          (item) => {
            action = `context:${item.key}`;
          }
        "
      >
        <a
          class="context-target"
          href="#context-target-activated"
          @click="action = 'context-target-activated'"
          >Open the project context menu here</a
        >
      </n-context-menu>
      <button
        type="button"
        @click="contextOpen = false"
      >
        Close project context menu
      </button>
      <n-menubar
        label="Application"
        :items="menus"
        @select="
          (item) => {
            action = `menubar:${item.key}`;
          }
        "
      />
      <button
        id="remove-active-menubar-menu"
        type="button"
        @click="menus = menus.filter((menu) => menu.key !== 'file')"
      >
        Remove active menubar menu
      </button>
      <n-menubar
        label="RTL application"
        dir="rtl"
        :items="menus"
      />
      <n-navigation-menu
        label="Primary navigation"
        :items="navigationItems"
      />
      <button
        id="remove-active-navigation-item"
        type="button"
        @click="navigationItems = navigationItems.filter((item) => item.key !== 'products')"
      >
        Remove active navigation item
      </button>
      <button
        type="button"
        @click="lockedContextOpen = true"
      >
        Externally open context menu
      </button>
      <button
        type="button"
        @click="lockedContextOpen = false"
      >
        Externally close context menu
      </button>
      <n-context-menu
        v-model:open="lockedContextModel"
        label="Locked context menu"
        :items="contextItems"
      >
        <button type="button">Locked context target</button>
      </n-context-menu>
      <n-context-menu
        v-if="showUnmountContext"
        label="Unmount context menu"
        :items="contextItems"
        :long-press-delay="100"
      >
        <button type="button">Unmount context target</button>
      </n-context-menu>
      <button
        type="button"
        @click="showUnmountContext = false"
      >
        Unmount context menu
      </button>
      <button
        type="button"
        @click="lockedMenubarOpen = true"
      >
        Externally open menubar
      </button>
      <button
        type="button"
        @click="lockedMenubarOpen = false"
      >
        Externally close menubar
      </button>
      <n-menubar
        v-model:open="lockedMenubarModel"
        label="Locked application"
        :items="menus"
      />
      <button
        type="button"
        @click="lockedNavigationOpen = true"
      >
        Externally open navigation
      </button>
      <button
        type="button"
        @click="lockedNavigationOpen = false"
      >
        Externally close navigation
      </button>
      <n-navigation-menu
        v-model:open="lockedNavigationModel"
        label="Locked navigation"
        :items="navigationItems"
      />
    </section>

    <section aria-labelledby="tree-heading">
      <h2 id="tree-heading">Tree</h2>
      <n-tree
        v-model="selectedTree"
        v-model:expanded="expandedTree"
        label="Project files"
        :items="treeItems"
      />
      <button
        type="button"
        @click="treeItems = treeItems.filter((item) => item.key !== 'fruit')"
      >
        Remove fruit branch
      </button>
      <output id="tree-model">{{ selectedTree }}</output>
      <output id="tree-expanded">{{ expandedTree.join(",") }}</output>
    </section>

    <output id="action">{{ action }}</output>
    <button type="button">Outside target</button>
  </main>
</template>

<style scoped>
main {
  display: grid;
  gap: 2rem;
  max-inline-size: 56rem;
  margin-inline: auto;
  padding: 2rem;
  font-family: system-ui, sans-serif;
}
section,
form {
  display: grid;
  gap: 1rem;
}
h1,
h2,
p {
  margin: 0;
}
.actions {
  display: flex;
  gap: 0.5rem;
}
.context-target {
  min-block-size: 5rem;
  padding: 1rem;
  border: 1px dashed currentColor;
}
.n-carousel,
.n-resizable {
  max-inline-size: 36rem;
}
.vertical-resizable {
  block-size: 20rem;
}
output {
  display: block;
  overflow-wrap: anywhere;
}
</style>
