import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  use: {
    baseURL: process.env.GRIND_BASE_URL || "http://127.0.0.1:5173/grind/",
    headless: true,
    launchOptions: {
      executablePath: "/usr/bin/google-chrome",
      args: ["--no-sandbox"],
    },
  },
  reporter: "list",
});
