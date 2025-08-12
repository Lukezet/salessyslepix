import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCart = create(
  persist(
    (set, get) => ({
      items: [], // { product, quantity }
      add: (product, qty = 1) => {
        // Previene dobles clics rápidos acumulando en exceso
        let items = [...get().items];
        const idx = items.findIndex((i) => i.product.id === product.id);
        if (idx >= 0) items[idx] = { ...items[idx], quantity: items[idx].quantity + qty };
        else items.push({ product, quantity: qty });
        set({ items });
      },
      remove: (productId) => set({ items: get().items.filter((i) => i.product.id !== productId) }),
      clear: () => set({ items: [] }),
      setQty: (productId, qty) => {
        if (qty < 1) return;
        set({
          items: get().items.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i)),
        });
      },
      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      totalAmount: () => get().items.reduce((acc, i) => acc + i.quantity * Number(i.product.price), 0),
    }),
    { name: "lepix-cart" }
  )
);