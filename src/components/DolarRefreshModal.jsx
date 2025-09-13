import { useEffect, useMemo, useRef, useState } from "react";

export default function DolarRefreshModal({
  open,
  onClose,
  onConfirm, // (optionalRate:number|null) => Promise<{ rate:number }>
}) {
  const [value, setValue] = useState("");           // texto del input
  const [loading, setLoading] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const lastClickRef = useRef(0);

  // cooldown de 60s
  const now = Date.now();
  const inCooldown = now < cooldownUntil;

  // botón deshabilitado si: cargando, cooldown, input inválido (si ingresó algo)
  const numericValue = useMemo(() => {
    if (String(value).trim() === "") return null;
    const n = Number(String(value).replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : NaN;
  }, [value]);

  const inputHasError = value.trim() !== "" && !Number.isFinite(numericValue);
  const disabled = loading || inCooldown || inputHasError;

  useEffect(() => {
    if (!open) {
      setValue("");
      setLoading(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (disabled) return;
    const nowMs = Date.now();
    if (nowMs - lastClickRef.current < 60000) return; // doble seguridad
    lastClickRef.current = nowMs;

    try {
      setLoading(true);
      const payloadRate = numericValue === null ? null : numericValue; // null => refrescar API
      await onConfirm?.(payloadRate);  
      // arranca cooldown 60s
      setCooldownUntil(Date.now() + 60_000);
      // cerrar modal si todo OK
      onClose?.();
    } catch (e) {
      // opcional: mostrar toast
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl border border-zinc-100 dark:border-zinc-700 bg-white  p-5 shadow-xl">
        <div className="mb-4">
          <h2 className="text-lg text-neutral-800 font-semibold">Modificar / Refrescar valor de Dólar</h2>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Ingresá un valor (opcional)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`flex-1 rounded-lg border px-3 py-2 bg-transparent outline-none inputRan mr-2
              border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-zinc-400
              ${inputHasError ? " ring-2 ring-red-500 border-red-500" : ""}`}
          />
          <button
            onClick={handleConfirm}
            disabled={disabled}
            className={`px-3 py-2 rounded-md border text-amber-400 text-sm font-medium inputRanBlack cursor-pointer
              ${disabled
                ? "opacity-60 cursor-not-allowed border-zinc-300 dark:border-zinc-700"
                : "border-zinc-300 dark:border-zinc-700 hover:scale-[1.02] transition"}`}
          >
            {loading ? "Actualizando…" : inCooldown ? "Esperá 1 min" : "Refrescar"}
          </button>
        </div>

        <p className="text-sm opacity-80">
          Si No introducís un valor, se consultará a la fuente y se refrescará.
        </p>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm rounded-md border hover:bg-red-200 dark:hover:bg-red-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
