import { create } from "zustand";
import { createCartState } from "../services/cartState";
const preview = new URLSearchParams(window.location.search).get("preview") === "1";
const memory = new Map();
const storage = preview ? { getItem: key => memory.get(key), setItem: (key, value) => memory.set(key, value) } : window.localStorage;
export const useCart = create((set, get) => createCartState(set, get, storage));
