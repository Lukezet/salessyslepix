import { axiosClient } from "../lib/axiosClient";
import { independentBlockEnabled } from "./componentModules";
export function videosEnabled(features, category) {
  return independentBlockEnabled(features, "videos", category);
}
export async function uploadVideo(file, category) {
  await validateVideoFile(file);
  const body = new FormData();
  body.append("file", file);
  const { data } = await axiosClient.post(`/api/media/${category}/video`, body, { timeout: 600000 });
  return data.url;
}

export function videoSource(url) {
  try {
    const resolved = new URL(url, import.meta.env.VITE_API_BASE_URL || window.location.origin);
    return ["https:", "http:"].includes(resolved.protocol) ? resolved.href : undefined;
  } catch { return undefined; }
}

export async function validateVideoFile(file) {
  if (!file.size || file.size > 100 * 1024 * 1024 || !/\.(mp4|m4v|mov|webm)$/i.test(file.name)) throw new Error(`${file.name}: usá MP4, MOV, M4V o WebM de hasta 100 MB.`);
  await new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    const finish = (error) => {
      clearTimeout(timer); video.onloadedmetadata = null; video.onerror = null;
      video.removeAttribute("src"); video.load(); URL.revokeObjectURL(url);
      if (error) reject(new Error(`${file.name}: ${error}`)); else resolve();
    };
    const timer = setTimeout(() => finish("no se pudo comprobar la duración."), 15000);
    video.preload = "metadata";
    video.onloadedmetadata = () => finish(!Number.isFinite(video.duration) || video.duration <= 0 ? "no se pudo comprobar la duración." : video.duration > 180 ? "la duración máxima es de 3 minutos." : null);
    video.onerror = () => finish("el navegador no puede leer este formato. Probá con MP4 H.264.");
    video.src = url;
  });
}
