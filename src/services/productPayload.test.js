import { test } from "node:test";
import assert from "node:assert/strict";
import { mapAdminToApi } from "./productPayload.js";

test("save preserves fractional recipes, base photos and optional lookups", () => {
  const result = mapAdminToApi({ name: "", categoryId: 0, brandId: 0, providerId: null, price: "", images: [{ url: "/uploads/promo.jpg", sort: 0 }], subproducts: { 12: 0.3 }, variants: [] });
  assert.deepEqual(result.subproducts, { 12: 0.3 });
  assert.equal(result.images[0].url, "/uploads/promo.jpg");
  assert.equal(result.price, 0); assert.equal(result.categoryId, 0); assert.equal(result.brandId, 0);
});
