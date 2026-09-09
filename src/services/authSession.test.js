
import { test } from "node:test";
import assert from "node:assert/strict";
import { createAuthState } from "./authSession.js";
const martina = { token: "test-token", userName: "Martina", empresaSlug: "crear", roles: ["RealEstateAgent"] };
function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}
function setup(session, extra = {}) {
  const sessionStorage = storage(), localStorage = storage();
  if (session) sessionStorage.setItem("lepix.auth.session", JSON.stringify(session));
  let state, token = null;
  state = createAuthState({ set: (next) => { state = { ...state, ...next }; }, sessionStorage, localStorage,
    setAuthToken: (value) => { token = value; }, refreshAuthSession: async () => martina,
    authLogin: async () => martina, logoutAuthSession: async () => {}, ...extra });
  return { get state() { return state; }, get token() { return token; }, localStorage };
}
test("Martina moves Crear to LePix as visitor and returns to her own session", async () => {
  const app = setup(martina);
  await app.state.initFromStorage("crear");
  assert.equal(app.state.userName, "Martina");
  await app.state.initFromStorage("lepix");
  assert.equal(app.state.isAuthenticated, false);
  assert.equal(app.state.userName, null);
  assert.equal(app.token, null);
  assert.deepEqual(app.state.roles, []);
  await app.state.initFromStorage("crear");
  assert.equal(app.state.isAuthenticated, true);
});
test("a copied session in a new tab cannot authenticate another company", async () => {
  const app = setup(martina);
  await app.state.initFromStorage("lepix");
  assert.equal(app.state.isAuthenticated, false);
  assert.equal(app.token, null);
});
test("company Admin cannot cross tenants but PlatformAdmin can", async () => {
  for (const role of ["Admin", "PlatformAdmin"]) {
    const app = setup({ ...martina, roles: [role] });
    await app.state.initFromStorage("lepix");
    assert.equal(app.state.isAuthenticated, role === "PlatformAdmin");
  }
});
test("refresh cookie cannot restore another company's user in this portal", async () => {
  const app = setup();
  app.localStorage.setItem("lepix.auth.refresh-enabled", "1");
  await app.state.initFromStorage("lepix");
  assert.equal(app.state.isAuthenticated, false);
  assert.equal(app.token, null);
});
test("late refresh cannot overwrite state after a portal change", async () => {
  let resolve;
  const app = setup(null, { refreshAuthSession: () => new Promise((done) => { resolve = done; }) });
  app.localStorage.setItem("lepix.auth.refresh-enabled", "1");
  const pending = app.state.initFromStorage("crear");
  app.localStorage.removeItem("lepix.auth.refresh-enabled");
  await app.state.initFromStorage("lepix");
  resolve(martina);
  await pending;
  assert.equal(app.state.sessionContext, "lepix");
  assert.equal(app.state.isAuthenticated, false);
});
test("login rejects a response for a different portal", async () => {
  const app = setup();
  await assert.rejects(app.state.login("test", "test", "lepix"), /no pertenece/);
  assert.equal(app.token, null);
});
