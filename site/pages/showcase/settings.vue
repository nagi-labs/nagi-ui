<script setup lang="ts">
import {
  NAlert,
  NButton,
  NCard,
  NCheckbox,
  NInput,
  NSelect,
  NSwitch,
  NTextarea,
} from "@nagi-labs/nagi-ui/components";

const workspace = ref("Nagi Operations");
const email = ref("ops@example.com");
const timezone = ref("utc");
const summary = ref("Weekly account health, revenue movement, and customer activity.");
const digest = ref(true);
const risk = ref(true);
const product = ref(false);
const confirmed = ref(false);
const saved = ref(false);
useHead({ title: "Settings" });
</script>

<template>
  <div class="site-settings-page">
    <page-heading
      eyebrow="Application showcase"
      title="Workspace settings"
      description="Native forms, validation, selection controls, and destructive actions composed as a production settings screen."
    />
    <form
      class="form"
      @submit.prevent="saved = true"
    >
      <n-alert
        v-if="saved"
        title="Settings saved"
        tone="success"
      >
        Your local showcase preferences were updated.
      </n-alert>
      <n-card
        class="n-card"
        title="Workspace profile"
        description="The name and defaults used across customer operations."
      >
        <div class="n-card-content -fields">
          <n-input
            v-model="workspace"
            label="Workspace name"
            name="workspace"
            required
          /><n-input
            v-model="email"
            label="Reply-to email"
            name="email"
            type="email"
            required
          /><n-select
            v-model="timezone"
            label="Reporting timezone"
            name="timezone"
            :options="[
              { label: 'UTC', value: 'utc' },
              { label: 'Pacific time', value: 'pt' },
              { label: 'Japan time', value: 'jst' },
            ]"
          /><n-textarea
            v-model="summary"
            class="n-textarea"
            label="Report summary"
            name="summary"
            :rows="4"
          />
        </div>
        <template #footer>
          <span class="actions">
            <n-button
              class="n-button"
              type="submit"
            >
              Save workspace
            </n-button>
          </span>
        </template>
      </n-card>
      <n-card
        class="n-card"
        title="Notifications"
        description="Choose which events should reach the operations team."
      >
        <div class="n-card-content -switches">
          <n-switch
            v-model="digest"
            label="Weekly operations digest"
            name="digest"
          /><n-switch
            v-model="risk"
            label="Account risk alerts"
            name="risk"
          /><n-switch
            v-model="product"
            label="Product update emails"
            name="product"
          />
        </div>
      </n-card>
      <n-card
        class="n-card"
        title="Danger zone"
        description="Destructive actions remain explicit and browser-native."
      >
        <div class="n-card-content -danger">
          <span class="text">
            <strong class="strong">Delete this workspace</strong
            ><small class="note"
              >This showcase does not send data anywhere, but the interaction demonstrates a guarded
              destructive action.</small
            >
          </span>
          <n-checkbox
            v-model="confirmed"
            label="I understand this action cannot be undone"
          /><n-button
            class="n-button"
            :disabled="!confirmed"
          >
            Delete workspace
          </n-button>
        </div>
      </n-card>
    </form>
  </div>
</template>

<style scoped>
.site-settings-page {
  display: grid;
  gap: calc(2 * var(--n-space-8));
  max-inline-size: 64rem;
  inline-size: 100%;
  padding: calc(2 * var(--n-space-8));
  > .form {
    display: grid;
    gap: var(--n-space-8);

    > .n-card {
      .n-card-content.-danger {
        > .n-button {
          --button-tone: danger;
          --button-appearance: outlined;
          --button-shape: rounded;
        }
      }

      .n-card-content.-fields {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--n-space-7);

        > .n-textarea {
          grid-column: 1 / -1;
        }
      }

      .n-card-content.-switches {
        display: grid;
        gap: var(--n-space-6);
      }

      .n-card-content.-danger {
        display: grid;
        gap: var(--n-space-6);
        justify-items: start;

        > .text {
          display: grid;
          gap: var(--n-space-2);
          margin: 0;

          > .strong {
            color: var(--nagi-color-danger);
          }

          > .note {
            color: var(--nagi-color-text-muted);
          }
        }
      }
    }
  }
}
@media (max-width: 42rem) {
  .site-settings-page {
    padding: var(--n-space-8);
    > .form {
      > .n-card {
        .n-card-content.-fields {
          grid-template-columns: 1fr;
        }
      }
    }
  }
}
</style>
