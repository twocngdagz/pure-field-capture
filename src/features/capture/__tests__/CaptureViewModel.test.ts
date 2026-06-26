import { act, renderHook } from "@testing-library/react-native";
import type { AppError } from "../captureTypes";
import { initialCaptureState } from "../captureReducer";
import { useCaptureViewModel } from "../CaptureViewModel";
import type { CameraCaptureResult, TakePhoto } from "@/services/CameraService";
import { createFakeCameraService } from "@/services/FakeCameraService";
import { createFakeLocationService } from "@/services/FakeLocationService";
import { createFakeWeatherService } from "@/services/FakeWeatherService";
import { createFakeShareService } from "@/services/FakeShareService";
import type { LocationResult, LocationService } from "@/services/LocationService";
import type { WeatherResult, WeatherService } from "@/services/WeatherService";
import type { Coordinates } from "../captureTypes";

const fixedNow = () => new Date("2026-06-26T10:00:00.000Z");

const defaultCoordinates: Coordinates = { latitude: 37.7749, longitude: -122.4194 };

const successfulTakePhoto = (photoUri = "file:///photo.jpg"): TakePhoto =>
  async () => ({ ok: true, photoUri });

const failedTakePhoto = (
  error: AppError = {
    type: "unknown",
    message: "Camera is unavailable. Please try again.",
    retryable: true,
  },
): TakePhoto => async () => ({ ok: false, error });

const createFakeTakePhoto = (result: CameraCaptureResult) => {
  let count = 0;

  const takePhoto: TakePhoto = async () => {
    count += 1;
    return result;
  };

  return { takePhoto, count: () => count };
};

const createSequencedLocationService = (
  results: LocationResult[],
): LocationService & { requestCount: () => number } => {
  let count = 0;

  return {
    getCurrentCoordinates: async () => {
      const result = results[Math.min(count, results.length - 1)];
      count += 1;
      return result;
    },
    requestCount: () => count,
  };
};

const createSequencedWeatherService = (
  results: WeatherResult[],
): WeatherService & {
  requestCount: () => number;
  lastCoordinates: () => Coordinates | null;
} => {
  let count = 0;
  let lastCoords: Coordinates | null = null;

  return {
    getCurrentWeather: async (coordinates) => {
      const result = results[Math.min(count, results.length - 1)];
      count += 1;
      lastCoords = coordinates;
      return result;
    },
    requestCount: () => count,
    lastCoordinates: () => lastCoords,
  };
};

