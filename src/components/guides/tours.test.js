import { test } from "node:test";
import assert from "node:assert/strict";
import { visibleTourSteps, TOURS } from "./tours.js";

test("guides omit unavailable controls and choose the visible responsive copy", () => {
  const hidden = { getClientRects: () => [] };
  const visible = { getClientRects: () => [1], checkVisibility: () => true };
  const steps = visibleTourSteps([
    { target: null, title: "Inicio" },
    { target: "allowed", title: "Visible" },
    { target: "forbidden", title: "Sin permiso" },
  ], (target) => target === "allowed" ? [hidden, visible] : []);
  assert.equal(steps.length, 2);
  assert.equal(steps[1].element, visible);
});

test("all tours remain usable when optional features are absent", () => {
  for (const steps of Object.values(TOURS)) {
    const visible = visibleTourSteps(steps, () => []);
    assert.ok(visible.length > 0);
    assert.ok(visible.every((step) => step.popover.title && step.popover.description));
  }
});
