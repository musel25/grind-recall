import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import App from "../src/App";
import { activeProblems, problems } from "../src/catalog";
import { initialState } from "../src/model";
import type { StudyState } from "../src/types";

function text(state: StudyState) {
  return renderToStaticMarkup(
    createElement<{ store: { load: () => StudyState; save: () => void } }>(
      App,
      {
        store: { load: () => state, save: () => {} },
      },
    ),
  )
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

test("a completed active plan with retired progress displays 100 percent", () => {
  const state = initialState("2026-11-04");
  for (const p of [
    ...activeProblems(state),
    ...problems.filter((p) => p.retired),
  ])
    state.progress[p.id] = {
      due: "2099-01-01",
      card: null,
      imported: true,
      independent: true,
      note: "Keep",
    };
  const rendered = text(state);
  assert.match(rendered, /100%/);
  assert.match(rendered, /75 of 75 practiced/);
  assert.doesNotMatch(rendered, /solved independently/);
});

test("partial active progress excludes retired work from the visible count", () => {
  const state = initialState("2026-11-04");
  for (const p of [
    activeProblems(state)[0],
    ...problems.filter((p) => p.retired),
  ])
    state.progress[p.id] = {
      due: "2099-01-01",
      card: null,
      imported: true,
      independent: true,
      note: "Keep",
    };
  const before = structuredClone(state);
  const rendered = text(state);
  assert.match(rendered, /1 of 75 practiced/);
  assert.doesNotMatch(rendered, /solved independently/);
  assert.deepEqual(state, before);
});
