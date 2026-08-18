import { axiosClient } from "../lib/axiosClient";

export async function getPublicPropertyMapMarkers(companySlug, operation, bounds, signal) {
  const { data } = await axiosClient.get(
    `/api/public/companies/${encodeURIComponent(companySlug)}/properties/map`,
    {
      params: {
        operation,
        minLatitude: bounds?.minLatitude,
        maxLatitude: bounds?.maxLatitude,
        minLongitude: bounds?.minLongitude,
        maxLongitude: bounds?.maxLongitude,
      },
      signal,
    },
  );
  return Array.isArray(data) ? data : [];
}
