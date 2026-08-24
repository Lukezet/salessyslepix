// store/auth.js
import { create } from "zustand";
import { authLogin, logoutAuthSession, refreshAuthSession, setAuthToken } from "../services/catalog";

const AUTH_STORAGE_KEY = "lepix.auth.session";
const REFRESH_MARKER_KEY = "lepix.auth.refresh-enabled";

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

export const useAuth = create((set) => ({
  token: null,
  userName: null,
  email: null,
  empresaId: null,
  empresaSlug: null,
  roles: [],
  isAuthenticated: false,
  initialized: false,
  mustChangePassword: false,

  initFromStorage: async () => {
    const session = restoreSession();
    if (session) {
      set({ ...session, isAuthenticated: true, initialized: true });
      setAuthToken(session.token);
      return;
    }
    if (localStorage.getItem(REFRESH_MARKER_KEY) !== "1") {
      set({ initialized: true });
      return;
    }
    try {
      const restored = sessionFromResponse(await refreshAuthSession());
      saveSession(restored);
      set({ ...restored, isAuthenticated: true, initialized: true });
      setAuthToken(restored.token);
    } catch {
      localStorage.removeItem(REFRESH_MARKER_KEY);
      setAuthToken(null);
      set({ initialized: true });
    }
  },

  login: async (email, password) => {
    const res = await authLogin({ email, password });
    // res: { token, userName, email, empresaId, roles }
    const session = sessionFromResponse(res);
    saveSession(session);
    set({ ...session, isAuthenticated: true, initialized: true });
    setAuthToken(res.token);
    return res;
  },

  clearPasswordChangeRequirement: () => {
    set({ mustChangePassword: false });
  },

  logout: () => {
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
}));
