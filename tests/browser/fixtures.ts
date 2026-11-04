import { test as base, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "vite";
import { projectRoot } from "../../scripts/browser-config.mjs";

export { expect };
export type { Page } from "@playwright/test";
export const test = base.extend<{ studyServer: string }>({
  studyServer: [
    async ({}, use) => {
      const directory = await mkdtemp(join(tmpdir(), "grind-browser-"));
      const api = spawn(
        process.execPath,
        ["--import", "tsx", "scripts/browser-api.mjs"],
        {
          cwd: projectRoot,
          env: { ...process.env, GRIND_BROWSER_TEST_DIR: directory },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      let output = "";
      api.stderr.on("data", (data: Buffer) => {
        output += data.toString();
      });
      let vite: Awaited<ReturnType<typeof createServer>> | undefined;
      try {
        const target = await new Promise<string>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(Error(`Test API startup timed out. ${output}`));
          }, 20_000);
          api.once("error", (error) => {
            clearTimeout(timeout);
            reject(error);
          });
          api.once("exit", (code) => {
            clearTimeout(timeout);
            reject(Error(`Test API exited (${code}). ${output}`));
          });
          api.stdout.on("data", (data: Buffer) => {
            output += data.toString();
            const match = output.match(
              /GRIND_TEST_API=(http:\/\/127\.0\.0\.1:\d+)/,
            );
            if (match) {
              clearTimeout(timeout);
              resolve(match[1]);
            }
          });
        });
        vite = await createServer({
          root: projectRoot,
          server: {
            host: "127.0.0.1",
            port: 0,
            strictPort: true,
            proxy: { "/api": { target, changeOrigin: false } },
          },
        });
        await vite.listen();
        const address = vite.httpServer!.address();
        if (!address || typeof address === "string")
          throw Error("No test app port assigned.");
        await use(`http://127.0.0.1:${address.port}/grind/`);
      } finally {
        await vite?.close();
        if (api.exitCode === null && api.signalCode === null) {
          const exited = once(api, "exit");
          const kill = setTimeout(() => api.kill("SIGKILL"), 3000);
          api.kill("SIGTERM");
          await exited;
          clearTimeout(kill);
        }
        await rm(directory, { recursive: true, force: true });
      }
    },
    { timeout: 30_000 },
  ],
  baseURL: async ({ studyServer }, use) => {
    await use(studyServer);
  },
});
