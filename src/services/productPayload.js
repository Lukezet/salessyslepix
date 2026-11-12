export function mapAdminToApi(payload) {
  return {
    subproducts: payload.subproducts,
    videoUrls: payload.videoUrls,
    providerId: payload.providerId ?? null,
    categoryId: payload.categoryId,
    brandId: payload.brandId,
    name: payload.name,
    // si querés asegurar el slug auto desde el service:
    // slug: slugify(payload.name),
    description: payload.description,
    price: Number(payload.price) || 0,

    images: (payload.images ?? []).map((image, sort) => ({ url: image.url, sort: image.sort ?? sort })),
    currency: payload.currency,
    // ✅ enviar IDs, no strings
    variants: (payload.variants ?? []).map(v => ({
      id: v.id ?? null, 
      colorId: v.colorId ?? null,
      sizeId:  v.sizeId  ?? null,
      sku: v.sku || "", // (ya lo generás auto en el form)
      priceOverride:
        v.priceOverride === null || v.priceOverride === "" || typeof v.priceOverride === "undefined"
          ? null
          : Number(v.priceOverride),
      isDefault: !!v.isDefault,
      images: (v.images ?? []).map((vi, j) => ({
        url: vi.url,
        sort: typeof vi.sort === "number" ? vi.sort : j
      }))
    })),
  };
}

