import * as Location from "expo-location";
import type { AppError, Coordinates } from "@/features/capture/captureTypes";

export type LocationResult =
  | { ok: true; coordinates: Coordinates }
  | { ok: false; error: AppError };

export type LocationService = {
  getCurrentCoordinates: () => Promise<LocationResult>;
};

const locationPermissionDenied = (): AppError => ({
  type: "locationPermissionDenied",
  message: "Location permission is required to add weather context.",
  retryable: true,
});

const unknownLocationError = (): AppError => ({
  type: "unknown",
  message: "Location is unavailable. Please try again.",
  retryable: true,
});

export const createLocationService = (): LocationService => ({
  getCurrentCoordinates: async () => {
    try {
      const current = await Location.getForegroundPermissionsAsync();

      if (!current.granted) {
        if (!current.canAskAgain) {
          return { ok: false, error: locationPermissionDenied() };
        }

        const requested = await Location.requestForegroundPermissionsAsync();

        if (!requested.granted) {
          return { ok: false, error: locationPermissionDenied() };
        }
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        ok: true,
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      };
    } catch {
      return { ok: false, error: unknownLocationError() };
    }
  },
});
