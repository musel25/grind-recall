import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import courses from "../src/cojudge-courses.json";

test("two-root import preserves every archived field and uses native AI study budgets", async () => {
  const root = await mkdtemp(join(tmpdir(), "grind-import-"));
  const json = async (path: string, value: unknown) => {
    await mkdir(join(path, ".."), { recursive: true });
    await writeFile(path, JSON.stringify(value));
  };
  try {
    await mkdir(join(root, "scripts"));
    await mkdir(join(root, "src"));
    await mkdir(join(root, "docs/catalog"), { recursive: true });
    await copyFile(
      new URL("../scripts/import-cojudge.mjs", import.meta.url),
      join(root, "scripts/import-cojudge.mjs"),
    );
    await copyFile(
      new URL("../docs/catalog/python-first-pass.json", import.meta.url),
      join(root, "docs/catalog/python-first-pass.json"),
    );
    const old = courses.filter((course) => course.id.startsWith("pybites-"));
    for (const course of old) {
      await json(join(root, "old/courses", course.id, "courseinfo.json"), {
        title: course.title,
        "category-order": ["All"],
        "problems-of-category": { All: course.problems.map((p) => p.id) },
      });
      for (const p of course.problems)
        await json(join(root, "old/problems", p.id, "metadata.json"), {
          id: p.id,
          title: p.title,
          difficulty: p.difficulty,
        });
    }
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [join(root, "scripts/import-cojudge.mjs"), join(root, "old")],
          { stdio: "pipe" },
        ),
      /Applied AI content root required/,
    );
    const ids = [
      "ai-01-clean-documents",
      "ai-02-split-documents",
      "ai-03-find-similar-documents",
      "ai-04-build-context",
      "ai-05-validate-extracted-tasks",
      "ai-06-check-citations",
      "ai-07-evaluate-search",
      "ai-08-cache-embeddings",
      "ai-09-retry-failed-requests",
    ];
    const id = ids[0];
    await json(join(root, "new/courses/applied-ai-nine/courseinfo.json"), {
      title: "Applied AI — 9 Exercises",
      "category-order": ["All"],
      "problems-of-category": { All: ids },
    });
    for (const slug of ids)
      await json(join(root, "new/problems", slug, "metadata.json"), {
        id: slug,
        title: slug === id ? "01. Clean Documents" : slug,
        difficulty: "Easy",
        studyMinutes: 20,
      });
    execFileSync(process.execPath, [
      join(root, "scripts/import-cojudge.mjs"),
      join(root, "old"),
      join(root, "new"),
    ]);
    const imported = JSON.parse(
      await readFile(join(root, "src/cojudge-courses.json"), "utf8"),
    );
    assert.deepEqual(imported.slice(0, 5), old);
    assert.equal(imported.length, 6);
    assert.deepEqual(
      imported[5].problems.map((p: { id: string }) => p.id),
      ids,
    );
    execFileSync(process.execPath, [
      join(root, "scripts/import-cojudge.mjs"),
      join(root, "old"),
    ]);
    assert.deepEqual(
      JSON.parse(
        await readFile(join(root, "src/cojudge-courses.json"), "utf8"),
      ),
      imported,
    );
    for (const invalid of [
      ids.slice(0, 8),
      [ids[1], ids[0], ...ids.slice(2)],
    ]) {
      await json(join(root, "new/courses/applied-ai-nine/courseinfo.json"), {
        title: "Applied AI — 9 Exercises",
        "category-order": ["All"],
        "problems-of-category": { All: invalid },
      });
      assert.throws(
        () =>
          execFileSync(
            process.execPath,
            [
              join(root, "scripts/import-cojudge.mjs"),
              join(root, "old"),
              join(root, "new"),
            ],
            { stdio: "pipe" },
          ),
        /nine exercises in order/,
      );
      assert.deepEqual(
        JSON.parse(
          await readFile(join(root, "src/cojudge-courses.json"), "utf8"),
        ),
        imported,
      );
    }
    assert.deepEqual(imported[5].problems[0], {
      id,
      title: "01. Clean Documents",
      url: `https://cojudge.musel.dev/problems/${id}`,
      difficulty: "Easy",
      minutes: 10,
      estimatedMinutes: true,
      week: 1,
      order: 73,
      course: "applied-ai-nine",
      stage: "Applied AI — 9 Exercises",
      review: true,
      deferred: false,
    });
    await json(join(root, "new/courses/applied-ai-nine/courseinfo.json"), {
      title: "Applied AI — 9 Exercises",
      "category-order": ["All"],
      "problems-of-category": { All: ids },
    });
    await json(join(root, "new/problems", id, "metadata.json"), {
      id,
      title: "01. Clean Documents",
      difficulty: "Easy",
      studyMinutes: 0,
    });
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [
            join(root, "scripts/import-cojudge.mjs"),
            join(root, "old"),
            join(root, "new"),
          ],
          { stdio: "pipe" },
        ),
      /Invalid.*exercise/,
    );
    assert.deepEqual(
      JSON.parse(
        await readFile(join(root, "src/cojudge-courses.json"), "utf8"),
      ),
      imported,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
