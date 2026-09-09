import { test } from "node:test";
import assert from "node:assert/strict";
import { moduleDictionary, searchableModules, matchesPublication } from "./moduleDictionary.js";
import { contextualTour } from "../components/guides/tours.js";

test("each module uses its own search vocabulary in UI and guide", () => {
  for (const [key, noun] of [["store", "productos"], ["realEstate", "inmuebles"], ["vehicles", "vehículos"]]) {
    const features = { [key]: true };
    const words = moduleDictionary(features);
    const search = contextualTour("portal", features).find((step) => step.target === "portal-search");
    assert.ok(words.searchPlaceholder.includes(noun));
    assert.equal(search.title, words.searchTitle);
    assert.equal(search.description, words.searchDescription);
    if (key !== "store") assert.doesNotMatch(JSON.stringify(contextualTour("portal", features)), /artículo|producto|catálogo|LePix/iu);
  }
});

test("mixed portals name only enabled searchable modules", () => {
  assert.equal(moduleDictionary({ realEstate: true, vehicles: true }).searchPlaceholder, "Buscar inmuebles y vehículos…");
  assert.deepEqual(searchableModules({ store: true, realEstate: true, components: { storeCatalog: false } }), ["realEstate"]);
  assert.equal(moduleDictionary({}).searchPlaceholder, "Buscar…");
});

test("publication search matches title or description ignoring accents and case", () => {
  const item = { title: "Departamento en Córdoba", description: "Balcón amplio" };
  assert.equal(matchesPublication(item, "cordoba"), true);
  assert.equal(matchesPublication(item, " BALCON "), true);
  assert.equal(matchesPublication(item, "camioneta"), false);
});
