import { useEffect, useState } from "react";
import { useTenantBranding, useTenantConfig } from "../../store/tenantConfig";

const COLOR_FIELDS = [
  ["primary", "Color principal"],
  ["primaryHover", "Color principal (hover)"],
  ["surface", "Fondo"],
  ["text", "Texto"],
  ["footer", "Pie de página"],
];

export default function BrandingEditor() {
  const branding = useTenantBranding();
  const updateBranding = useTenantConfig((state) => state.updateBranding);
  const uploadBrandingLogo = useTenantConfig((state) => state.uploadBrandingLogo);
  const isConfigLoading = useTenantConfig((state) => state.isLoading);
  const [form, setForm] = useState(branding);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setForm(branding);
  }, [branding]);

  const updateTheme = (key, value) => {
    setForm((current) => ({
      ...current,
      theme: { ...current.theme, [key]: value },
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      let logoUrl = form.logoUrl?.trim() || null;
      if (logoFile) {
        if (!logoFile.type.startsWith("image/")) {
          throw new Error("Seleccioná un archivo de imagen válido.");
        }
        if (logoFile.size > 2 * 1024 * 1024) {
          throw new Error("El logo no puede superar 2 MB.");
        }
        logoUrl = await uploadBrandingLogo(logoFile);
      }
      await updateBranding({
        logoUrl,
        theme: form.theme,
      });
      setLogoFile(null);
      setMessage({ type: "success", text: "Branding guardado." });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "No se pudo guardar el branding." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Marca de la empresa</h2>
        <p className="text-sm text-neutral-600">
          Personalizá los colores y el logo que se muestran en el portal.
        </p>
      </div>

      <form className="grid gap-4" onSubmit={handleSave}>
        <label className="grid gap-1 text-sm font-medium">
          URL pública del logo
          <input
            className="inputRan px-3 py-2"
            type="url"
            placeholder="https://ejemplo.com/logo.png"
            value={form.logoUrl ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, logoUrl: event.target.value }))}
          />
          <span className="font-normal text-xs text-neutral-500">Podés usar una URL pública HTTPS o subir una imagen.</span>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Subir logo
          <input
            accept="image/*"
            className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:font-medium hover:file:bg-neutral-200"
            type="file"
            onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
          />
          <span className="font-normal text-xs text-neutral-500">PNG, JPG, WEBP o SVG. Máximo 2 MB.</span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {COLOR_FIELDS.map(([key, label]) => (
            <label className="grid gap-1 text-sm font-medium" key={key}>
              {label}
              <input
                className="h-10 w-full cursor-pointer rounded border border-neutral-300 p-1"
                type="color"
                value={form.theme[key]}
                onChange={(event) => updateTheme(key, event.target.value)}
              />
            </label>
          ))}
        </div>

        {message && (
          <p className={message.type === "success" ? "text-sm text-green-700" : "text-sm text-red-700"}>
            {message.text}
          </p>
        )}

        <div>
          <button className="btn-custom px-4 py-2 disabled:cursor-not-allowed disabled:opacity-60" disabled={saving || isConfigLoading} type="submit">
            {saving ? "Guardando…" : "Guardar marca"}
          </button>
        </div>
      </form>
    </section>
  );
}