describe("useCaptureViewModel capture", () => {
  it("captures successfully when permission and takePhoto succeed", async () => {
    const cameraService = createFakeCameraService();
    const { takePhoto, count: takePhotoCount } = createFakeTakePhoto({
      ok: true,
      photoUri: "file:///photo.jpg",
    });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService,
        takePhoto,
        now: fixedNow,
      }),
    );

    await act(async () => {
      await result.current.capture();
    });

    expect(result.current.state).toEqual({
      phase: "captured",
      photoUri: "file:///photo.jpg",
      capturedAt: "2026-06-26T10:00:00.000Z",
      report: null,
      error: null,
    });
    expect(cameraService.requestCount()).toBe(1);
    expect(takePhotoCount()).toBe(1);
  });

  it("fails when permission is denied and does not call takePhoto", async () => {
    const cameraService = createFakeCameraService({
      ok: false,
      error: {
        type: "cameraPermissionDenied",
        message: "Camera permission is required to take a photo.",
        retryable: true,
      },
    });
    const { takePhoto, count: takePhotoCount } = createFakeTakePhoto({
      ok: true,
      photoUri: "file:///photo.jpg",
    });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService,
        takePhoto,
        now: fixedNow,
      }),
    );

    await act(async () => {
      await result.current.capture();
    });

    expect(result.current.state.phase).toBe("failed");
    expect(result.current.state.error?.type).toBe("cameraPermissionDenied");
    expect(cameraService.requestCount()).toBe(1);
    expect(takePhotoCount()).toBe(0);
  });

  it("fails when permission returns unknown and does not call takePhoto", async () => {
    const cameraService = createFakeCameraService({
      ok: false,
      error: {
        type: "unknown",
        message: "Camera is unavailable. Please try again.",
        retryable: true,
      },
    });
    const { takePhoto, count: takePhotoCount } = createFakeTakePhoto({
      ok: true,
      photoUri: "file:///photo.jpg",
    });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService,
        takePhoto,
        now: fixedNow,
      }),
    );

    await act(async () => {
      await result.current.capture();
    });

    expect(result.current.state.phase).toBe("failed");
    expect(result.current.state.error?.type).toBe("unknown");
    expect(cameraService.requestCount()).toBe(1);
    expect(takePhotoCount()).toBe(0);
  });

  it("fails when takePhoto fails after permission succeeds", async () => {
    const cameraService = createFakeCameraService();
    const photoError: AppError = {
      type: "unknown",
      message: "Camera is unavailable. Please try again.",
      retryable: true,
    };
    const { takePhoto, count: takePhotoCount } = createFakeTakePhoto({
      ok: false,
      error: photoError,
    });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService,
        takePhoto,
        now: fixedNow,
      }),
    );

    await act(async () => {
      await result.current.capture();
    });

    expect(result.current.state.phase).toBe("failed");
    expect(result.current.state.error).toEqual(photoError);
    expect(cameraService.requestCount()).toBe(1);
    expect(takePhotoCount()).toBe(1);
  });

  it("dismissError clears error while preserving phase", async () => {
    const cameraService = createFakeCameraService({
      ok: false,
      error: {
        type: "cameraPermissionDenied",
        message: "Camera permission is required to take a photo.",
        retryable: true,
      },
    });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService,
        takePhoto: successfulTakePhoto(),
        now: fixedNow,
      }),
    );

    await act(async () => {
      await result.current.capture();
    });

    expect(result.current.state.phase).toBe("failed");
    expect(result.current.state.error).not.toBeNull();

    act(() => {
      result.current.dismissError();
    });

    expect(result.current.state.phase).toBe("failed");
    expect(result.current.state.error).toBeNull();
  });

  it("reset returns to initialCaptureState", async () => {
    const cameraService = createFakeCameraService();
    const { takePhoto } = createFakeTakePhoto({
      ok: true,
      photoUri: "file:///photo.jpg",
    });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService,
        takePhoto,
        now: fixedNow,
      }),
    );

    await act(async () => {
      await result.current.capture();
    });

    expect(result.current.state.phase).toBe("captured");

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toEqual(initialCaptureState);
  });
});

