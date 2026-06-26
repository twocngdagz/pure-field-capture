import type { AppError, Coordinates } from "@/features/capture/captureTypes";
import type { LocationResult, LocationService } from "./LocationService";

type FakeLocationInput =
  | { ok: true; coordinates: Coordinates; address?: string | null }
  | { ok: false; error: AppError };

const normalizeFakeLocationResult = (input: FakeLocationInput): LocationResult =>
  input.ok
    ? {
        ok: true,
        coordinates: input.coordinates,
        address:
          input.address === undefined ? "1 Market St, San Francisco" : input.address,
      }
    : input;

export const createFakeLocationService = (
  result: FakeLocationInput = {
    ok: true,
    coordinates: { latitude: 37.7749, longitude: -122.4194 },
  },
): LocationService & { requestCount: () => number } => {
  let count = 0;
  const normalized = normalizeFakeLocationResult(result);

  return {
    getCurrentCoordinates: async () => {
      count += 1;
      return normalized;
    },
    requestCount: () => count,
  };
};
