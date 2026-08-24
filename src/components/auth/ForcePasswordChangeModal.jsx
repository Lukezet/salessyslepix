import { useState } from "react";
import { changePassword } from "../../services/catalog";
import { useAuth } from "../../store/auth";

export default function ForcePasswordChangeModal() {
  const required = useAuth((state) => state.mustChangePassword);
  const clearRequirement = useAuth((state) => state.clearPasswordChangeRequirement);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!required) return null;
  const submit = async (event) => {
    event.preventDefault();
    if (newPassword.length < 12) return setError("La nueva contraseña debe tener al menos 12 caracteres.");
    if (newPassword !== confirmation) return setError("Las contraseñas nuevas no coinciden.");
    setSaving(true); setError("");
    try {
      await changePassword({ currentPassword, newPassword });
      clearRequirement();
    } catch (cause) {
      setError(cause?.response?.data?.error ?? "No se pudo actualizar la contraseña.");
    } finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-[10000] grid place-items-center bg-slate-950/80 p-4">
    <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-600 bg-white p-6 text-slate-900 shadow-2xl">
      <h2 className="text-xl font-bold">Actualizá tu contraseña</h2>
      <p className="mt-2 text-sm text-slate-600">Tu cuenta fue creada con una contraseña inicial. Para continuar, elegí una contraseña personal.</p>
      <div className="mt-5 space-y-3">
        <label className="grid gap-1 text-sm font-medium">Contraseña inicial<input required type="password" autoFocus value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="grid gap-1 text-sm font-medium">Nueva contraseña<input required minLength="12" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="grid gap-1 text-sm font-medium">Repetir nueva contraseña<input required minLength="12" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" /></label>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <button disabled={saving} className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Actualizando…" : "Guardar nueva contraseña"}</button>
    </form>
  </div>;
}
