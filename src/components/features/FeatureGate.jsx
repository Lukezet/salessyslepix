import { useFeature } from "../../store/tenantConfig";

/**
 * Hides an optional UI module unless the current tenant enabled it.
 * It deliberately does not replace the API authorization checks.
 */
export default function FeatureGate({ feature, children, fallback = null }) {
  const enabled = useFeature(feature);
  return enabled ? children : fallback;
}
