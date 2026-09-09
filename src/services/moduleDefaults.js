import { axiosClient } from "../lib/axiosClient";

export async function getModuleDefaults() {
  const { data } = await axiosClient.get("/api/platform/module-defaults");
  return data.components ?? {};
}

export async function saveModuleDefaults(components) {
  const { data } = await axiosClient.put("/api/platform/module-defaults", { components });
  return data.components ?? {};
}
