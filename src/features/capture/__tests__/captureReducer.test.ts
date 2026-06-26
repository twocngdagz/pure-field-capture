import { captureReducer, initialCaptureState } from "../captureReducer";
import type { CaptureState } from "../captureTypes";

const capturingState = (overrides: Partial<CaptureState> = {}): CaptureState => ({
  ...initialCaptureState,
  phase: "capturing",
  ...overrides,
});

const failedState = (overrides: Partial<CaptureState> = {}): CaptureState => ({
  ...initialCaptureState,
  phase: "failed",
  error: {
    type: "cameraPermissionDenied",
    message: "Camera permission is required.",
    retryable: true,
  },
  ...overrides,
});

describe("initialCaptureState", () => {
  it("is idle with all fields null", () => {
    expect(initialCaptureState).toEqual({
      phase: "idle",
      photoUri: null,
      capturedAt: null,
      report: null,
      error: null,
    });
  });
});

describe("START_CAPTURE", () => {
  it("transitions idle to capturing", () => {
    expect(captureReducer(initialCaptureState, { type: "START_CAPTURE" })).toEqual({
      phase: "capturing",
      photoUri: null,
      capturedAt: null,
      report: null,
      error: null,
    });
  });

  it("transitions failed to capturing and resets workflow shell", () => {
    const state = failedState({
      photoUri: "file:///stale.jpg",
      capturedAt: "2026-06-26T09:00:00.000Z",
      report: null,
    });

    expect(captureReducer(state, { type: "START_CAPTURE" })).toEqual({
      phase: "capturing",
      photoUri: null,
      capturedAt: null,
      report: null,
      error: null,
    });
  });
});

describe("CAPTURE_SUCCEEDED", () => {
  it("transitions capturing to captured and stores photoUri and capturedAt", () => {
    const state = capturingState();
    const photoUri = "file:///photo.jpg";
    const capturedAt = "2026-06-26T10:00:00.000Z";

    expect(
      captureReducer(state, {
        type: "CAPTURE_SUCCEEDED",
        photoUri,
        capturedAt,
      }),
    ).toEqual({
      ...state,
      phase: "captured",
      photoUri,
      capturedAt,
      error: null,
    });
  });

  it("returns unchanged state when not capturing", () => {
    expect(
      captureReducer(initialCaptureState, {
        type: "CAPTURE_SUCCEEDED",
        photoUri: "file:///photo.jpg",
        capturedAt: "2026-06-26T10:00:00.000Z",
      }),
    ).toBe(initialCaptureState);
  });
});

describe("CAPTURE_FAILED", () => {
  it("transitions capturing to failed, stores error, and clears photo fields and report", () => {
    const state = capturingState();
    const error = {
      type: "cameraPermissionDenied" as const,
      message: "Camera permission is required.",
      retryable: true as const,
    };

    expect(captureReducer(state, { type: "CAPTURE_FAILED", error })).toEqual({
      phase: "failed",
      photoUri: null,
      capturedAt: null,
      report: null,
      error,
    });
  });

  it("returns unchanged state when not capturing", () => {
    const action = {
      type: "CAPTURE_FAILED" as const,
      error: {
        type: "unknown" as const,
        message: "Capture failed.",
        retryable: false,
      },
    };

    expect(captureReducer(initialCaptureState, action)).toBe(initialCaptureState);
  });
});
