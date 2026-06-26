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

const capturedState = (overrides: Partial<CaptureState> = {}): CaptureState => ({
  ...initialCaptureState,
  phase: "captured",
  photoUri: "file:///photo.jpg",
  capturedAt: "2026-06-26T10:00:00.000Z",
  ...overrides,
});

const enrichingState = (overrides: Partial<CaptureState> = {}): CaptureState => ({
  ...initialCaptureState,
  phase: "enriching",
  photoUri: "file:///photo.jpg",
  capturedAt: "2026-06-26T10:00:00.000Z",
  ...overrides,
});

const capturedWithEnrichmentError = (
  overrides: Partial<CaptureState> = {},
): CaptureState => ({
  ...initialCaptureState,
  phase: "captured",
  photoUri: "file:///photo.jpg",
  capturedAt: "2026-06-26T10:00:00.000Z",
  error: { type: "networkUnavailable", message: "No network.", retryable: true },
  ...overrides,
});

const fullReport = {
  photoUri: "file:///photo.jpg",
  capturedAt: "2026-06-26T10:00:00.000Z",
  location: { latitude: 37.7749, longitude: -122.4194 },
  weather: { temperatureCelsius: 18, condition: "Clear" },
  address: "1 Market St, San Francisco",
  isPartial: false,
};

const readyState = (overrides: Partial<CaptureState> = {}): CaptureState => ({
  ...initialCaptureState,
  phase: "ready",
  photoUri: fullReport.photoUri,
  capturedAt: fullReport.capturedAt,
  report: fullReport,
  ...overrides,
});

