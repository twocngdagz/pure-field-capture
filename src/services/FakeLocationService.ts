import type { LocationResult, LocationService } from "./LocationService";

export const createFakeLocationService = (
  result: LocationResult = {
    ok: true,
    coordinates: { latitude: 37.7749, longitude: -122.4194 },
  },
): LocationService & { requestCount: () => number } => {
  let count = 0;

  return {
    getCurrentCoordinates: async () => {
      count += 1;
      return result;
    },
    requestCount: () => count,
  };
};
