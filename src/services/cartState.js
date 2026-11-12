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


// Legacy global carts cannot be attributed safely to a company and are not imported.
export function createCartState(set, get, storage) {
  const write = (items) => {
    const scope = get().scope;
    if (!scope) return;
    set({ items });
    try { storage.setItem(`lepix-cart-v3:${encodeURIComponent(scope)}`, JSON.stringify(items)); } catch { /* Storage may be unavailable. */ }
  };
  return {
    scope: null, items: [],
    setScope: (slug) => {
      const scope = slug?.trim().toLowerCase() || null;
      if (scope === get().scope) return;
      let items = [];
      try {
        const saved = JSON.parse(storage.getItem(`lepix-cart-v3:${encodeURIComponent(scope)}`) ?? '[]');
        if (scope && Array.isArray(saved)) items = saved.filter(i => i?.product?.id && Number.isFinite(i.quantity) && i.quantity > 0);
      } catch { /* A corrupt cart must not leak another tenant's contents. */ }
      set({ scope, items });
    },
    add: (product, qty = 1) => {
      const lineId = buildLineId(product);
      const items = [...get().items];
      const idx = items.findIndex(i => i.lineId === lineId);
      const quantity = Math.max(1, Number(qty) || 1);
      if (idx >= 0) items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity };
      else items.push({ lineId, product: packProductForCart(product), quantity });
      write(items);
    },
    remove: lineId => write(get().items.filter(i => i.lineId !== lineId)),
    setQty: (lineId, qty) => write(get().items.map(i => i.lineId === lineId ? { ...i, quantity: Math.max(1, Number(qty) || 1) } : i)),
    clear: (scope = get().scope) => {
      if (scope === get().scope) write([]);
      else if (scope) { try { storage.setItem(`lepix-cart-v3:${encodeURIComponent(scope)}`, "[]"); } catch { /* Storage may be unavailable. */ } }
    },
    totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    totalAmount: () => get().items.reduce((sum, i) => sum + i.quantity * Number(i.product.price || 0), 0),
  };
}
