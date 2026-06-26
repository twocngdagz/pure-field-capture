import { PermissionStatus } from "expo";
import * as Location from "expo-location";
import { createLocationService } from "../LocationService";
import { createFakeLocationService } from "../FakeLocationService";

jest.mock("expo-location", () => ({
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    Balanced: 3,
  },
}));

const mockGetPermissions = jest.mocked(Location.getForegroundPermissionsAsync);
const mockRequestPermissions = jest.mocked(Location.requestForegroundPermissionsAsync);
const mockGetPosition = jest.mocked(Location.getCurrentPositionAsync);

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

describe("createLocationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    });
    expect(mockRequestPermissions).not.toHaveBeenCalled();
    expect(mockGetPosition).toHaveBeenCalledWith({ accuracy: 3 });
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
  it("returns default coordinates result", async () => {
    const fake = createFakeLocationService();
    const result = await fake.getCurrentCoordinates();

    expect(result).toEqual({
      ok: true,
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
    });
    expect(fake.requestCount()).toBe(1);
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
