// Values in application state use an ungrouped decimal point, as expected by Number/API.
export function formatMoneyInput(value) {
  if (value == null || value === "") return "";
  const [integer, fraction] = String(value).split(".");
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".") +
    (fraction === undefined ? "" : `,${fraction}`);
}

export function parseMoneyInput(text) {
  const raw = text.replace(/\./g, "").replace(",", ".");
  if (!/^\d*(\.\d*)?$/.test(raw)) return null;
  if (raw === "") return "";
  return raw.replace(/^0+(?=\d)/, "").replace(/^\./, "0.");
}

export function moneyValidation(value, min, max, step) {
  if (value === "" || value == null) return "";
  const number = Number(value);
  if (!Number.isFinite(number)) return "Ingresá un importe válido.";
  if (min != null && number < Number(min)) return `El importe mínimo es ${formatMoneyInput(min)}.`;
  if (max != null && number > Number(max)) return `El importe máximo es ${formatMoneyInput(max)}.`;
  if (step != null && step !== "any" && Number(step) > 0) {
    const steps = (number - Number(min ?? 0)) / Number(step);
    if (Math.abs(steps - Math.round(steps)) > 0.00001) return `Usá incrementos de ${formatMoneyInput(step)}.`;
  }
  return "";
}