describe("useCaptureViewModel enrichment", () => {
  const defaultWeather = {
    temperatureCelsius: 22.5,
    condition: "Clear",
  };

  it("enriches successfully after capture with sequential location then weather", async () => {
    const locationService = createFakeLocationService({
      ok: true,
      coordinates: defaultCoordinates,
    });
    const weatherService = createFakeWeatherService({
      ok: true,
      weather: defaultWeather,
    });
    const { takePhoto } = createFakeTakePhoto({
      ok: true,
      photoUri: "file:///photo.jpg",
    });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService: createFakeCameraService(),
        takePhoto,
        locationService,
        weatherService,
        now: fixedNow,
      }),
    );

    await act(async () => {
      await result.current.capture();
    });

    await act(async () => {
      await result.current.enrich();
    });

    expect(result.current.state.phase).toBe("ready");
    expect(result.current.state.report).toEqual({
      photoUri: "file:///photo.jpg",
      capturedAt: "2026-06-26T10:00:00.000Z",
      location: defaultCoordinates,
      weather: defaultWeather,
      isPartial: false,
    });
    expect(weatherService.lastCoordinates()).toEqual(defaultCoordinates);
    expect(locationService.requestCount()).toBe(1);
    expect(weatherService.requestCount()).toBe(1);
  });

  it("fails enrichment when location permission is denied and does not call weather", async () => {
    const locationService = createFakeLocationService({
      ok: false,
      error: {
        type: "locationPermissionDenied",
        message: "Location permission is required to add weather context.",
        retryable: true,
      },
    });
    const weatherService = createFakeWeatherService();
    const { takePhoto } = createFakeTakePhoto({
      ok: true,
      photoUri: "file:///photo.jpg",
    });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService: createFakeCameraService(),
        takePhoto,
        locationService,
        weatherService,
        now: fixedNow,
      }),
    );

    await act(async () => {
      await result.current.capture();
    });

    await act(async () => {
      await result.current.enrich();
    });

    expect(result.current.state.phase).toBe("captured");
    expect(result.current.state.error?.type).toBe("locationPermissionDenied");
    expect(result.current.state.photoUri).toBe("file:///photo.jpg");
    expect(weatherService.requestCount()).toBe(0);
  });

  it("coerces location unknown to weatherFailed for enrichment failure", async () => {
    const locationService = createFakeLocationService({
      ok: false,
      error: {
        type: "unknown",
        message: "Location is unavailable. Please try again.",
        retryable: true,
      },
    });
    const weatherService = createFakeWeatherService();
    const { takePhoto } = createFakeTakePhoto({
      ok: true,
      photoUri: "file:///photo.jpg",
    });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService: createFakeCameraService(),
        takePhoto,
        locationService,
        weatherService,
        now: fixedNow,
      }),
    );

    await act(async () => {
      await result.current.capture();
    });

    await act(async () => {
      await result.current.enrich();
    });

    expect(result.current.state.phase).toBe("captured");
    expect(result.current.state.error).toEqual({
      type: "weatherFailed",
      message: "Location or weather data could not be loaded.",
      retryable: true,
    });
    expect(result.current.state.photoUri).toBe("file:///photo.jpg");
    expect(weatherService.requestCount()).toBe(0);
  });

  it("fails enrichment with networkUnavailable when weather fetch has no network", async () => {
    const locationService = createFakeLocationService();
    const weatherService = createFakeWeatherService({
      ok: false,
      error: {
        type: "networkUnavailable",
        message: "Network is unavailable. Please try again.",
        retryable: true,
      },
    });
    const { takePhoto } = createFakeTakePhoto({
      ok: true,
      photoUri: "file:///photo.jpg",
    });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService: createFakeCameraService(),
        takePhoto,
        locationService,
        weatherService,
        now: fixedNow,
      }),
    );

    await act(async () => {
      await result.current.capture();
    });

    await act(async () => {
      await result.current.enrich();
    });

    expect(result.current.state.phase).toBe("captured");
    expect(result.current.state.error?.type).toBe("networkUnavailable");
    expect(result.current.state.photoUri).toBe("file:///photo.jpg");
  });

  it("fails enrichment with weatherFailed when weather API fails", async () => {
    const locationService = createFakeLocationService();
    const weatherService = createFakeWeatherService({
      ok: false,
      error: {
        type: "weatherFailed",
        message: "Weather data could not be loaded.",
        retryable: true,
      },
    });
    const { takePhoto } = createFakeTakePhoto({
      ok: true,
      photoUri: "file:///photo.jpg",
    });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService: createFakeCameraService(),
        takePhoto,
        locationService,
        weatherService,
        now: fixedNow,
      }),
    );

    await act(async () => {
      await result.current.capture();
    });

    await act(async () => {
      await result.current.enrich();
    });

    expect(result.current.state.phase).toBe("captured");
    expect(result.current.state.error?.type).toBe("weatherFailed");
    expect(result.current.state.photoUri).toBe("file:///photo.jpg");
  });

  it("retryEnrichment succeeds after initial network failure", async () => {
    const locationService = createSequencedLocationService([
      { ok: true, coordinates: defaultCoordinates },
      { ok: true, coordinates: defaultCoordinates },
    ]);
    const weatherService = createSequencedWeatherService([
      {
        ok: false,
        error: {
          type: "networkUnavailable",
          message: "Network is unavailable. Please try again.",
          retryable: true,
        },
      },
      { ok: true, weather: defaultWeather },
    ]);
    const { takePhoto } = createFakeTakePhoto({
      ok: true,
      photoUri: "file:///photo.jpg",
    });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService: createFakeCameraService(),
        takePhoto,
        locationService,
        weatherService,
        now: fixedNow,
      }),
    );

    await act(async () => {
      await result.current.capture();
    });

    await act(async () => {
      await result.current.enrich();
    });

    expect(result.current.state.phase).toBe("captured");
    expect(result.current.state.error?.type).toBe("networkUnavailable");

    await act(async () => {
      await result.current.retryEnrichment();
    });

    expect(result.current.state.phase).toBe("ready");
    expect(result.current.state.report?.isPartial).toBe(false);
    expect(locationService.requestCount()).toBe(2);
    expect(weatherService.requestCount()).toBe(2);
  });

  it("continueWithPartialReport creates partial report after enrichment failure", async () => {
    const locationService = createFakeLocationService();
    const weatherService = createFakeWeatherService({
      ok: false,
      error: {
        type: "networkUnavailable",
        message: "Network is unavailable. Please try again.",
        retryable: true,
      },
    });
    const { takePhoto } = createFakeTakePhoto({
      ok: true,
      photoUri: "file:///photo.jpg",
    });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService: createFakeCameraService(),
        takePhoto,
        locationService,
        weatherService,
        now: fixedNow,
      }),
    );

    await act(async () => {
      await result.current.capture();
    });

    await act(async () => {
      await result.current.enrich();
    });

    act(() => {
      result.current.continueWithPartialReport();
    });

    expect(result.current.state.phase).toBe("ready");
    expect(result.current.state.report).toEqual({
      photoUri: "file:///photo.jpg",
      capturedAt: "2026-06-26T10:00:00.000Z",
      location: null,
      weather: null,
      isPartial: true,
      enrichmentUnavailableReason: "networkUnavailable",
    });
    expect(result.current.state.error).toBeNull();
  });

  it("fails enrichment when location and weather services are not provided", async () => {
    const { takePhoto } = createFakeTakePhoto({
      ok: true,
      photoUri: "file:///photo.jpg",
    });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService: createFakeCameraService(),
        takePhoto,
        now: fixedNow,
      }),
    );

    await act(async () => {
      await result.current.capture();
    });

    await act(async () => {
      await result.current.enrich();
    });

    expect(result.current.state.phase).toBe("captured");
    expect(result.current.state.error).toEqual({
      type: "weatherFailed",
      message: "Location or weather data could not be loaded.",
      retryable: true,
    });
    expect(result.current.state.photoUri).toBe("file:///photo.jpg");
  });
});

