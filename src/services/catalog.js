// src/services/catalog.js (o el archivo que estás usando)
import { axiosClient } from "../lib/axiosClient";
/* ========= MAPPERS ========= */

// Para TIENDA: imágenes como string[] (lo que espera tu ImageSlider)
function mapProductApiToShop(p) {
  return {
    ...p,
    // 👇 esto preserva brandName tal como viene del API
    brandName: p.brandName,
    images: Array.isArray(p.images) ? p.images.map(i => i.url) : [],
    variants: Array.isArray(p.variants)
      ? p.variants.map(v => ({
          ...v,
          images: Array.isArray(v.images) ? v.images.map(i => i.url) : [],
          price: v.price ?? v.priceOverride ?? p.price
        }))
      : []
  };
}


// Para ADMIN: dejamos las imágenes y variantes tal cual (objetos con {url,sort})
function mapProductApiToAdmin(p) {
  return {
    ...p,
    images: Array.isArray(p.images) ? p.images : [],
    variants: Array.isArray(p.variants) ? p.variants : []
  };
}

// Para enviar AL BACKEND desde ADMIN (estructura correcta)
function mapAdminToApi(payload) {
  return {
    categoryId: payload.categoryId,
    brandId: payload.brandId,
    name: payload.name,
    // si querés asegurar el slug auto desde el service:
    // slug: slugify(payload.name),
    description: payload.description,
    price: Number(payload.price) || 0,

    // 🚫 ya no usamos imágenes de producto
    images: [],
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

/* ========= CATEGORÍAS ========= */

export async function getCategories() {
  const { data } = await axiosClient.get("/api/Categories");
  return data;
}
export async function getCategoryById(id) {
  const { data } = await axiosClient.get(`/api/Categories/${id}`);
  return data;
}
export async function createCategory(payload) {
  // { name, slug, image }
  const { data } = await axiosClient.post("/api/Categories", payload);
  return data;
}

/* ========= PRODUCTOS (TIENDA) ========= */

export async function getProducts() {
  const { data } = await axiosClient.get("/api/Products");
  return data.map(mapProductApiToShop);
}
export async function getProductsPaginated(page = 1, pageSize = 20, search = "") {
  const { data } = await axiosClient.get("/api/Products/paginated", {
    params: {
      page,
      pageSize,
      search: search || undefined,        // nombre del parámetro que espera el backend
      includeDisabled: true               // para que admin vea TODAS las variantes
    }
  });

  // Normalizar shape para el front
  return {
    items: Array.isArray(data?.items) ? data.items.map(mapProductApiToShop) : [],
    totalCount: Number(data?.totalCount ?? 0),
    totalPages: Number(data?.totalPages ?? 1),
    page: Number(data?.page ?? page),
    pageSize: Number(data?.pageSize ?? pageSize)
  };
}
export async function getProductById(id) {
  const { data } = await axiosClient.get(`/api/Products/${id}`);
  return mapProductApiToShop(data);
}
export async function getProductBySlug(slug) {
  const { data } = await axiosClient.get(`/api/Products/by-slug/${slug}`);
  return mapProductApiToShop(data);
}
export async function getProductsByCategoryId(categoryId) {
  const { data } = await axiosClient.get(`/api/Products/by-category/${categoryId}`);
  return data;
}
export async function searchProducts({ q }) {
  const params = new URLSearchParams({ q });
  // Ajustá la ruta a la que tengas en tu .NET (ejemplos comunes):
  // const { data } = await api.get(`/api/products/search?${params}`);
  // o: 
  // const { data } = await api.get(`/api/products?search=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`);
  const { data } = await axiosClient.get(`/api/Products/search?${params}`); // ← ajustá esto
  return data;
}

export async function searchProducts2(q) {
  const { data } = await axiosClient.get('/api/Products/search', { params: { q } });
  return Array.isArray(data) ? data : [];
}
/* ========= PRODUCTOS (ADMIN) ========= */
// Estos no transforman a string[] y envían el DTO correcto
// services/catalog.js
export async function setProductVariantDisabled(variantId, disabled) {
  const { data } = await axiosClient.patch(
    `/api/Products/variants/${variantId}/disabled`,
    { isDisabled: disabled } // 👈 nombre correcto
  );
  return data;
}

export async function getProductAdminById(id) {
  const { data } = await axiosClient.get(`/api/Products/${id}`);
  return mapProductApiToAdmin(data);
}

export async function createProduct(payloadAdmin) {
  // payloadAdmin: { categoryId, brandId, name, slug, description, price, images: [{url,sort}], variants: [...] }
  const payload = mapAdminToApi(payloadAdmin);
  const { data } = await axiosClient.post("/api/Products", payload);
  return mapProductApiToAdmin(data);
}

export async function updateProduct(id, payloadAdmin) {
  const payload = mapAdminToApi(payloadAdmin);
  const { data } = await axiosClient.put(`/api/Products/${id}`, payload);
  return mapProductApiToAdmin(data);
}

export async function deleteProduct(id) {
  await axiosClient.delete(`/api/Products/${id}`);
  return true;
}
/* ========= PROVEEDORES ========= */
export const listProviders = () =>
  axiosClient.get("/api/Providers").then(r => r.data);
export const createProviders = (payload) =>
  // payload: { name, slug, logoUrl?, website?, description? }
  axiosClient.post("/api/Providers", payload).then(r => r.data);

/* ========= MARCAS ========= */

export const listBrands = () =>
  axiosClient.get("/api/brands").then(r => r.data);

export const createBrand = (payload) =>
  // payload: { name, slug, logoUrl?, website?, description? }
  axiosClient.post("/api/brands", payload).then(r => r.data);

/* ========= MEDIA (Bunny) ========= */

export const uploadProductImage = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosClient
    .post("/api/media/product-image", fd, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    .then(r => r.data); // { url }
};

// Colors and SizesOptions
export const listColors = () => axiosClient.get("/api/colors").then(r => r.data);

export const listSizes  = () => axiosClient.get("/api/sizes").then(r => r.data);

//Crear orden de compra
export async function createOrder(payload) {
  const { data } = await axiosClient.post("/api/Orders", payload);
  return data;
}


//EMPRESA

export async function getEmpresaPhoneNumber() {
  const { data } = await axiosClient.get("/api/Public/contacto");
  return data; // Devuelve el string del número
}

// ======================
// ORDERS
// ======================
export async function getOrders(page = 1, pageSize = 10, searchTerm = "", stateFilter = "") {
  
  const { data } = await axiosClient.get("/api/orders", {
    params: { page, pageSize, searchTerm, stateFilter },
  });
  console.log(data)
  return data;
}

export async function getOrdersSummary(fromDateISO, toDateISO) {
  const { data } = await axiosClient.get("/api/orders/summary", {
    params: { fromDate: fromDateISO, toDate: toDateISO },
  });
  return data; // [{ state: "Pending", count: 3, totalAmount: 12345 }, ...]
}

export async function updateOrderState(id, newState) {
  await axiosClient.put(`/api/orders/${id}/state`, { newState });
}

export async function deleteOrder(id) {
  await axiosClient.delete(`/api/orders/${id}`);

}
export async function updateOrder(orderId, payload) {
  console.log("Updateamos a :",payload)
  const { data } = await axiosClient.put(`/api/orders/${orderId}`, payload);
  // Opción A del endpoint: { updated: boolean }
  return data?.updated ?? false;
}

// === AUTH ===
export async function authLogin({ email, password, portalSlug }) {
  const { data } = await axiosClient.post("/api/auth/login", { email, password, portalSlug }, { withCredentials: true });
  return data; // { token, userName, email, empresaId, roles:[] }
}
export async function refreshAuthSession() {
  const { data } = await axiosClient.post("/api/auth/refresh", undefined, { withCredentials: true });
  return data;
}
export async function logoutAuthSession() {
  await axiosClient.post("/api/auth/logout", undefined, { withCredentials: true });
}
// Helpers para setear/quitar el header global Authorization
export function setAuthToken(token) {
  if (token) {
    axiosClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axiosClient.defaults.headers.common["Authorization"];
  }
}

// ==== USD Dolars ====

// Refresca contra la API o fija el valor manual si mandás { rate }
export async function refreshDolarValue(rate) {
  const payload = typeof rate === "number" && !Number.isNaN(rate) ? { rate } : undefined;
  const { data } = await axiosClient.post("/api/exchange-rate/refresh", payload);
  return data; // { rate, source }
} 

export async function getDolarValue() {
  const { data } = await axiosClient.get("/api/exchange-rate");
  return data;
}

export async function getPriceIncreasePreview({ brandIds=[], providerIds=[], categoryIds=[], max=200 }) {
  const p = new URLSearchParams();
  brandIds.forEach(id => p.append("brandIds", id));
  providerIds.forEach(id => p.append("providerIds", id));
  categoryIds.forEach(id => p.append("categoryIds", id));
  if (max) p.set("max", String(max));
  const { data } = await axiosClient.get(`/api/price-adjustments/preview?${p.toString()}`);
  return data;
}

export async function applyPriceIncrease({ percent, brandIds=[], providerIds=[], categoryIds=[], excludeProductIds=[], affectVariantOverrides=true }) {
  const body = { percent, brandIds, providerIds, categoryIds, excludeProductIds, affectVariantOverrides };
  const { data } = await axiosClient.post(`/api/price-adjustments/apply`, body);
  return data;
}
export async function changePassword({ currentPassword, newPassword }) {
  await axiosClient.post("/api/auth/change-password", { currentPassword, newPassword });
}
