<script setup lang="ts">
import { onMounted, ref } from "vue"

import NativePopoverDropdown from "../../NativePopoverDropdown.vue"

// Flips to true only once this component hydrates on the client. Under
// `hydrate-after`/`hydrate-never` it stays false until (or forever without)
// hydration — yet the dropdown below still opens, because the wiring is
// native (`popovertarget` + `popover`), not JS (CHARTER §4.5).
const hydrated = ref(false)
onMounted(() => {
  hydrated.value = true
})

const picked = ref("(none)")
const items = [
  { key: "rename", label: "Rename" },
  { key: "duplicate", label: "Duplicate" },
  { key: "delete", label: "Delete" },
]
</script>

<template>
  <div class="dropdown-demo">
    <p class="text">
      component hydrated: <span class="value" :data-hydrated="hydrated">{{ hydrated }}</span>
    </p>
    <NativePopoverDropdown label="Actions" :items="items" @select="picked = $event" />
    <p class="text">
      picked: <span class="value" :data-pick="picked">{{ picked }}</span>
    </p>
  </div>
</template>

<style scoped>
.dropdown-demo {
  display: grid;
  gap: 0.75rem;
  font-family: ui-sans-serif, system-ui, sans-serif;

  > .text {
    margin: 0;

    > .value {
      font-family: ui-monospace, monospace;

      &[data-hydrated="false"] {
        color: #b04a52;
      }

      &[data-hydrated="true"] {
        color: #0e8f7f;
      }
    }
  }
}
</style>
