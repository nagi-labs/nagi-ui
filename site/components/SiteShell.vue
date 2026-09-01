<script setup lang="ts">
import { NSidebar, NSidebarLink, NSidebarSection } from "@nagi-labs/nagi-ui/components";

const { showcase } = defineProps<{ showcase?: boolean }>();

const route = useRoute();
const componentDocs = computed(() => route.path.startsWith("/components"));
const hasSidebar = computed(() => Boolean(showcase || componentDocs.value));
const navigation = [
  { label: "Overview", path: "/" },
  { label: "Showcase", path: "/showcase/" },
  { label: "Components", path: "/components/" },
  { label: "Nagi CSS", href: "https://nagi-labs.github.io/nagi-css/" },
];
const showcaseNavigation = [
  { label: "Dashboard", path: "/showcase/" },
  { label: "Customers", path: "/showcase/customers/" },
  { label: "Customer detail", path: "/showcase/customers/acme/" },
  { label: "Settings", path: "/showcase/settings/" },
];

function active(path: string) {
  const current = route.path === "/" ? "/" : route.path.replace(/\/$/u, "");
  const target = path === "/" ? "/" : path.replace(/\/$/u, "");
  return target === "/"
    ? current === target
    : current === target || current.startsWith(`${target}/`);
}

function toggleTheme() {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("nagi-theme", root.dataset.theme);
}
</script>

<template>
  <div
    class="site-site-shell"
    :data-sidebar="hasSidebar || undefined"
    :data-showcase="showcase || undefined"
  >
    <header class="header">
      <a
        class="link -brand"
        :href="useSitePath('/')"
        aria-label="Nagi UI home"
      >
        <img
          class="image"
          :src="useSitePath('/favicon.svg')"
          alt=""
        />
        <span class="value">Nagi UI</span>
      </a>
      <nav
        class="nav"
        aria-label="Primary navigation"
      >
        <a
          v-for="item in navigation"
          :key="item.label"
          class="link"
          :href="'href' in item ? item.href : useSitePath(item.path)"
          :aria-current="'path' in item && active(item.path) ? 'page' : undefined"
          >{{ item.label }}</a
        >
      </nav>
      <div class="actions">
        <button
          class="button"
          type="button"
          aria-label="Toggle color theme"
          @click="toggleTheme"
        >
          ◐
        </button>
        <a
          class="link -github"
          href="https://github.com/nagi-labs/nagi-ui"
          >GitHub ↗</a
        >
      </div>
    </header>

    <div class="unit -layout">
      <n-sidebar
        v-if="hasSidebar"
        class="n-sidebar"
        :label="showcase ? 'Application showcase' : 'Component catalog'"
      >
        <template v-if="showcase">
          <n-sidebar-section label="Nagi Operations">
            <n-sidebar-link
              v-for="item in showcaseNavigation"
              :key="item.path"
              :href="useSitePath(item.path)"
              :navigate="() => navigateTo(item.path)"
              :current="active(item.path)"
              >{{ item.label }}</n-sidebar-link
            >
          </n-sidebar-section>
        </template>
        <component-catalog-nav v-else />
        <template
          v-if="showcase"
          #footer
        >
          <div class="n-sidebar-footer">
            <div class="unit -status">
              <span
                class="icon"
                aria-hidden="true"
                >●</span
              >
              <span class="value">All systems operational</span>
            </div>
          </div>
        </template>
      </n-sidebar>
      <main class="main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.site-site-shell {
  --local-sidebar-width: var(--site-sidebar-width);
  min-block-size: 100vh;
  background: var(--site-color-canvas);

  > .header {
    position: sticky;
    z-index: var(--n-z-sticky);
    inset-block-start: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: var(--n-space-8);
    align-items: center;
    min-block-size: var(--site-header-height);
    padding-inline: max(var(--n-space-8), calc((100vi - var(--site-layout-max)) / 2));
    border-block-end: var(--n-border-width-1) solid var(--nagi-color-border-muted);
    background: color-mix(in srgb, var(--nagi-color-surface) 88%, transparent);
    backdrop-filter: blur(18px);

    > .link.-brand {
      display: inline-flex;
      gap: var(--n-space-5);
      align-items: center;
      color: var(--site-color-ink-strong);
      font-size: var(--n-font-size-5);
      font-weight: 600;
      text-decoration: none;

      > .image {
        inline-size: 2rem;
        block-size: 2rem;
      }
    }

    > .nav {
      display: flex;
      gap: var(--n-space-2);
      justify-content: center;

      > .link {
        padding: var(--n-space-4) var(--n-space-6);
        border-radius: var(--n-radius-2);
        color: var(--nagi-color-text-muted);
        font-weight: 500;
        text-decoration: none;

        &:hover,
        &[aria-current="page"] {
          background: var(--nagi-color-surface-active);
          color: var(--nagi-color-text);
        }
      }
    }

    > .actions {
      display: flex;
      gap: var(--n-space-4);
      align-items: center;

      > .button,
      > .link {
        min-block-size: var(--nagi-size-control);
        padding: var(--nagi-space-control);
        border: var(--n-border-width-1) solid var(--nagi-color-border-muted);
        border-radius: var(--n-radius-2);
        background: var(--nagi-color-surface);
        color: var(--nagi-color-text);
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
      }
    }
  }

  > .unit.-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);

    > .n-sidebar {
      position: fixed;
      inset-block: var(--site-header-height) 0;
      inset-inline-start: 0;
      inline-size: var(--local-sidebar-width);

      .n-sidebar-footer {
        > .unit.-status {
          display: flex;
          gap: var(--n-space-4);
          align-items: center;

          > .icon {
            color: var(--nagi-color-success);
            font-size: var(--n-font-size-1);
          }
        }
      }
    }

    > .main {
      display: grid;
      justify-items: center;
      min-inline-size: 0;
    }
  }

  &[data-sidebar="true"] {
    > .unit.-layout {
      > .main {
        margin-inline-start: var(--local-sidebar-width);
      }
    }
  }

  &[data-showcase="true"] {
    --local-sidebar-width: 12.5rem;
  }
}

@media (max-width: 52rem) {
  .site-site-shell {
    > .header {
      grid-template-columns: 1fr auto;
      gap: var(--n-space-3);
      padding-block: var(--n-space-4);

      > .nav {
        grid-column: 1 / -1;
        justify-content: start;
        overflow-x: auto;

        > .link {
          flex: 0 0 auto;
          padding: var(--n-space-3) var(--n-space-4);
          font-size: var(--n-font-size-3);
        }
      }

      > .actions {
        > .link.-github {
          display: none;
        }
      }
    }
    > .unit.-layout {
      > .n-sidebar {
        position: static;
        grid-template-rows: auto;
        inline-size: auto;
        max-block-size: 14rem;
        overflow-y: auto;
        border-block-end: var(--n-border-width-1) solid var(--nagi-color-border-muted);

        .n-sidebar-footer {
          > .unit.-status {
            display: none;
          }
        }
      }
    }

    &[data-sidebar="true"] {
      > .unit.-layout {
        > .main {
          margin-inline-start: 0;
        }
      }
    }
  }
}
</style>
