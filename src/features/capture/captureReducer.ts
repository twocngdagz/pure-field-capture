import type { CaptureAction, CaptureState } from "./captureTypes";

export const initialCaptureState: CaptureState = {
  phase: "idle",
  photoUri: null,
  capturedAt: null,
  report: null,
  error: null,
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

    // Temporary permissive default: unimplemented known actions no-op.
    // Replaced with exhaustive assertNever(action) in M3.5.
    default:
      return state;
  }
}
