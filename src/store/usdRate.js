import { create } from "zustand";
import { getDolarValue, refreshDolarValue } from "../services/catalog";

export const useUsdRate = create((set, get) => ({
  rate: null,
  lastUpdated: null,
  lastSource: null,     // "api" | "manual"
  isLoading: false,
  cooldownUntil: 0,     // para evitar spam desde cualquier parte

  // Carga el valor actual desde el backend (GET /api/exchange-rate)
  load: async () => {
    try {
      set({ isLoading: true });
      const { rate } = await getDolarValue();
      if (typeof rate === "number") {
        set({ rate, lastUpdated: new Date().toISOString(), lastSource: "api" });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresca: si pasás rate -> manual; si no -> API (POST /refresh)
  refresh: async (optionalRate) => {
    const now = Date.now();
    const { cooldownUntil } = get();
    if (now < cooldownUntil) {
      // opcional: throw para que el caller lo maneje
      return { rate: get().rate, source: get().lastSource, throttled: true };
    }

    try {
      set({ isLoading: true });
      const res = await refreshDolarValue(
        typeof optionalRate === "number" ? optionalRate : undefined
      ); // { rate, source }
      if (typeof res?.rate === "number") {
        set({
          rate: res.rate,
          lastUpdated: new Date().toISOString(),
          lastSource: res.source ?? (optionalRate ? "manual" : "api"),
          cooldownUntil: now + 60_000, // cooldown global 60s
        });
      }
      return res;
    } finally {
      set({ isLoading: false });
    }
  },
}));
