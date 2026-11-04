import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { timerPath, timerRepo, timerRef } from "./browser-config.mjs";

/** @param {string} command @param {string[]} args */
function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!process.env.TIMER_REPO) {
  if (!existsSync(timerPath)) {
    mkdirSync(dirname(timerPath), { recursive: true });
    run("git", ["clone", "--no-checkout", timerRepo, timerPath]);
  }
  run("git", ["-C", timerPath, "fetch", "origin", timerRef]);
  run("git", ["-C", timerPath, "checkout", "--detach", timerRef]);
  run("npm", ["ci", "--prefix", join(timerPath, "server")]);
} else if (!existsSync(join(timerPath, "server/node_modules"))) {
  throw Error(
    "TIMER_REPO must point to a prepared Timer checkout. Run npm ci in its server directory.",
  );
}
run("npx", [
  "--no-install",
  "playwright",
  "install",
  ...process.argv.slice(2),
  "chromium",
]);
