import { useEffect, useState } from "react";
import { resolveInitialMapLocation } from "../services/mapLocation";

export function useInitialMapLocation(mapId) {
  const [location, setLocation] = useState(null);
  useEffect(() => {
    let active = true;
    resolveInitialMapLocation(mapId).then((result) => { if (active) setLocation(result); });
    return () => { active = false; };
  }, [mapId]);
  return location;
}
