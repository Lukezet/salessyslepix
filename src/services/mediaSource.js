
export function resolveMediaSource(value, apiBase, pageOrigin) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const source = new URL(value.trim(), new URL(apiBase || pageOrigin, pageOrigin));
    return ["http:", "https:"].includes(source.protocol) ? source.href : null;
  } catch { return null; }
}
