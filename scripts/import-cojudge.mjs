import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const source = process.argv[2];
if (!source)
  throw Error(
    "Usage: node scripts/import-cojudge.mjs <cojudge-content-directory>",
  );
const courseIds = [
  "pybites-oop",
  "pybites-pytest",
  "pybites-data-formats",
  "pybites-collections",
  "pybites-decorators-context-managers",
];
const minutes = { Easy: 9, Medium: 18, Hard: 27 };
const seen = new Set();
const readJson = async (path) =>
  JSON.parse(await readFile(resolve(source, path), "utf8"));
let order = 0;
const courses = [];
for (const id of courseIds) {
  const course = await readJson(`courses/${id}/courseinfo.json`);
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
      });
    }
  }
  courses.push({ id, title: course.title, problems });
}
await writeFile(
  new URL("../src/cojudge-courses.json", import.meta.url),
  JSON.stringify(courses, null, 2) + "\n",
);
console.log(`Imported ${seen.size} exercises in ${courses.length} courses.`);
