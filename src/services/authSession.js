import { sessionMatchesPortal } from "./sessionScope.js";

export function createAuthState({ set, authLogin, logoutAuthSession, refreshAuthSession, setAuthToken, sessionStorage, localStorage }) {
const AUTH_STORAGE_KEY = "lepix.auth.session";
const REFRESH_MARKER_KEY = "lepix.auth.refresh-enabled";
let authRevision = 0;
const anonymous = { token: null, userName: null, email: null, empresaId: null, empresaSlug: null, roles: [], mustChangePassword: false, isAuthenticated: false };

function restoreSession() {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    const session = raw ? JSON.parse(raw) : null;
    return typeof session?.token === "string" && session.token ? session : null;
  } catch { return null; }
}

function saveSession(session) {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem(REFRESH_MARKER_KEY, "1");
}

function sessionFromResponse(res) {
  return {
    token: res.token,
    userName: res.userName,
    email: res.email,
    empresaId: res.empresaId,
    empresaSlug: res.empresaSlug ?? null,
    roles: res.roles || [],
    mustChangePassword: Boolean(res.mustChangePassword),
  };
}

return {
  token: null,
  userName: null,
  email: null,
  empresaId: null,
  empresaSlug: null,
  roles: [],
  isAuthenticated: false,
  initialized: false,
  mustChangePassword: false,

  sessionContext: undefined,
  initFromStorage: async (portalSlug = null) => {
    const revision = ++authRevision;
    const apply = (session) => {
      const allowed = sessionMatchesPortal(session, portalSlug);
      setAuthToken(allowed ? session.token : null);
      set({ ...(allowed ? { ...session, isAuthenticated: true } : anonymous), initialized: true, sessionContext: portalSlug });
    };
    const session = restoreSession();
    if (session) { apply(session); return; }
    setAuthToken(null);
    set({ ...anonymous, initialized: false, sessionContext: portalSlug });
    if (localStorage.getItem(REFRESH_MARKER_KEY) !== "1") { apply(null); return; }
    try {
      const restored = sessionFromResponse(await refreshAuthSession());
      if (revision !== authRevision) return;
      if (sessionMatchesPortal(restored, portalSlug)) saveSession(restored);
      apply(restored);
    } catch {
      if (revision !== authRevision) return;
      localStorage.removeItem(REFRESH_MARKER_KEY);
      apply(null);
    }
  },

  login: async (email, password, portalSlug = null) => {
    const revision = ++authRevision;
    const res = await authLogin({ email, password, portalSlug });
    if (revision !== authRevision) throw new Error("El portal cambió. Volvé a iniciar sesión.");
    // res: { token, userName, email, empresaId, roles }
    const session = sessionFromResponse(res);
    if (!sessionMatchesPortal(session, portalSlug)) throw new Error("Esta cuenta no pertenece a este portal.");
    saveSession(session);
    set({ ...session, isAuthenticated: true, initialized: true });
    setAuthToken(res.token);
    return res;
  },

  clearPasswordChangeRequirement: () => {
    set({ mustChangePassword: false });
  },

  logout: () => {
    authRevision += 1;
    void logoutAuthSession().catch(() => undefined);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(REFRESH_MARKER_KEY);
    set({
      token: null,
      userName: null,
      email: null,
      empresaId: null,
      empresaSlug: null,
      roles: [],
      mustChangePassword: false,
      isAuthenticated: false,
      initialized: true,
    });
    setAuthToken(null);
  },
};
}
