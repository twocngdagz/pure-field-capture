import { act, render, screen, userEvent } from "@testing-library/react-native";
import type { AppError } from "../captureTypes";
import { CaptureScreen } from "../CaptureScreen";
import type { TakePhoto } from "@/services/CameraService";
import { createFakeCameraService } from "@/services/FakeCameraService";
import { createFakeLocationService } from "@/services/FakeLocationService";
import { createFakeWeatherService } from "@/services/FakeWeatherService";
import type { WeatherResult, WeatherService } from "@/services/WeatherService";

jest.mock("expo-camera", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    CameraView: React.forwardRef(function MockCameraView(
      {
        children,
        onCameraReady,
        ...props
      }: {
        children?: React.ReactNode;
        onCameraReady?: () => void;
        [key: string]: unknown;
      },
      ref: React.Ref<{ takePictureAsync: jest.Mock }>,
    ) {
      React.useImperativeHandle(ref, () => ({
        takePictureAsync: jest.fn(),
      }));

      React.useEffect(() => {
        onCameraReady?.();
      }, [onCameraReady]);

      return (
        <View {...props}>
          {children}
        </View>
      );
    }),
  };
});

const fixedNow = () => new Date("2026-06-26T10:00:00.000Z");

const defaultWeather = {
  temperatureCelsius: 22.5,
  condition: "Clear",
};

const successfulTakePhoto = (photoUri = "file:///photo.jpg"): TakePhoto =>
  async () => ({ ok: true, photoUri });

const failedTakePhoto = (
  error: AppError = {
    type: "unknown",
    message: "Camera is unavailable. Please try again.",
    retryable: true,
  },
): TakePhoto => async () => ({ ok: false, error });

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

const createSequencedWeatherService = (
  results: WeatherResult[],
): WeatherService & { requestCount: () => number } => {
  let count = 0;

  return {
    getCurrentWeather: async () => {
      const result = results[Math.min(count, results.length - 1)];
      count += 1;
      return result;
    },
    requestCount: () => count,
  };
};

const defaultEnrichmentFakes = () => ({
  locationService: createFakeLocationService(),
  weatherService: createFakeWeatherService({
    ok: true,
    weather: defaultWeather,
  }),
});

describe("CaptureScreen camera", () => {
  it("shows permission denied fallback with retry when mount check fails", async () => {
    const cameraService = createFakeCameraService({
      ok: false,
      error: {
        type: "cameraPermissionDenied",
        message: "Camera permission is required to take a photo.",
        retryable: true,
      },
    });
    const { locationService, weatherService } = defaultEnrichmentFakes();

    render(
      <CaptureScreen
        cameraService={cameraService}
        takePhoto={successfulTakePhoto()}
        locationService={locationService}
        weatherService={weatherService}
        now={fixedNow}
      />,
    );

    expect(
      await screen.findByText("Camera permission is required to take a photo."),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Retry camera permission" }),
    ).toBeTruthy();
    expect(cameraService.requestCount()).toBe(1);
  });

  it("renders camera preview and capture control when permission is granted", async () => {
    const cameraService = createFakeCameraService();
    const { locationService, weatherService } = defaultEnrichmentFakes();

    render(
      <CaptureScreen
        cameraService={cameraService}
        takePhoto={successfulTakePhoto()}
        locationService={locationService}
        weatherService={weatherService}
        now={fixedNow}
      />,
    );

    expect(await screen.findByTestId("camera-preview")).toBeTruthy();
    const captureButton = await screen.findByRole("button", {
      name: "Capture photo",
    });
    expect(captureButton).toBeEnabled();
    expect(cameraService.requestCount()).toBe(1);
  });

  it("captures successfully and shows captured state with enrich and retake", async () => {
    const cameraService = createFakeCameraService();
    const user = userEvent.setup();
    const { locationService, weatherService } = defaultEnrichmentFakes();

    render(
      <CaptureScreen
        cameraService={cameraService}
        takePhoto={successfulTakePhoto()}
        locationService={locationService}
        weatherService={weatherService}
        now={fixedNow}
      />,
    );

    const captureButton = await screen.findByRole("button", {
      name: "Capture photo",
    });
    await user.press(captureButton);

    expect(await screen.findByText("Photo captured")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Enrich report" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retake photo" })).toBeTruthy();
    expect(cameraService.requestCount()).toBe(2);
  });

  it("shows inline error with retry and dismiss when takePhoto fails", async () => {
    const cameraService = createFakeCameraService();
    const user = userEvent.setup();
    const photoError: AppError = {
      type: "unknown",
      message: "Camera is unavailable. Please try again.",
      retryable: true,
    };
    const { locationService, weatherService } = defaultEnrichmentFakes();

    render(
      <CaptureScreen
        cameraService={cameraService}
        takePhoto={failedTakePhoto(photoError)}
        locationService={locationService}
        weatherService={weatherService}
        now={fixedNow}
      />,
    );

    const captureButton = await screen.findByRole("button", {
      name: "Capture photo",
    });
    await user.press(captureButton);

    expect(await screen.findByText(photoError.message)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry capture" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeTruthy();
    expect(cameraService.requestCount()).toBe(2);
  });

  it("disables capture until camera is ready", async () => {
    const { locationService, weatherService } = defaultEnrichmentFakes();

    render(
      <CaptureScreen
        cameraService={createFakeCameraService()}
        takePhoto={successfulTakePhoto()}
        locationService={locationService}
        weatherService={weatherService}
        now={fixedNow}
      />,
    );

    const captureButton = await screen.findByRole("button", {
      name: "Capture photo",
    });
    expect(captureButton).toBeEnabled();
  });
});

