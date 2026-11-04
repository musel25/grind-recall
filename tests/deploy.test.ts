import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "grind-deploy-"));
  const repo = join(dir, "repo");
  const git = (args: string[], cwd = repo) =>
    execFileSync("git", args, {
      cwd,
      stdio: "pipe",
      env: {
        ...process.env,
        GIT_CONFIG_GLOBAL: "/dev/null",
        GIT_CONFIG_NOSYSTEM: "1",
      },
    });
  mkdirSync(repo);
  git(["init", "-b", "main"]);
  git(["config", "user.email", "test@example.com"]);
  git(["config", "user.name", "Test"]);
  mkdirSync(join(repo, "scripts"));
  for (const file of ["deploy.sh", "check-pushed.mjs"])
    copyFileSync(
      new URL(`../scripts/${file}`, import.meta.url),
      join(repo, "scripts", file),
    );
  git(["add", "."]);
  git(["commit", "-m", "initial"]);
  const remote = join(dir, "remote.git");
  git(["init", "--bare", remote]);
  git(["remote", "add", "origin", remote]);
  const bin = join(dir, "bin");
  mkdirSync(bin);
  const reached = join(dir, "build-started");
  writeFileSync(
    join(bin, "npm"),
    '#!/bin/sh\ntouch "$DEPLOY_TEST_MARKER"\nexit 43\n',
  );
  chmodSync(join(bin, "npm"), 0o755);
  const deploy = () =>
    spawnSync("bash", ["scripts/deploy.sh"], {
      cwd: repo,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        DEPLOY_TEST_MARKER: reached,
      },
    });
  return { dir, repo, git, deploy, reached };
}

for (const scenario of [
  "no upstream",
  "unpushed commit",
  "remote ahead",
  "pushed",
] as const) {
  test(`deployment checks upstream before starting a build: ${scenario}`, () => {
    const f = fixture();
    try {
      if (scenario !== "no upstream") f.git(["push", "-u", "origin", "main"]);
      if (scenario === "unpushed commit")
        f.git(["commit", "--allow-empty", "-m", "local"]);
      if (scenario === "remote ahead") {
        f.git(["commit", "--allow-empty", "-m", "remote"]);
        f.git(["push"]);
        f.git(["reset", "--hard", "HEAD~1"]);
      }
      const result = f.deploy();
      assert.equal(existsSync(f.reached), scenario === "pushed", result.stderr);
      assert.equal(
        result.status,
        scenario === "pushed" ? 43 : 1,
        result.stderr,
      );
    } finally {
      rmSync(f.dir, { recursive: true, force: true });
    }
  });
}
