import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/nagi-browser",
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  webServer: {
    // Replace with the consumer app's dev or preview command.
    command: "vp run dev --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/__nagi-contract",
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
