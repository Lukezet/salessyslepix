// src/store/cart.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

function buildLineId(p) {
  // 0 = sin variante
  const variantId = p.variantId ?? 0;
  return `${p.id}:${variantId}`;
}

function normalizeImages(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(x => (typeof x === "string" ? x : x?.url)).filter(Boolean);
}

function packProductForCart(p) {
  // nombre decorado si hay color/size (o usá p.displayName si ya lo armaste)
  const name =
    p.displayName ||
    (p.color || p.size
      ? `${p.name} ${p.color ?? ""} ${p.size ?? ""}`.trim()
      : p.name);

  return {
    id: p.id,
    name,
    price: Number(p.price) || 0,         // precio efectivo (variante o base)
    images: normalizeImages(p.images),   // galería efectiva (variante > producto)
    sku: p.sku ?? null,
    variantId: p.variantId ?? null,
    color: p.color ?? null,
    size: p.size ?? null,
  };
}

export const useCart = create(
  persist(
    (set, get) => ({
      // items: [{ lineId, product: {…}, quantity }]
      items: [],

      add: (product, qty = 1) => {
        const lineId = buildLineId(product);
        const items = [...get().items];
        const idx = items.findIndex(i => i.lineId === lineId);

        const packed = packProductForCart(product);
        const quantity = Math.max(1, Number(qty) || 1);

        if (idx >= 0) {
          items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity };
        } else {
          items.push({ lineId, product: packed, quantity });
        }
        set({ items });
      },

      // ahora operamos por lineId (producto+variante)
      remove: (lineId) => {
        set({ items: get().items.filter(i => i.lineId !== lineId) });
      },

      setQty: (lineId, qty) => {
        const q = Math.max(1, Number(qty) || 1);
        set({
          items: get().items.map(i => (i.lineId === lineId ? { ...i, quantity: q } : i)),
        });
      },

      clear: () => set({ items: [] }),

      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),

      totalAmount: () =>
        get().items.reduce((acc, i) => acc + i.quantity * Number(i.product.price || 0), 0),
    }),
    { name: "lepix-cart-v2" } // ← nueva key para evitar choque con formato viejo
  )
);
