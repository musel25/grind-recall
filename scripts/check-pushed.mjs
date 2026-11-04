import { execFileSync } from "node:child_process";

/** @param {string[]} args */
const git = (args) =>
  execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
try {
  const branch = git(["branch", "--show-current"]);
  if (!branch) throw Error("Deployment requires a named branch.");
  const remote = git(["config", `branch.${branch}.remote`]);
  const ref = git(["config", `branch.${branch}.merge`]);
  if (!remote || remote === "." || !ref.startsWith("refs/heads/"))
    throw Error("Deployment requires a remote upstream branch.");
  git(["fetch", "--quiet", remote, ref]);
  if (git(["rev-parse", "HEAD"]) !== git(["rev-parse", "FETCH_HEAD"]))
    throw Error(
      "Deployment requires HEAD to match the pushed upstream branch. Push or update your branch first.",
    );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