describe("useCaptureViewModel share", () => {
  const defaultWeather = {
    temperatureCelsius: 22.5,
    condition: "Clear",
  };

  const readyReport = {
    photoUri: "file:///photo.jpg",
    capturedAt: "2026-06-26T10:00:00.000Z",
    location: defaultCoordinates,
    weather: defaultWeather,
    isPartial: false,
  };

  const reachReady = async (
    result: { current: ReturnType<typeof useCaptureViewModel> },
  ) => {
    await act(async () => {
      await result.current.capture();
    });

    await act(async () => {
      await result.current.enrich();
    });
  };

  it("shares successfully from ready and transitions to shared", async () => {
    const shareService = createFakeShareService({ ok: true });
    const locationService = createFakeLocationService({
      ok: true,
      coordinates: defaultCoordinates,
    });
    const weatherService = createFakeWeatherService({
      ok: true,
      weather: defaultWeather,
    });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService: createFakeCameraService(),
        takePhoto: successfulTakePhoto(),
        locationService,
        weatherService,
        shareService,
        now: fixedNow,
      }),
    );

    await reachReady(result);

    expect(result.current.state.phase).toBe("ready");
    expect(result.current.state.report).toEqual(readyReport);

    await act(async () => {
      await result.current.share();
    });

    expect(result.current.state.phase).toBe("shared");
    expect(result.current.state.error).toBeNull();
    expect(shareService.shareCount()).toBe(1);
    expect(shareService.lastReport()).toEqual(readyReport);
  });

  it("returns to ready with shareFailed when share service fails", async () => {
    const shareFailedError: AppError = {
      type: "shareFailed",
      message: "Sharing failed. Please try again.",
      retryable: true,
    };
    const shareService = createFakeShareService({
      ok: false,
      error: shareFailedError,
    });
    const locationService = createFakeLocationService({
      ok: true,
      coordinates: defaultCoordinates,
    });
    const weatherService = createFakeWeatherService({
      ok: true,
      weather: defaultWeather,
    });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService: createFakeCameraService(),
        takePhoto: successfulTakePhoto(),
        locationService,
        weatherService,
        shareService,
        now: fixedNow,
      }),
    );

    await reachReady(result);

    await act(async () => {
      await result.current.share();
    });

    expect(result.current.state.phase).toBe("ready");
    expect(result.current.state.error).toEqual(shareFailedError);
    expect(result.current.state.report).toEqual(readyReport);
  });

  it("does not call share service when not in ready phase", async () => {
    const shareService = createFakeShareService({ ok: true });

    const { result } = renderHook(() =>
      useCaptureViewModel({
        cameraService: createFakeCameraService(),
        takePhoto: successfulTakePhoto(),
        shareService,
        now: fixedNow,
      }),
    );

    await act(async () => {
      await result.current.share();
    });

    expect(result.current.state.phase).toBe("idle");
    expect(shareService.shareCount()).toBe(0);
  });
});
