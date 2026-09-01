import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  reporter: "line",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.001,
    },
  },
  use: {
    baseURL: "http://127.0.0.1:4174",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "vp exec vite site/.output/public --host 127.0.0.1 --port 4174",
    url: "http://127.0.0.1:4174/components/button/",
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "desktop-light",
      use: {
        browserName: "chromium",
        colorScheme: "light",
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: "mobile-dark",
      use: {
        browserName: "chromium",
        colorScheme: "dark",
        isMobile: true,
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
