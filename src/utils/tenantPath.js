import { useParams } from "react-router-dom";

export function useTenantPath() {
  const { clientSlug } = useParams();

  return (path) => (clientSlug ? `/${clientSlug}${path}` : path);
}
