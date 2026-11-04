import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const projectRoot = fileURLToPath(new URL("../", import.meta.url));
export const timerRepo = "https://github.com/musel25/timer.git";
export const timerRef = "5022c8323bb42a3a712d5a34e510b76329c364a0";
export const timerPath = resolve(
  process.env.TIMER_REPO || resolve(projectRoot, ".cache/timer"),
);
