import { test } from "node:test";
import assert from "node:assert/strict";
import { INDEPENDENT_BLOCKS, changeModuleAssignment, moduleAssigned, placementKey, generalModuleFeatures, resolveModuleComponents, editModuleOverride, resetModuleOverrides } from "./componentModules.js";

test("general vehicle template can add USD without a company", () => {
  assert.equal(moduleAssigned(generalModuleFeatures(), "dollarQuote", "vehicles"), false);
  const defaults = editModuleOverride({}, "dollarQuote", "vehicles", true);
  assert.equal(moduleAssigned(generalModuleFeatures(defaults), "dollarQuote", "vehicles"), true);
  const companyFeatures = { vehicles: true, components: resolveModuleComponents(defaults, {}) };
  assert.equal(moduleAssigned(companyFeatures, "dollarQuote", "vehicles"), true);
});

test("company changes only one placement and continues inheriting later defaults", () => {
  const own = editModuleOverride({}, "videos", "store", false);
  assert.deepEqual(own, { "placement:videos:store": false });
  const effective = resolveModuleComponents({ "placement:videos:store": true, "placement:videos:vehicles": true }, own);
  assert.equal(effective["placement:videos:store"], false);
  assert.equal(effective["placement:videos:vehicles"], true);
  assert.equal(effective.videos, true);
});

test("legacy off is honored and editing it preserves other categories", () => {
  assert.equal(resolveModuleComponents({ "placement:videos:vehicles": true }, { videos: false }).videos, false);
  const own = editModuleOverride({ videos: false }, "videos", "vehicles", true);
  assert.equal(Object.hasOwn(own, "videos"), false);
  assert.equal(own["placement:videos:store"], false);
  assert.equal(resolveModuleComponents({}, own).videos, true);
});

test("reset removes module exceptions without deleting unrelated settings", () => {
  const own = { vehicleCatalog: false, videos: false, "placement:videos:store": false, unrelated: true };
  assert.deepEqual(resetModuleOverrides(own), { unrelated: true });
  assert.equal(own.vehicleCatalog, false);
});

test("library contains unique modules and preserves existing category defaults", () => {
  assert.equal(new Set(INDEPENDENT_BLOCKS.map((block) => block.key)).size, INDEPENDENT_BLOCKS.length);
  assert.equal(moduleAssigned({ store: true }, "storeCatalog", "store"), true);
  assert.equal(moduleAssigned({ realEstate: true, interactiveMap: false }, "realEstateMap", "realEstate"), false);
});

test("duplicate and incompatible assignments are rejected", () => {
  assert.throws(() => changeModuleAssignment({ store: true }, "storeCatalog", "store", true), /ya existe/);
  assert.throws(() => changeModuleAssignment({ vehicles: true }, "storeCart", "vehicles", true), /compatible/);
  assert.throws(() => changeModuleAssignment({ vehicles: false }, "videos", "vehicles", true), /habilitá/);
});

test("shared modules preserve other placements and disable only after the last removal", () => {
  const initial = { store: true, vehicles: true, components: { unrelated: true } };
  const first = changeModuleAssignment(initial, "videos", "store", true);
  const second = changeModuleAssignment(first, "videos", "vehicles", true);
  assert.throws(() => changeModuleAssignment(second, "videos", "vehicles", true), /ya existe/);
  const third = changeModuleAssignment(second, "videos", "store", false);
  assert.equal(third.components.videos, true);
  assert.equal(moduleAssigned(third, "videos", "vehicles"), true);
  const last = changeModuleAssignment(third, "videos", "vehicles", false);
  assert.equal(last.components.videos, false);
  assert.equal(last.components.unrelated, true);
  assert.deepEqual(initial.components, { unrelated: true });
});

test("removing legacy quotation preserves assignments in other categories", () => {
  const next = changeModuleAssignment({ store: true, vehicles: true }, "dollarQuote", "store", false);
  assert.equal(next.components[placementKey("dollarQuote", "vehicles")], true);
  assert.equal(moduleAssigned(next, "dollarQuote", "store"), false);
});

test("native modules can be removed and restored with their prerequisite", () => {
  const removed = changeModuleAssignment({ realEstate: true, interactiveMap: true }, "realEstateMap", "realEstate", false);
  assert.equal(moduleAssigned(removed, "realEstateMap", "realEstate"), false);
  const added = changeModuleAssignment({ ...removed, interactiveMap: false }, "realEstateMap", "realEstate", true);
  assert.equal(added.interactiveMap, true);
  assert.equal(added.components.realEstateMap, true);
});
