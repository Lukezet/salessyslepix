// store/auth.js
import { create } from "zustand";
import { authLogin, setAuthToken } from "../services/catalog";

export const useAuth = create((set) => ({
  token: null,
  userName: null,
  email: null,
  empresaId: null,
  roles: [],
  isAuthenticated: false,

  initFromStorage: () => {
    try {
      const raw = localStorage.getItem("auth");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      set({
        token: parsed.token,
        userName: parsed.userName,
        email: parsed.email,
        empresaId: parsed.empresaId,
        roles: parsed.roles || [],
        isAuthenticated: !!parsed.token,
      });
      setAuthToken(parsed.token);
    } catch (e) {
      // opcional: loguear para debug, evita bloque vacío
      console.warn("auth init error", e);
    }
  },

  login: async (email, password) => {
    const res = await authLogin({ email, password });
    // res: { token, userName, email, empresaId, roles }
    set({
      token: res.token,
      userName: res.userName,
      email: res.email,
      empresaId: res.empresaId,
      roles: res.roles || [],
      isAuthenticated: true,
    });
    localStorage.setItem("auth", JSON.stringify(res));
    setAuthToken(res.token);
    return res;
  },

  logout: () => {
    localStorage.removeItem("auth");
    set({
      token: null,
      userName: null,
      email: null,
      empresaId: null,
      roles: [],
      isAuthenticated: false,
    });
    setAuthToken(null);
  },
}));
