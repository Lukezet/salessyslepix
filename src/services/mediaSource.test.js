
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveMediaSource } from "./mediaSource.js";
test("local uploads resolve against the API instead of Vite", () => {
  assert.equal(resolveMediaSource("/uploads/photo.jpg", "http://localhost:5116", "http://localhost:5174"), "http://localhost:5116/uploads/photo.jpg");
});
test("absolute CDN URLs are preserved and unsafe schemes are rejected", () => {
  assert.equal(resolveMediaSource("https://cdn.example/photo.webp", "http://localhost:5116", "http://localhost:5174"), "https://cdn.example/photo.webp");
  assert.equal(resolveMediaSource("javascript:alert(1)", "", "https://portal.example"), null);
});
test("same origin deployment and missing media are supported", () => {
  assert.equal(resolveMediaSource("/uploads/photo.jpg", "", "https://portal.example"), "https://portal.example/uploads/photo.jpg");
  assert.equal(resolveMediaSource(null, "", "https://portal.example"), null);
});
