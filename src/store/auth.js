import { create } from "zustand";
import { authLogin, logoutAuthSession, refreshAuthSession, setAuthToken } from "../services/catalog";
import { createAuthState } from "../services/authSession";

export const useAuth = create((set) => createAuthState({
  set, authLogin, logoutAuthSession, refreshAuthSession, setAuthToken,
  sessionStorage: window.sessionStorage, localStorage: window.localStorage,
}));
