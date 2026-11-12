import { useEffect, useState } from "react";
import { getMeasurementUnits, createMeasurementUnit, inventoryError } from "../../services/inventory";

export default function MeasurementUnitSelector({ value, onChange, disabled }) {
  const [units, setUnits] = useState(["unidad"]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; getMeasurementUnits().then(rows => { if (active) setUnits(rows); }).catch(e => { if (active) setError(inventoryError(e)); }); return () => { active = false; }; }, []);
  const save = async () => {
    setBusy(true); setError("");
    try { const result = await createMeasurementUnit(name); setUnits(rows => [...new Set([...rows, result.name])]); onChange(result.name); setCreating(false); setName(""); }
    catch (e) { setError(inventoryError(e)); } finally { setBusy(false); }
  };
  return <div className="space-y-2"><label className="block text-sm">Medida<select className="inputRan w-full rounded p-2 mt-1" disabled={disabled || busy} value={value} onChange={e => onChange(e.target.value)}>{units.map(unit => <option key={unit}>{unit}</option>)}</select></label><button type="button" disabled={disabled || busy} className="admin-secondary p-2 text-sm" onClick={() => setCreating(!creating)}>+ Crear medida</button>{creating && <div className="flex gap-2"><input aria-label="Nueva medida" maxLength={40} className="inputRan min-w-0 w-full rounded p-2" placeholder="gramos, kilos…" value={name} onChange={e => setName(e.target.value)} /><button type="button" disabled={busy || !name.trim()} onClick={save} className="admin-secondary p-2">Crear</button></div>}{error && <p role="alert" className="text-red-400">{error}</p>}</div>;
}
