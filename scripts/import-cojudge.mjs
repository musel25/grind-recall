import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const source = process.argv[2];
const aiSource = process.argv[3];
if (!source)
  throw Error(
    "Usage: node scripts/import-cojudge.mjs <archived-cojudge-content-directory> [applied-ai-content-directory]",
  );
const courseIds = [
  "pybites-oop",
  "pybites-pytest",
  "pybites-data-formats",
  "pybites-collections",
  "pybites-decorators-context-managers",
];
const aiIds = [
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
const output = new URL("../src/cojudge-courses.json", import.meta.url);
/** @type {Record<string, number>} */
const minutes = { Easy: 7.5, Medium: 15, Hard: 22.5 };
const selection = JSON.parse(
  await readFile(
    new URL("../docs/catalog/python-first-pass.json", import.meta.url),
    "utf8",
  ),
);
const retired = new Set(selection.retired ?? []);
if (retired.size !== (selection.retired ?? []).length)
  throw Error("Duplicate retired exercise");
const seen = new Set();
/** @param {string} path */
const readJson = async (path, root = source) =>
  JSON.parse(await readFile(resolve(root, path), "utf8"));
let order = 0;
const courses = [];
for (const id of courseIds) {
  const selected = new Set(selection[id]);
  if (selected.size !== selection[id].length)
    throw Error(`Missing or duplicate first-pass selection: ${id}`);
  const course = await readJson(`courses/${id}/courseinfo.json`);
  /** @type {import('../src/types').Problem[]} */
  const problems = [];
  for (const category of course["category-order"]) {
    for (const slug of course["problems-of-category"][category]) {
      const metadata = await readJson(`problems/${slug}/metadata.json`);
      if (
        seen.has(slug) ||
        metadata.id !== slug ||
        !minutes[metadata.difficulty]
      )
        throw Error(`Invalid or duplicate exercise: ${slug}`);
      seen.add(slug);
      problems.push({
        id: slug,
        title: metadata.title,
        url: `https://cojudge.musel.dev/problems/${slug}`,
        difficulty: metadata.difficulty,
        minutes: minutes[metadata.difficulty],
        estimatedMinutes: true,
        week: 1,
        order: ++order,
        course: id,
        stage: course.title,
        review: true,
        deferred: !selected.has(slug),
        ...(retired.has(slug) ? { retired: true } : {}),
      });
    }
  }
  if ([...selected].some((slug) => !problems.some((p) => p.id === slug)))
    throw Error(`Unknown first-pass exercise in ${id}`);
  courses.push({ id, title: course.title, problems });
}
for (const slug of retired)
  if (!seen.has(slug) || courseIds.some((id) => selection[id].includes(slug)))
    throw Error(`Retired exercise is unknown or selected: ${slug}`);
if (aiSource) {
  const id = "applied-ai-nine";
  const course = await readJson(`courses/${id}/courseinfo.json`, aiSource);
  const slugs = course["category-order"].flatMap(
    (/** @type {string} */ category) =>
      course["problems-of-category"][category],
  );
  if (JSON.stringify(slugs) !== JSON.stringify(aiIds))
    throw Error("Applied AI course must contain the nine exercises in order");
  /** @type {import('../src/types').Problem[]} */
  const problems = [];
  for (const category of course["category-order"]) {
    for (const slug of course["problems-of-category"][category]) {
      const metadata = await readJson(
        `problems/${slug}/metadata.json`,
        aiSource,
      );
      if (
        seen.has(slug) ||
        metadata.id !== slug ||
        !minutes[metadata.difficulty] ||
        !Number.isFinite(metadata.studyMinutes) ||
        metadata.studyMinutes <= 0
      )
        throw Error(`Invalid or duplicate exercise: ${slug}`);
      seen.add(slug);
      problems.push({
        id: slug,
        title: metadata.title,
        url: `https://cojudge.musel.dev/problems/${slug}`,
        difficulty: metadata.difficulty,
        // The scheduler doubles minutes for first-pass study.
        minutes: metadata.studyMinutes / 2,
        estimatedMinutes: true,
        week: 1,
        order: ++order,
        course: id,
        stage: course.title,
        review: true,
        deferred: false,
      });
    }
  }
  courses.push({ id, title: course.title, problems });
} else {
  // A legacy one-root refresh must retain IDs used by saved backups.
  let existing;
  try {
    existing = JSON.parse(await readFile(output, "utf8"));
  } catch (error) {
    if (/** @type {NodeJS.ErrnoException} */ (error).code !== "ENOENT")
      throw error;
  }
  const retained = existing?.find(
    (/** @type {{ id: string }} */ course) => course.id === "applied-ai-nine",
  );
  if (
    !retained ||
    JSON.stringify(
      retained.problems.map((/** @type {{ id: string }} */ p) => p.id),
    ) !== JSON.stringify(aiIds)
  )
    throw Error(
      "Applied AI content root required: no complete existing AI course to preserve",
    );
  courses.push(retained);
  for (const p of retained.problems) seen.add(p.id);
}
// Retain the removed course for backups without reactivating saved work.
for (const course of courses)
  if (course.id === "applied-ai-nine")
    for (const p of course.problems) {
      p.deferred = true;
      p.retired = true;
    }
await writeFile(output, JSON.stringify(courses, null, 2) + "\n");
console.log(`Imported ${seen.size} exercises in ${courses.length} courses.`);
