import { useReducer } from "react";
import type { CameraService, TakePhoto } from "@/services/CameraService";
import { captureReducer, initialCaptureState } from "./captureReducer";
import type { AppError, CaptureState } from "./captureTypes";

export type CaptureViewModelDeps = {
  cameraService: CameraService;
  takePhoto: TakePhoto;
  now?: () => Date;
};

export type CaptureViewModel = {
  state: CaptureState;
  capture: () => Promise<void>;
  dismissError: () => void;
  reset: () => void;
};

type CaptureFailureError = Extract<
  AppError,
  { type: "cameraPermissionDenied" | "unknown" }
>;

const asCaptureFailureError = (error: AppError): CaptureFailureError => {
  if (error.type === "cameraPermissionDenied" || error.type === "unknown") {
    return error;
  }

  return {
    type: "unknown",
    message: error.message,
    retryable: error.retryable,
  };
};

export function useCaptureViewModel(deps: CaptureViewModelDeps): CaptureViewModel {
  const [state, dispatch] = useReducer(captureReducer, initialCaptureState);
  const now = deps.now ?? (() => new Date());

  const capture = async () => {
    dispatch({ type: "START_CAPTURE" });

    const permission = await deps.cameraService.requestPermission();
    if (!permission.ok) {
      dispatch({
        type: "CAPTURE_FAILED",
        error: asCaptureFailureError(permission.error),
      });
      return;
    }

    const photo = await deps.takePhoto();
    if (!photo.ok) {
      dispatch({
        type: "CAPTURE_FAILED",
        error: asCaptureFailureError(photo.error),
      });
      return;
    }

    dispatch({
      type: "CAPTURE_SUCCEEDED",
      photoUri: photo.photoUri,
      capturedAt: now().toISOString(),
    });
  };

  return {
    state,
    capture,
    dismissError: () => dispatch({ type: "DISMISS_ERROR" }),
    reset: () => dispatch({ type: "RESET_WORKFLOW" }),
  };
}
