import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "https://localhost:7146";
const sendTenantHeader = String(import.meta.env.VITE_SEND_TENANT_HEADER) === "true";

export const axiosClient = axios.create({
  baseURL,
  timeout: 15000,
});

axiosClient.interceptors.request.use((config) => {
  if (sendTenantHeader) {
    const empId = Number(import.meta.env.VITE_DEFAULT_EMPRESA_ID) || 1;
    config.headers["X-Empresa-Id"] = empId;
  }
  return config;
});