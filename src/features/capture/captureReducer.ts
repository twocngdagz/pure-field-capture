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

const assertNever = (value: never): never => {
  throw new Error(`Unhandled action: ${JSON.stringify(value)}`);
};

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
          address: action.address ?? null,
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
          address: null,
          isPartial: true,
          enrichmentUnavailableReason: state.error.type,
        },
        error: null,
      };

    case "START_SHARING":
      if (state.phase !== "ready" || state.report === null) return state;
      return { ...state, phase: "sharing", error: null };

    case "SHARE_SUCCEEDED":
      if (state.phase !== "sharing" || state.report === null) return state;
      return { ...state, phase: "shared", error: null };

    case "SHARE_FAILED":
      if (state.phase !== "sharing" || state.report === null) return state;
      return { ...state, phase: "ready", error: action.error };

    case "DISMISS_ERROR":
      if (state.error === null) return state;
      return { ...state, error: null };

    case "RESET_WORKFLOW":
      return initialCaptureState;

    // Exhaustive: every CaptureAction is handled above. A new unhandled
    // action type becomes a compile error here.
    default:
      return assertNever(action);
  }
}
