import { axiosClient } from "../lib/axiosClient";

// Tipos base (si usás TS, convertí a interfaces)
function mapProductApiToUi(p) {
  // Si tu UI espera images como strings (por mock), las mapeamos:
  // En la API vienen como [{id, url, sort}]
  const images = Array.isArray(p.images) ? p.images.map(i => i.url) : [];
  return { ...p, images };
}

/** CATEGORIES **/
export async function getCategories() {
  const { data } = await axiosClient.get("/api/Categories");
  // data: CategoryDto[]
  return data;
}

export async function getCategoryById(id) {
  const { data } = await axiosClient.get(`/api/Categories/${id}`);
  return data;
}

export async function createCategory(payload) {
  // payload: { name, slug, image }
  const { data } = await axiosClient.post("/api/Categories", payload);
  return data;
}

/** PRODUCTS **/
export async function getProducts() {
  const { data } = await axiosClient.get("/api/Products");
  // data: ProductDto[] (con images [{id,url,sort}])
  return data.map(mapProductApiToUi);
}

export async function getProductById(id) {
  const { data } = await axiosClient.get(`/api/Products/${id}`);
  return mapProductApiToUi(data);
}

export async function getProductBySlug(slug) {
  const { data } = await axiosClient.get(`/api/Products/by-slug/${slug}`);
  return mapProductApiToUi(data);
}

export async function getProductsByCategoryId(categoryId) {
  const { data } = await axiosClient.get(`/api/Products/by-category/${categoryId}`);
  return data.map(mapProductApiToUi);
}

export async function createProduct(payload) {
  // payload: { categoryId, name, nameBrand, slug, description, price, images?: [{url, sort}] }
  const { data } = await axiosClient.post("/api/Products", payload);
  return mapProductApiToUi(data);
}

export async function updateProduct(id, payload) {
  const { data } = await axiosClient.put(`/api/Products/${id}`, payload);
  return mapProductApiToUi(data);
}

export async function deleteProduct(id) {
  await axiosClient.delete(`/api/Products/${id}`);
  return true;
}
