import { act, renderHook } from "@testing-library/react-native";
import type { AppError } from "../captureTypes";
import { initialCaptureState } from "../captureReducer";
import { useCaptureViewModel } from "../CaptureViewModel";
import type { CameraCaptureResult, TakePhoto } from "@/services/CameraService";
import { createFakeCameraService } from "@/services/FakeCameraService";

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

const createFakeTakePhoto = (result: CameraCaptureResult) => {
  let count = 0;

  const takePhoto: TakePhoto = async () => {
    count += 1;
    return result;
  };

  return { takePhoto, count: () => count };
};

describe("useCaptureViewModel", () => {
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
