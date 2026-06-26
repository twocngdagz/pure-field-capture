import { PermissionStatus } from "expo";
import { Camera } from "expo-camera";
import { createCameraService } from "../CameraService";
import { createFakeCameraService } from "../FakeCameraService";

jest.mock("expo-camera", () => ({
  Camera: {
    getCameraPermissionsAsync: jest.fn(),
    requestCameraPermissionsAsync: jest.fn(),
  },
}));

const mockGet = jest.mocked(Camera.getCameraPermissionsAsync);
const mockRequest = jest.mocked(Camera.requestCameraPermissionsAsync);

describe("createCameraService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns ok when permission is already granted without calling request", async () => {
    mockGet.mockResolvedValue({
      granted: true,
      canAskAgain: true,
      expires: "never",
      status: PermissionStatus.GRANTED,
    });

    const service = createCameraService();
    const result = await service.requestPermission();

    expect(result).toEqual({ ok: true });
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("calls request when not granted and canAskAgain, returns ok when request grants", async () => {
    mockGet.mockResolvedValue({
      granted: false,
      canAskAgain: true,
      expires: "never",
      status: PermissionStatus.UNDETERMINED,
    });
    mockRequest.mockResolvedValue({
      granted: true,
      canAskAgain: true,
      expires: "never",
      status: PermissionStatus.GRANTED,
    });

    const service = createCameraService();
    const result = await service.requestPermission();

    expect(result).toEqual({ ok: true });
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it("returns cameraPermissionDenied when request denies permission", async () => {
    mockGet.mockResolvedValue({
      granted: false,
      canAskAgain: true,
      expires: "never",
      status: PermissionStatus.UNDETERMINED,
    });
    mockRequest.mockResolvedValue({
      granted: false,
      canAskAgain: false,
      expires: "never",
      status: PermissionStatus.DENIED,
    });

    const service = createCameraService();
    const result = await service.requestPermission();

    expect(result).toEqual({
      ok: false,
      error: {
        type: "cameraPermissionDenied",
        message: "Camera permission is required to take a photo.",
        retryable: true,
      },
    });
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it("returns cameraPermissionDenied when cannot ask again without calling request", async () => {
    mockGet.mockResolvedValue({
      granted: false,
      canAskAgain: false,
      expires: "never",
      status: PermissionStatus.DENIED,
    });

    const service = createCameraService();
    const result = await service.requestPermission();

    expect(result).toEqual({
      ok: false,
      error: {
        type: "cameraPermissionDenied",
        message: "Camera permission is required to take a photo.",
        retryable: true,
      },
    });
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("returns unknown when getCameraPermissionsAsync throws", async () => {
    mockGet.mockRejectedValue(new Error("native failure"));

    const service = createCameraService();
    const result = await service.requestPermission();

    expect(result).toEqual({
      ok: false,
      error: {
        type: "unknown",
        message: "Camera is unavailable. Please try again.",
        retryable: true,
      },
    });
  });

  it("returns unknown when requestCameraPermissionsAsync throws", async () => {
    mockGet.mockResolvedValue({
      granted: false,
      canAskAgain: true,
      expires: "never",
      status: PermissionStatus.UNDETERMINED,
    });
    mockRequest.mockRejectedValue(new Error("native failure"));

    const service = createCameraService();
    const result = await service.requestPermission();

    expect(result).toEqual({
      ok: false,
      error: {
        type: "unknown",
        message: "Camera is unavailable. Please try again.",
        retryable: true,
      },
    });
  });
});

describe("createFakeCameraService", () => {
  it("returns default granted result", async () => {
    const fake = createFakeCameraService();
    const result = await fake.requestPermission();

    expect(result).toEqual({ ok: true });
    expect(fake.requestCount()).toBe(1);
  });

  it("returns configured denied result", async () => {
    const denied = {
      ok: false as const,
      error: {
        type: "cameraPermissionDenied" as const,
        message: "Camera permission is required to take a photo.",
        retryable: true as const,
      },
    };
    const fake = createFakeCameraService(denied);
    const result = await fake.requestPermission();

    expect(result).toEqual(denied);
    expect(fake.requestCount()).toBe(1);
  });

  it("increments requestCount on each call", async () => {
    const fake = createFakeCameraService();

    await fake.requestPermission();
    await fake.requestPermission();

    expect(fake.requestCount()).toBe(2);
  });
});