describe("CaptureScreen enrichment", () => {
  it("shows enriching status while weather fetch is pending", async () => {
    const user = userEvent.setup();
    const deferredWeather = createDeferred<WeatherResult>();
    const weatherService: WeatherService = {
      getCurrentWeather: jest.fn(() => deferredWeather.promise),
    };

    render(
      <CaptureScreen
        cameraService={createFakeCameraService()}
        takePhoto={successfulTakePhoto()}
        locationService={createFakeLocationService()}
        weatherService={weatherService}
        now={fixedNow}
      />,
    );

    await user.press(await screen.findByRole("button", { name: "Capture photo" }));
    await screen.findByText("Photo captured");

    await user.press(screen.getByRole("button", { name: "Enrich report" }));

    expect(await screen.findByText("Adding location and weather...")).toBeTruthy();

    await act(async () => {
      deferredWeather.resolve({
        ok: true,
        weather: defaultWeather,
      });
    });

    expect(await screen.findByTestId("report-preview-title")).toHaveTextContent(
      "Report Preview",
    );
  });

  it("enriches successfully and shows full report preview", async () => {
    const user = userEvent.setup();
    const { locationService, weatherService } = defaultEnrichmentFakes();

    render(
      <CaptureScreen
        cameraService={createFakeCameraService()}
        takePhoto={successfulTakePhoto()}
        locationService={locationService}
        weatherService={weatherService}
        now={fixedNow}
      />,
    );

    await user.press(await screen.findByRole("button", { name: "Capture photo" }));
    await user.press(await screen.findByRole("button", { name: "Enrich report" }));

    expect(await screen.findByTestId("report-preview-title")).toHaveTextContent(
      "Report Preview",
    );
    expect(screen.getByText("37.77490, -122.41940")).toBeTruthy();
    expect(screen.getByText("Clear")).toBeTruthy();
    expect(screen.getByText("22.5°C")).toBeTruthy();
  });

  it("shows retry and continue controls when enrichment fails with no network", async () => {
    const user = userEvent.setup();
    const weatherService = createFakeWeatherService({
      ok: false,
      error: {
        type: "networkUnavailable",
        message: "Network is unavailable. Please try again.",
        retryable: true,
      },
    });

    render(
      <CaptureScreen
        cameraService={createFakeCameraService()}
        takePhoto={successfulTakePhoto()}
        locationService={createFakeLocationService()}
        weatherService={weatherService}
        now={fixedNow}
      />,
    );

    await user.press(await screen.findByRole("button", { name: "Capture photo" }));
    await user.press(await screen.findByRole("button", { name: "Enrich report" }));

    expect(
      await screen.findByText("Network is unavailable. Please try again."),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry enrichment" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Continue with partial report" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retake photo" })).toBeTruthy();
  });

  it("continues with partial report after network failure", async () => {
    const user = userEvent.setup();
    const weatherService = createFakeWeatherService({
      ok: false,
      error: {
        type: "networkUnavailable",
        message: "Network is unavailable. Please try again.",
        retryable: true,
      },
    });

    render(
      <CaptureScreen
        cameraService={createFakeCameraService()}
        takePhoto={successfulTakePhoto()}
        locationService={createFakeLocationService()}
        weatherService={weatherService}
        now={fixedNow}
      />,
    );

    await user.press(await screen.findByRole("button", { name: "Capture photo" }));
    await user.press(await screen.findByRole("button", { name: "Enrich report" }));

    await user.press(
      await screen.findByRole("button", { name: "Continue with partial report" }),
    );

    expect(await screen.findByTestId("report-preview-title")).toHaveTextContent(
      "Partial Report Preview",
    );
    expect(screen.getByText("Network unavailable")).toBeTruthy();
    expect(screen.getAllByText("Unavailable").length).toBeGreaterThanOrEqual(2);
  });

  it("retry enrichment succeeds after initial network failure", async () => {
    const user = userEvent.setup();
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

    render(
      <CaptureScreen
        cameraService={createFakeCameraService()}
        takePhoto={successfulTakePhoto()}
        locationService={createFakeLocationService()}
        weatherService={weatherService}
        now={fixedNow}
      />,
    );

    await user.press(await screen.findByRole("button", { name: "Capture photo" }));
    await user.press(await screen.findByRole("button", { name: "Enrich report" }));

    expect(
      await screen.findByText("Network is unavailable. Please try again."),
    ).toBeTruthy();

    await user.press(screen.getByRole("button", { name: "Retry enrichment" }));

    expect(await screen.findByTestId("report-preview-title")).toHaveTextContent(
      "Report Preview",
    );
    expect(screen.getByText("37.77490, -122.41940")).toBeTruthy();
    expect(screen.getByText("Clear")).toBeTruthy();
    expect(screen.getByText("22.5°C")).toBeTruthy();
    expect(weatherService.requestCount()).toBe(2);
  });
});
