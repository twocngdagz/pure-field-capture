import type { AppError, CaptureAction, CaptureState } from "./captureTypes";

export const initialCaptureState: CaptureState = {
  phase: "idle",
  photoUri: null,
  capturedAt: null,
  report: null,
  error: null,
};

const isEnrichmentError = (
  error: AppError | null,
): error is Extract<
  AppError,
  { type: "networkUnavailable" | "weatherFailed" | "locationPermissionDenied" }
> =>
  error?.type === "networkUnavailable" ||
  error?.type === "weatherFailed" ||
  error?.type === "locationPermissionDenied";

export function captureReducer(
  state: CaptureState,
  action: CaptureAction,
): CaptureState {
  switch (action.type) {
    case "START_CAPTURE":
      if (state.phase !== "idle" && state.phase !== "failed") return state;
      return { ...initialCaptureState, phase: "capturing" };

    case "CAPTURE_SUCCEEDED":
      if (state.phase !== "capturing") return state;
      return {
        ...state,
        phase: "captured",
        photoUri: action.photoUri,
        capturedAt: action.capturedAt,
        error: null,
      };

    case "CAPTURE_FAILED":
      if (state.phase !== "capturing") return state;
      return {
        ...state,
        phase: "failed",
        photoUri: null,
        capturedAt: null,
        report: null,
        error: action.error,
      };

    case "START_ENRICHMENT":
      if (
        state.phase !== "captured" ||
        state.photoUri === null ||
        state.capturedAt === null
      ) {
        return state;
      }
      return { ...state, phase: "enriching", error: null };

    case "ENRICHMENT_SUCCEEDED":
      if (
        state.phase !== "enriching" ||
        state.photoUri === null ||
        state.capturedAt === null
      ) {
        return state;
      }
      return {
        ...state,
        phase: "ready",
        report: {
          photoUri: state.photoUri,
          capturedAt: state.capturedAt,
          location: action.location,
          weather: action.weather,
          isPartial: false,
        },
        error: null,
      };

    case "ENRICHMENT_FAILED":
      if (
        state.phase !== "enriching" ||
        state.photoUri === null ||
        state.capturedAt === null
      ) {
        return state;
      }
      return { ...state, phase: "captured", report: null, error: action.error };

    case "CONTINUE_WITH_PARTIAL_REPORT":
      if (
        state.phase !== "captured" ||
        state.photoUri === null ||
        state.capturedAt === null ||
        !isEnrichmentError(state.error)
      ) {
        return state;
      }
      return {
        ...state,
        phase: "ready",
        report: {
          photoUri: state.photoUri,
          capturedAt: state.capturedAt,
          location: null,
          weather: null,
          isPartial: true,
          enrichmentUnavailableReason: state.error.type,
        },
        error: null,
      };

    // Temporary permissive default: unimplemented known actions no-op.
    // Replaced with exhaustive assertNever(action) in M3.5.
    default:
      return state;
  }
}
