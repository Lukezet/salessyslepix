export function sessionMatchesPortal(session, portalSlug) {
  if (!session?.token) return false;
  if (session.roles?.includes("PlatformAdmin")) return true;
  if (!portalSlug) return true; // Legacy routes retain the token's own tenant.
  return typeof session.empresaSlug === "string" &&
    session.empresaSlug.trim().toLowerCase() === portalSlug.trim().toLowerCase();
}
