import { PermissionStatus } from "expo";
import * as Location from "expo-location";
import { createLocationService, formatAddress } from "../LocationService";
import { createFakeLocationService } from "../FakeLocationService";

jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
  Accuracy: {
    Balanced: 3,
  },
}));

const mockGetPermissions = jest.mocked(Location.getForegroundPermissionsAsync);
const mockRequestPermissions = jest.mocked(Location.requestForegroundPermissionsAsync);
const mockGetPosition = jest.mocked(Location.getCurrentPositionAsync);
const mockReverseGeocode = jest.mocked(Location.reverseGeocodeAsync);

const mockPosition = {
  coords: {
    latitude: 37.7749,
    longitude: -122.4194,
    altitude: null,
    accuracy: 10,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: 0,
};

const defaultGeocodeResult = [
  { streetNumber: "1", street: "Market St", city: "San Francisco" },
] as Location.LocationGeocodedAddress[];

describe("formatAddress", () => {
  it("returns trimmed formattedAddress when present and non-empty", () => {
    expect(
      formatAddress({
        formattedAddress: "  1 Market St, San Francisco  ",
      } as Location.LocationGeocodedAddress),
    ).toBe("1 Market St, San Francisco");
  });

  it("composes full address from structured fields", () => {
    expect(
      formatAddress({
        streetNumber: "1",
        street: "Market St",
        city: "San Francisco",
        region: "CA",
        postalCode: "94105",
        country: "United States",
      } as Location.LocationGeocodedAddress),
    ).toBe("1 Market St, San Francisco, CA 94105, United States");
  });

  it("uses street without number", () => {
    expect(
      formatAddress({
        street: "Market St",
        city: "San Francisco",
      } as Location.LocationGeocodedAddress),
    ).toBe("Market St, San Francisco");
  });

  it("falls back to name for street line", () => {
    expect(
      formatAddress({
        name: "Golden Gate Park",
        city: "San Francisco",
      } as Location.LocationGeocodedAddress),
    ).toBe("Golden Gate Park, San Francisco");
  });

  it("uses district as locality fallback", () => {
    expect(
      formatAddress({
        street: "Main Rd",
        district: "Inner North",
      } as Location.LocationGeocodedAddress),
    ).toBe("Main Rd, Inner North");
  });

  it("uses subregion as locality fallback", () => {
    expect(
      formatAddress({
        street: "Main Rd",
        subregion: "Bay Area",
      } as Location.LocationGeocodedAddress),
    ).toBe("Main Rd, Bay Area");
  });

  it("de-dupes adjacent case-insensitive locality values", () => {
    expect(
      formatAddress({
        street: "Main St",
        city: "Melbourne",
        region: "melbourne",
      } as Location.LocationGeocodedAddress),
    ).toBe("Main St, Melbourne");
  });

  it("returns null when all fields are empty", () => {
    expect(formatAddress({} as Location.LocationGeocodedAddress)).toBeNull();
  });

  it("falls back to district when city is whitespace-only", () => {
    expect(
      formatAddress({
        street: "Main Rd",
        city: " ",
        district: "Inner North",
      } as Location.LocationGeocodedAddress),
    ).toBe("Main Rd, Inner North");
  });

  it("falls back to name when street is whitespace-only", () => {
    expect(
      formatAddress({
        street: " ",
        name: "Golden Gate Park",
        city: "San Francisco",
      } as Location.LocationGeocodedAddress),
    ).toBe("Golden Gate Park, San Francisco");
  });

  it("does not treat whitespace street as present with streetNumber", () => {
    expect(
      formatAddress({
        streetNumber: "1",
        street: " ",
        name: "Golden Gate Park",
        city: "San Francisco",
      } as Location.LocationGeocodedAddress),
    ).toBe("Golden Gate Park, San Francisco");
  });

  it("omits street line when only streetNumber is usable", () => {
    expect(
      formatAddress({
        streetNumber: "1",
        street: " ",
        city: "San Francisco",
      } as Location.LocationGeocodedAddress),
    ).toBe("San Francisco");
  });
});

describe("createLocationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReverseGeocode.mockResolvedValue(defaultGeocodeResult);
  });

  it("returns coordinates when permission is already granted without calling request", async () => {
    mockGetPermissions.mockResolvedValue({
      granted: true,
      canAskAgain: true,
      expires: "never",
      status: PermissionStatus.GRANTED,
    });
    mockGetPosition.mockResolvedValue(mockPosition);

    const service = createLocationService();
    const result = await service.getCurrentCoordinates();

    expect(result).toEqual({
      ok: true,
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
      address: "1 Market St, San Francisco",
    });
    expect(mockRequestPermissions).not.toHaveBeenCalled();
    expect(mockGetPosition).toHaveBeenCalledWith({ accuracy: 3 });
    expect(mockReverseGeocode).toHaveBeenCalledWith({
      latitude: 37.7749,
      longitude: -122.4194,
    });
  });

  it("calls request when not granted and canAskAgain, returns coordinates when request grants", async () => {
    mockGetPermissions.mockResolvedValue({
      granted: false,
      canAskAgain: true,
      expires: "never",
      status: PermissionStatus.UNDETERMINED,
    });
    mockRequestPermissions.mockResolvedValue({
      granted: true,
      canAskAgain: true,
      expires: "never",
      status: PermissionStatus.GRANTED,
    });
    mockGetPosition.mockResolvedValue(mockPosition);

    const service = createLocationService();
    const result = await service.getCurrentCoordinates();

    expect(result).toEqual({
      ok: true,
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
      address: "1 Market St, San Francisco",
    });
    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    expect(mockGetPosition).toHaveBeenCalledTimes(1);
  });

  it("returns locationPermissionDenied when request denies permission", async () => {
    mockGetPermissions.mockResolvedValue({
      granted: false,
      canAskAgain: true,
      expires: "never",
      status: PermissionStatus.UNDETERMINED,
    });
    mockRequestPermissions.mockResolvedValue({
      granted: false,
      canAskAgain: false,
      expires: "never",
      status: PermissionStatus.DENIED,
    });

    const service = createLocationService();
    const result = await service.getCurrentCoordinates();

    expect(result).toEqual({
      ok: false,
      error: {
        type: "locationPermissionDenied",
        message: "Location permission is required to add weather context.",
        retryable: true,
      },
    });
    expect(mockGetPosition).not.toHaveBeenCalled();
    expect(mockReverseGeocode).not.toHaveBeenCalled();
  });

  it("returns locationPermissionDenied when cannot ask again without calling request", async () => {
    mockGetPermissions.mockResolvedValue({
      granted: false,
      canAskAgain: false,
      expires: "never",
      status: PermissionStatus.DENIED,
    });

    const service = createLocationService();
    const result = await service.getCurrentCoordinates();

    expect(result).toEqual({
      ok: false,
      error: {
        type: "locationPermissionDenied",
        message: "Location permission is required to add weather context.",
        retryable: true,
      },
    });
    expect(mockRequestPermissions).not.toHaveBeenCalled();
    expect(mockGetPosition).not.toHaveBeenCalled();
    expect(mockReverseGeocode).not.toHaveBeenCalled();
  });

  it("returns coordinates with null address when reverse geocode returns empty array", async () => {
    mockGetPermissions.mockResolvedValue({
      granted: true,
      canAskAgain: true,
      expires: "never",
      status: PermissionStatus.GRANTED,
    });
    mockGetPosition.mockResolvedValue(mockPosition);
    mockReverseGeocode.mockResolvedValue([]);

    const service = createLocationService();
    const result = await service.getCurrentCoordinates();

    expect(result).toEqual({
      ok: true,
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
      address: null,
    });
  });

  it("returns coordinates with null address when reverse geocode throws", async () => {
    mockGetPermissions.mockResolvedValue({
      granted: true,
      canAskAgain: true,
      expires: "never",
      status: PermissionStatus.GRANTED,
    });
    mockGetPosition.mockResolvedValue(mockPosition);
    mockReverseGeocode.mockRejectedValue(new Error("geocode failure"));

    const service = createLocationService();
    const result = await service.getCurrentCoordinates();

    expect(result).toEqual({
      ok: true,
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
      address: null,
    });
  });

  it("returns unknown when getCurrentPositionAsync throws", async () => {
    mockGetPermissions.mockResolvedValue({
      granted: true,
      canAskAgain: true,
      expires: "never",
      status: PermissionStatus.GRANTED,
    });
    mockGetPosition.mockRejectedValue(new Error("GPS failure"));

    const service = createLocationService();
    const result = await service.getCurrentCoordinates();

    expect(result).toEqual({
      ok: false,
      error: {
        type: "unknown",
        message: "Location is unavailable. Please try again.",
        retryable: true,
      },
    });
  });

  it("returns unknown when getForegroundPermissionsAsync throws", async () => {
    mockGetPermissions.mockRejectedValue(new Error("native failure"));

    const service = createLocationService();
    const result = await service.getCurrentCoordinates();

    expect(result).toEqual({
      ok: false,
      error: {
        type: "unknown",
        message: "Location is unavailable. Please try again.",
        retryable: true,
      },
    });
  });
});

describe("createFakeLocationService", () => {
  it("returns default coordinates result with default address", async () => {
    const fake = createFakeLocationService();
    const result = await fake.getCurrentCoordinates();

    expect(result).toEqual({
      ok: true,
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
      address: "1 Market St, San Francisco",
    });
    expect(fake.requestCount()).toBe(1);
  });

  it("preserves explicit null address", async () => {
    const fake = createFakeLocationService({
      ok: true,
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
      address: null,
    });
    const result = await fake.getCurrentCoordinates();

    expect(result).toEqual({
      ok: true,
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
      address: null,
    });
  });

  it("returns configured denied result", async () => {
    const denied = {
      ok: false as const,
      error: {
        type: "locationPermissionDenied" as const,
        message: "Location permission is required to add weather context.",
        retryable: true as const,
      },
    };
    const fake = createFakeLocationService(denied);
    const result = await fake.getCurrentCoordinates();

    expect(result).toEqual(denied);
    expect(fake.requestCount()).toBe(1);
  });

  it("increments requestCount on each call", async () => {
    const fake = createFakeLocationService();

    await fake.getCurrentCoordinates();
    await fake.getCurrentCoordinates();

    expect(fake.requestCount()).toBe(2);
  });
});
