
import { useEffect, useState } from "react";
import { getPublicationDrafts, publishPublication } from "../../services/publications";
export default function PublicationDrafts({ revision, onPublished }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getPublicationDrafts().then((rows) => { if (active) setItems(rows); })
      .catch(() => { if (active) setError("No se pudieron cargar tus borradores."); });
    return () => { active = false; };
  }, [revision]);
  const publish = async (id) => {
    if (busy !== null) return;
    setBusy(id); setError("");
    try {
      await publishPublication(id);
      setItems((rows) => rows.filter((item) => item.id !== id));
      onPublished();
    } catch (reason) { setError(reason.response?.data?.error || "No se pudo publicar. El borrador sigue guardado."); }
    finally { setBusy(null); }
  };
  if (!items.length && !error) return null;
  return <section className="mb-5 rounded-xl border border-slate-300 p-4">
    <h2 className="font-semibold">Tus borradores</h2>
    <p className="mt-1 text-sm text-slate-600">Todavía no son visibles en el portal. Publicalos cuando estén listos.</p>
    <ul className="mt-3 space-y-2">{items.map((item) => <li key={item.id} className="flex items-center justify-between gap-3">
      <span>{item.title}</span><button type="button" disabled={busy !== null} onClick={() => publish(item.id)} className="btn-custom px-3 py-2">{busy === item.id ? "Publicando…" : "Publicar"}</button>
    </li>)}</ul>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
  </section>;
}
