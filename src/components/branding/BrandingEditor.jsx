import { useRef, useState } from "react";
import { getPalette } from "colorthief";
import { DEFAULT_BRANDING_THEME } from "./theme";

const ROLE_LABELS = {
  primary: "Color principal",
  secondary: "Color secundario",
  accent: "Color de acento",
  surface: "Fondo de secciones",
  onPrimary: "Texto sobre principal",
};

const hexFromColor = (color) => color.hex().toUpperCase();

const normalizeHex = (color) => {
  const value = color?.trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(value) ? value : null;
};

const relativeLuminance = (hex) => {
  const components = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
  const [red, green, blue] = components.map((component) => (
    component <= 0.03928 ? component / 12.92 : ((component + 0.055) / 1.055) ** 2.4
  ));
  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
};

const contrastRatio = (first, second) => {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
};

const preferredTextColor = (background) => (
  contrastRatio(background, "#FFFFFF") >= contrastRatio(background, "#000000")
    ? "#FFFFFF"
    : "#000000"
);

const buildThemeFromPalette = (palette) => ({
  primary: palette[0] ?? DEFAULT_BRANDING_THEME.primary,
  secondary: palette[1] ?? palette[0] ?? DEFAULT_BRANDING_THEME.secondary,
  accent: palette[2] ?? palette[0] ?? DEFAULT_BRANDING_THEME.accent,
  surface: "#FFFFFF",
  onPrimary: preferredTextColor(palette[0] ?? DEFAULT_BRANDING_THEME.primary),
});

/**
 * Editor reutilizable de marca. Es intencionalmente local: quien lo consume
 * persiste el archivo y el tema mediante `onLogoChange` y `onChange`.
 */
export default function BrandingEditor({
  initialTheme = DEFAULT_BRANDING_THEME,
  logoUrl = "",
  onChange,
  onLogoChange,
  disabled = false,
  showPreview = true,
}) {
  const inputRef = useRef(null);
  const [theme, setTheme] = useState(() => ({ ...DEFAULT_BRANDING_THEME, ...initialTheme }));
  const [palette, setPalette] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(logoUrl);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState("");

  const emitTheme = (nextTheme) => {
    setTheme(nextTheme);
    onChange?.(nextTheme);
  };

  const handleRoleChange = (role, color) => {
    const normalizedColor = normalizeHex(color);
    if (!normalizedColor) return;

    const nextTheme = { ...theme, [role]: normalizedColor };
    if (role === "primary") nextTheme.onPrimary = preferredTextColor(normalizedColor);
    emitTheme(nextTheme);
  };

  const handleLogo = async (event) => {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Seleccioná un archivo de imagen válido.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setError("");
    onLogoChange?.(file);
    setIsExtracting(true);

    try {
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      const extracted = await getPalette(image, { colorCount: 6, quality: 8 });
      const nextPalette = (extracted ?? []).map(hexFromColor);

      if (!nextPalette.length) {
        throw new Error("No se encontraron colores utilizables en el logo.");
      }

      setPalette(nextPalette);
      emitTheme(buildThemeFromPalette(nextPalette));
    } catch {
      setError("No pudimos extraer la paleta. Podés elegir los colores manualmente.");
    } finally {
      setIsExtracting(false);
    }
  };

  const primaryContrast = contrastRatio(theme.primary, theme.onPrimary);
  const isAccessiblePrimary = primaryContrast >= 4.5;
  const colorOptions = [...new Set([...palette, ...Object.values(theme)])];

  return (
    <section className="branding-editor rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm" aria-labelledby="branding-editor-title">
      <div className="mb-5">
        <h2 id="branding-editor-title" className="text-lg font-semibold text-neutral-900">Identidad visual</h2>
        <p className="mt-1 text-sm text-neutral-600">Subí el logo y revisá la paleta antes de guardarla para la agencia.</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleLogo}
        disabled={disabled}
      />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-20 w-32 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
          {previewUrl ? (
            <img src={previewUrl} alt="Vista previa del logo" className="h-full w-full object-contain p-2" />
          ) : (
            <span className="px-3 text-center text-xs text-neutral-500">Sin logo cargado</span>
          )}
        </div>
        <button
          type="button"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-800 transition hover:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isExtracting}
        >
          {isExtracting ? "Extrayendo colores..." : "Cargar logo"}
        </button>
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6">
        <h3 className="text-sm font-medium text-neutral-900">Paleta detectada</h3>
        {palette.length ? (
          <div className="mt-3 flex flex-wrap gap-3" aria-label="Colores extraídos del logo">
            {palette.map((color) => (
              <button
                key={color}
                type="button"
                title={`Usar ${color} como color principal`}
                aria-label={`Usar ${color} como color principal`}
                className="group flex w-20 flex-col overflow-hidden rounded-lg border border-neutral-200 text-left focus:outline-none focus:ring-2 focus:ring-neutral-700 focus:ring-offset-2 disabled:opacity-50"
                onClick={() => handleRoleChange("primary", color)}
                disabled={disabled}
              >
                <span className="h-10 w-full" style={{ backgroundColor: color }} />
                <span className="px-2 py-1 text-xs text-neutral-600 group-hover:text-neutral-900">{color}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-neutral-500">La paleta aparecerá al cargar un logo.</p>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <label key={role} className="block text-sm font-medium text-neutral-800">
            {label}
            <span className="mt-2 flex items-center gap-2">
              <input
                type="color"
                value={theme[role]}
                onChange={(event) => handleRoleChange(role, event.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-neutral-300 bg-white p-1 disabled:cursor-not-allowed"
                disabled={disabled}
                aria-label={label}
              />
              <select
                value={theme[role]}
                onChange={(event) => handleRoleChange(role, event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 font-mono text-sm focus:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disabled}
              >
                {colorOptions.map((color) => <option key={color} value={color}>{color}</option>)}
              </select>
            </span>
          </label>
        ))}
      </div>

      {showPreview && <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200">
        <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: theme.primary, color: theme.onPrimary }}>
          <span className="font-semibold">Vista previa de la agencia</span>
          <button type="button" className="rounded-md px-3 py-1 text-sm font-medium ring-1 ring-current" style={{ backgroundColor: theme.accent, color: preferredTextColor(theme.accent) }}>Consultar</button>
        </div>
        <div className="p-4" style={{ backgroundColor: theme.surface }}>
          <p className="text-sm text-neutral-700">Los botones principales, el foco y los elementos destacados usarán estos roles.</p>
          <p className={`mt-2 text-xs ${isAccessiblePrimary ? "text-emerald-700" : "text-amber-700"}`}>
            Contraste principal: {primaryContrast.toFixed(2)}:1 {isAccessiblePrimary ? "(AA para texto normal)" : "(revisar: se recomienda 4.5:1)"}
          </p>
        </div>
      </div>}
    </section>
  );
}