const sharingState = (overrides: Partial<CaptureState> = {}): CaptureState => ({
  ...readyState(),
  phase: "sharing",
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

describe("START_ENRICHMENT", () => {
  it("transitions captured with artifact to enriching and clears error", () => {
    const state = capturedState({
      error: {
        type: "networkUnavailable",
        message: "No network.",
        retryable: true,
      },
    });

    expect(captureReducer(state, { type: "START_ENRICHMENT" })).toEqual({
      ...state,
      phase: "enriching",
      error: null,
    });
  });

  it("returns unchanged state when photoUri is missing", () => {
    const state = capturedState({ photoUri: null });

    expect(captureReducer(state, { type: "START_ENRICHMENT" })).toBe(state);
  });

  it("returns unchanged state when capturedAt is missing", () => {
    const state = capturedState({ capturedAt: null });

    expect(captureReducer(state, { type: "START_ENRICHMENT" })).toBe(state);
  });

  it("returns unchanged state when not captured", () => {
    expect(
      captureReducer(initialCaptureState, { type: "START_ENRICHMENT" }),
    ).toBe(initialCaptureState);
  });
});

describe("ENRICHMENT_SUCCEEDED", () => {
  const location = { latitude: 37.7749, longitude: -122.4194 };
  const weather = { temperatureCelsius: 18, condition: "Clear" };
  const address = "1 Market St, San Francisco";

  it("transitions enriching to ready with a full report", () => {
    const state = enrichingState();

    expect(
      captureReducer(state, {
        type: "ENRICHMENT_SUCCEEDED",
        location,
        weather,
        address,
      }),
    ).toEqual({
      ...state,
      phase: "ready",
      report: {
        photoUri: state.photoUri,
        capturedAt: state.capturedAt,
        location,
        weather,
        address,
        isPartial: false,
      },
      error: null,
    });
  });

  it("returns unchanged state when photoUri is missing", () => {
    const state = enrichingState({ photoUri: null });

    expect(
      captureReducer(state, {
        type: "ENRICHMENT_SUCCEEDED",
        location,
        weather,
      }),
    ).toBe(state);
  });

  it("returns unchanged state when capturedAt is missing", () => {
    const state = enrichingState({ capturedAt: null });

    expect(
      captureReducer(state, {
        type: "ENRICHMENT_SUCCEEDED",
        location,
        weather,
      }),
    ).toBe(state);
  });

  it("returns unchanged state when not enriching", () => {
    expect(
      captureReducer(initialCaptureState, {
        type: "ENRICHMENT_SUCCEEDED",
        location,
        weather,
      }),
    ).toBe(initialCaptureState);
  });
});

describe("ENRICHMENT_FAILED", () => {
  it("returns to captured with networkUnavailable, preserving capture data", () => {
    const state = enrichingState();
    const error = {
      type: "networkUnavailable" as const,
      message: "No network.",
      retryable: true as const,
    };

    expect(captureReducer(state, { type: "ENRICHMENT_FAILED", error })).toEqual({
      ...state,
      phase: "captured",
      report: null,
      error,
    });
  });

  it("returns to captured with weatherFailed, preserving capture data", () => {
    const state = enrichingState();
    const error = {
      type: "weatherFailed" as const,
      message: "Weather API failed.",
      retryable: true as const,
    };

    expect(captureReducer(state, { type: "ENRICHMENT_FAILED", error })).toEqual({
      ...state,
      phase: "captured",
      report: null,
      error,
    });
  });

  it("returns to captured with locationPermissionDenied, preserving capture data", () => {
    const state = enrichingState();
    const error = {
      type: "locationPermissionDenied" as const,
      message: "Location permission is required.",
      retryable: true as const,
    };

    expect(captureReducer(state, { type: "ENRICHMENT_FAILED", error })).toEqual({
      ...state,
      phase: "captured",
      report: null,
      error,
    });
  });

  it("returns unchanged state when not enriching", () => {
    const action = {
      type: "ENRICHMENT_FAILED" as const,
      error: {
        type: "networkUnavailable" as const,
        message: "No network.",
        retryable: true as const,
      },
    };

    expect(captureReducer(initialCaptureState, action)).toBe(initialCaptureState);
  });
});

describe("CONTINUE_WITH_PARTIAL_REPORT", () => {
  it("builds a partial report for networkUnavailable enrichment failure", () => {
    const state = capturedWithEnrichmentError();

    expect(captureReducer(state, { type: "CONTINUE_WITH_PARTIAL_REPORT" })).toEqual({
      ...state,
      phase: "ready",
      report: {
        photoUri: state.photoUri,
        capturedAt: state.capturedAt,
        location: null,
        weather: null,
        address: null,
        isPartial: true,
        enrichmentUnavailableReason: "networkUnavailable",
      },
      error: null,
    });
  });

  it("builds a partial report for locationPermissionDenied enrichment failure", () => {
    const state = capturedWithEnrichmentError({
      error: {
        type: "locationPermissionDenied",
        message: "Location permission is required.",
        retryable: true,
      },
    });

    expect(captureReducer(state, { type: "CONTINUE_WITH_PARTIAL_REPORT" })).toEqual({
      ...state,
      phase: "ready",
      report: {
        photoUri: state.photoUri,
        capturedAt: state.capturedAt,
        location: null,
        weather: null,
        address: null,
        isPartial: true,
        enrichmentUnavailableReason: "locationPermissionDenied",
      },
      error: null,
    });
  });

  it("returns unchanged state when there is no enrichment error", () => {
    const state = capturedState();

    expect(
      captureReducer(state, { type: "CONTINUE_WITH_PARTIAL_REPORT" }),
    ).toBe(state);
  });

  it("returns unchanged state for a non-enrichment error", () => {
    const state = capturedState({
      error: {
        type: "unknown",
        message: "Something went wrong.",
        retryable: false,
      },
    });

    expect(
      captureReducer(state, { type: "CONTINUE_WITH_PARTIAL_REPORT" }),
    ).toBe(state);
  });

  it("returns unchanged state when capturedAt is missing", () => {
    const state = capturedWithEnrichmentError({ capturedAt: null });

    expect(
      captureReducer(state, { type: "CONTINUE_WITH_PARTIAL_REPORT" }),
    ).toBe(state);
  });
});

describe("START_SHARING", () => {
  it("transitions ready with report to sharing and clears error", () => {
    const state = readyState({
      error: {
        type: "shareFailed",
        message: "Share failed.",
        retryable: true,
      },
    });

    expect(captureReducer(state, { type: "START_SHARING" })).toEqual({
      ...state,
      phase: "sharing",
      error: null,
    });
  });

  it("returns unchanged state when report is missing", () => {
    const state = readyState({ report: null });

    expect(captureReducer(state, { type: "START_SHARING" })).toBe(state);
  });

  it("returns unchanged state when not ready", () => {
    expect(
      captureReducer(initialCaptureState, { type: "START_SHARING" }),
    ).toBe(initialCaptureState);
  });
});

describe("SHARE_SUCCEEDED", () => {
  it("transitions sharing to shared and preserves report", () => {
    const state = sharingState();

    expect(captureReducer(state, { type: "SHARE_SUCCEEDED" })).toEqual({
      ...state,
      phase: "shared",
      error: null,
    });
  });

  it("returns unchanged state when report is missing", () => {
    const state = sharingState({ report: null });

    expect(captureReducer(state, { type: "SHARE_SUCCEEDED" })).toBe(state);
  });

  it("returns unchanged state when not sharing", () => {
    const state = readyState();

    expect(captureReducer(state, { type: "SHARE_SUCCEEDED" })).toBe(state);
  });
});

describe("SHARE_FAILED", () => {
  it("returns to ready with error and preserves report", () => {
    const state = sharingState();
    const error = {
      type: "shareFailed" as const,
      message: "Share failed.",
      retryable: true as const,
    };

    expect(captureReducer(state, { type: "SHARE_FAILED", error })).toEqual({
      ...state,
      phase: "ready",
      error,
    });
  });

  it("returns unchanged state when report is missing", () => {
    const state = sharingState({ report: null });
    const action = {
      type: "SHARE_FAILED" as const,
      error: {
        type: "shareFailed" as const,
        message: "Share failed.",
        retryable: true as const,
      },
    };

    expect(captureReducer(state, action)).toBe(state);
  });

  it("returns unchanged state when not sharing", () => {
    const state = readyState();
    const action = {
      type: "SHARE_FAILED" as const,
      error: {
        type: "shareFailed" as const,
        message: "Share failed.",
        retryable: true as const,
      },
    };

    expect(captureReducer(state, action)).toBe(state);
  });
});

describe("DISMISS_ERROR", () => {
  it("clears error while preserving phase and data", () => {
    const state = readyState({
      error: {
        type: "shareFailed",
        message: "Share failed.",
        retryable: true,
      },
    });

    expect(captureReducer(state, { type: "DISMISS_ERROR" })).toEqual({
      ...state,
      error: null,
    });
  });

  it("returns unchanged state when error is already null", () => {
    const state = readyState();

    expect(captureReducer(state, { type: "DISMISS_ERROR" })).toBe(state);
  });
});

describe("RESET_WORKFLOW", () => {
  it("returns the shared initial state", () => {
    const state = sharingState();

    expect(captureReducer(state, { type: "RESET_WORKFLOW" })).toBe(
      initialCaptureState,
    );
  });
});

describe("illegal transitions", () => {
  it("ENRICHMENT_SUCCEEDED from idle returns same object", () => {
    const action = {
      type: "ENRICHMENT_SUCCEEDED" as const,
      location: { latitude: 37.7749, longitude: -122.4194 },
      weather: { temperatureCelsius: 18, condition: "Clear" },
      address: "1 Market St, San Francisco",
    };

    expect(captureReducer(initialCaptureState, action)).toBe(initialCaptureState);
  });

  it("SHARE_SUCCEEDED from ready returns same object", () => {
    const state = readyState();

    expect(captureReducer(state, { type: "SHARE_SUCCEEDED" })).toBe(state);
  });
});
