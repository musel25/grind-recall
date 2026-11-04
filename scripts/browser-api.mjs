import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { timerPath } from "./browser-config.mjs";

// Only this test-owned directory determines the database. Ignore inherited TIMER_DB.
if (!process.env.GRIND_BROWSER_TEST_DIR)
  throw Error("A disposable test directory is required.");
process.env.TIMER_DB = join(
  resolve(process.env.GRIND_BROWSER_TEST_DIR),
  "state.db",
);
process.env.NODE_ENV = "test";
const requireTimer = createRequire(join(timerPath, "server/package.json"));
const { Hono } = requireTimer("hono");
const { serve } = requireTimer("@hono/node-server");
const { migrate, sqlite } = await import(
  pathToFileURL(join(timerPath, "server/src/db.ts")).href
);
const { grind } = await import(
  pathToFileURL(join(timerPath, "server/src/grind.ts")).href
);
migrate();
const app = new Hono();
app.route("/api/grind", grind);
const server = serve(
  { fetch: app.fetch, hostname: "127.0.0.1", port: 0 },
  /** @param {{port:number}} info */ (info) => {
    console.log(`GRIND_TEST_API=http://127.0.0.1:${info.port}`);
  },
);
process.on("SIGTERM", () =>
  server.close(() => {
    sqlite.close();
    process.exit(0);
  }),
);
