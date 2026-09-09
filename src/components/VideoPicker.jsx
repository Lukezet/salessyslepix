import { useRef, useState } from "react";
import MediaAddButton from "./MediaAddButton";
import { validateVideoFile } from "../services/videos";
export default function VideoPicker({ files, onChange, urls = [], onUrlsChange, disabled = false, imagePicker }) {
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const busy = useRef(false);
  const select = async (selected) => {
    if (busy.current || !selected.length) return;
    setError("");
    if (files.length + urls.length + selected.length > 3) { setError("Podés añadir un máximo de 3 videos por publicación."); return; }
    busy.current = true; setChecking(true);
    try { for (const file of selected) await validateVideoFile(file); onChange([...files, ...selected]); }
    catch (e) { setError(e.message); }
    finally { busy.current = false; setChecking(false); }
  };
  return <div className="mt-3">
    <div className={imagePicker ? "grid grid-cols-2 items-start gap-2" : "w-full"}>{imagePicker}<MediaAddButton video onFiles={select} disabled={disabled || checking || files.length + urls.length >= 3} /></div>
    <p className="mt-2 text-xs text-neutral-600">Máximo 3 videos de hasta 3 minutos y 100 MB cada uno. MP4, MOV, M4V o WebM.</p>
    {checking && <p role="status" className="mt-2 text-sm">Comprobando duración…</p>}
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    <ul className="mt-3 space-y-2">{urls.map((url, index) => <li key={url} className="flex items-center justify-between gap-3 text-sm"><span>Video {index + 1}</span>{onUrlsChange && <button type="button" disabled={disabled || checking} onClick={() => onUrlsChange(urls.filter((item) => item !== url))}>Quitar</button>}</li>)}{files.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 text-sm"><span className="truncate">{file.name}</span><button type="button" disabled={disabled || checking} onClick={() => onChange(files.filter((_, i) => i !== index))}>Quitar</button></li>)}</ul>
  </div>;
}
