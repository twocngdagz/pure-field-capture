import { render, screen, userEvent } from "@testing-library/react-native";
import type { AppError } from "../captureTypes";
import { CaptureScreen } from "../CaptureScreen";
import type { TakePhoto } from "@/services/CameraService";
import { createFakeCameraService } from "@/services/FakeCameraService";

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

const successfulTakePhoto = (photoUri = "file:///photo.jpg"): TakePhoto =>
  async () => ({ ok: true, photoUri });

const failedTakePhoto = (
  error: AppError = {
    type: "unknown",
    message: "Camera is unavailable. Please try again.",
    retryable: true,
  },
): TakePhoto => async () => ({ ok: false, error });

describe("CaptureScreen", () => {
  it("shows permission denied fallback with retry when mount check fails", async () => {
    const cameraService = createFakeCameraService({
      ok: false,
      error: {
        type: "cameraPermissionDenied",
        message: "Camera permission is required to take a photo.",
        retryable: true,
      },
    });

    render(
      <CaptureScreen
        cameraService={cameraService}
        takePhoto={successfulTakePhoto()}
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

    render(
      <CaptureScreen
        cameraService={cameraService}
        takePhoto={successfulTakePhoto()}
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

  it("captures successfully and shows captured state with retake", async () => {
    const cameraService = createFakeCameraService();
    const user = userEvent.setup();

    render(
      <CaptureScreen
        cameraService={cameraService}
        takePhoto={successfulTakePhoto()}
        now={fixedNow}
      />,
    );

    const captureButton = await screen.findByRole("button", {
      name: "Capture photo",
    });
    await user.press(captureButton);

    expect(await screen.findByText("Photo captured")).toBeTruthy();
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

    render(
      <CaptureScreen
        cameraService={cameraService}
        takePhoto={failedTakePhoto(photoError)}
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
    render(
      <CaptureScreen
        cameraService={createFakeCameraService()}
        takePhoto={successfulTakePhoto()}
        now={fixedNow}
      />,
    );

    const captureButton = await screen.findByRole("button", {
      name: "Capture photo",
    });
    expect(captureButton).toBeEnabled();
  });
});
