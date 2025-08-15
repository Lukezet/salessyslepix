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

// Para enviar AL BACKEND desde ADMIN (aseguramos estructura)
function mapAdminToApi(payload) {
  return {
    categoryId: payload.categoryId,
    brandId: payload.brandId,                         // 👈 obligatorio ahora
    name: payload.name,
    slug: payload.slug,
    description: payload.description,
    price: Number(payload.price) || 0,
    images: (payload.images ?? []).map((i, idx) => ({
      url: i.url,
      sort: typeof i.sort === "number" ? i.sort : idx
    })),
    variants: (payload.variants ?? []).map(v => ({
      color: v.color ?? null,
      size: v.size ?? null,
      sku: v.sku ?? "",
      priceOverride:
        v.priceOverride === null || v.priceOverride === "" || typeof v.priceOverride === "undefined"
          ? null
          : Number(v.priceOverride),
      isDefault: !!v.isDefault,
      images: (v.images ?? []).map((vi, j) => ({
        url: vi.url,
        sort: typeof vi.sort === "number" ? vi.sort : j
      }))
    }))
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
  return data.map(mapProductApiToShop);
}

/* ========= PRODUCTOS (ADMIN) ========= */
// Estos no transforman a string[] y envían el DTO correcto

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
