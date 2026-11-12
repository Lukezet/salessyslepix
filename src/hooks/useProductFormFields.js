import { useEffect, useState } from "react";
import { getProductFormFields } from "../services/inventory";

export function useProductFormFields() {
  const [fields, setFields] = useState({});
  useEffect(() => { let active = true; getProductFormFields().then(value => { if (active) setFields(value); }).catch(() => {}); return () => { active = false; }; }, []);
  return { fields, required: name => fields[name]?.sn_required === true };
}
