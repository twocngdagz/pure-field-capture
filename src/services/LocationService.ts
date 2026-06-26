import * as Location from "expo-location";
import type { AppError, Coordinates } from "@/features/capture/captureTypes";

export type LocationResult =
  | { ok: true; coordinates: Coordinates; address: string | null }
  | { ok: false; error: AppError };

export type LocationService = {
  getCurrentCoordinates: () => Promise<LocationResult>;
};

const trimOrEmpty = (value: string | null | undefined): string => value?.trim() ?? "";

const firstTrimmed = (...values: (string | null | undefined)[]): string => {
  for (const value of values) {
    const trimmed = trimOrEmpty(value);
    if (trimmed) return trimmed;
  }

  return "";
};

const dedupeAdjacent = (parts: string[]): string[] => {
  const result: string[] = [];

  for (const part of parts) {
    const last = result[result.length - 1];
    if (last !== undefined && last.toLowerCase() === part.toLowerCase()) continue;
    result.push(part);
  }

  return result;
};

export const formatAddress = (
  address: Location.LocationGeocodedAddress,
): string | null => {
  const formatted = trimOrEmpty(address.formattedAddress);
  if (formatted) return formatted;

  const streetNumber = trimOrEmpty(address.streetNumber);
  const street = trimOrEmpty(address.street);

  const streetLine =
    streetNumber && street
      ? `${streetNumber} ${street}`
      : firstTrimmed(address.street, address.name);

  const locality = firstTrimmed(address.city, address.district, address.subregion);

  const regionLine = trimOrEmpty(
    [trimOrEmpty(address.region), trimOrEmpty(address.postalCode)]
      .filter(Boolean)
      .join(" "),
  );

  const country = trimOrEmpty(address.country);

  const parts = dedupeAdjacent(
    [streetLine, locality, regionLine, country].filter((part) => part.length > 0),
  );

  return parts.length > 0 ? parts.join(", ") : null;
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

const getAddressForCoordinates = async (
  coordinates: Coordinates,
): Promise<string | null> => {
  try {
    const [first] = await Location.reverseGeocodeAsync(coordinates);
    return first ? formatAddress(first) : null;
  } catch {
    return null;
  }
};

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

      const coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      const address = await getAddressForCoordinates(coordinates);

      return { ok: true, coordinates, address };
    } catch {
      return { ok: false, error: unknownLocationError() };
    }
  },
});
