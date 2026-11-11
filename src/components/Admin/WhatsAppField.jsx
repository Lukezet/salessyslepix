export default function WhatsAppField({ value, onChange }) {
  return <label className="grid gap-1 text-sm font-medium text-slate-100">
    WhatsApp de contacto (opcional)
    <input type="tel" maxLength={50} autoComplete="off" className="inputRan px-3 py-2" placeholder="+54 9 264 1234567" value={value} onChange={(event) => onChange(event.target.value)} />
    <span className="text-xs font-normal text-slate-400">Número con WhatsApp y código de país. En Argentina usá +54 9, código de área sin 0 y número sin 15. Se mostrará un botón de contacto en los inmuebles. Dejalo vacío para ocultarlo.</span>
  </label>;
}
