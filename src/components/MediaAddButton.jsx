import { useRef } from "react";
import { ImagePlus, Video } from "lucide-react";
export default function MediaAddButton({ video = false, onFiles, disabled = false }) {
  const input = useRef(null);
  const Icon = video ? Video : ImagePlus;
  return <div className="min-w-0 w-full">
    <input ref={input} className="hidden" type="file" multiple accept={video ? ".mp4,.m4v,.mov,.webm,video/mp4,video/webm,video/quicktime" : "image/*"} disabled={disabled} onChange={(event) => { onFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    <button type="button" disabled={disabled} onClick={() => input.current?.click()} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: "var(--tenant-color-primary)", color: "var(--tenant-color-on-primary)", borderColor: "var(--tenant-color-primary)" }}>
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" /><span>{video ? "Añadir Video" : "Añadir imágenes"}</span>
    </button>
  </div>;
}
