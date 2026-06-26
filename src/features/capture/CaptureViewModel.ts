import { useReducer } from "react";
import type { CameraService, TakePhoto } from "@/services/CameraService";
import type { LocationService } from "@/services/LocationService";
import type { ShareService } from "@/services/ShareService";
import type { WeatherService } from "@/services/WeatherService";
import { captureReducer, initialCaptureState } from "./captureReducer";
import type { AppError, CaptureState } from "./captureTypes";

export type CaptureViewModelDeps = {
  cameraService: CameraService;
  takePhoto: TakePhoto;
  locationService?: LocationService;
  weatherService?: WeatherService;
  shareService?: ShareService;
  now?: () => Date;
};

export type CaptureViewModel = {
  state: CaptureState;
  capture: () => Promise<void>;
  enrich: () => Promise<void>;
  retryEnrichment: () => Promise<void>;
  continueWithPartialReport: () => void;
  dismissError: () => void;
  reset: () => void;
  share: () => Promise<void>;
};

type CaptureFailureError = Extract<
  AppError,
  { type: "cameraPermissionDenied" | "unknown" }
>;

type EnrichmentFailureError = Extract<
  AppError,
  { type: "networkUnavailable" | "weatherFailed" | "locationPermissionDenied" }
>;

const enrichmentDepsMissingError = (): EnrichmentFailureError => ({
  type: "weatherFailed",
  message: "Location or weather data could not be loaded.",
  retryable: true,
});

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

const toEnrichmentError = (error: AppError): EnrichmentFailureError => {
  if (
    error.type === "networkUnavailable" ||
    error.type === "weatherFailed" ||
    error.type === "locationPermissionDenied"
  ) {
    return error;
  }

  return enrichmentDepsMissingError();
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

  const enrich = async () => {
    if (!deps.locationService || !deps.weatherService) {
      dispatch({ type: "START_ENRICHMENT" });
      dispatch({
        type: "ENRICHMENT_FAILED",
        error: enrichmentDepsMissingError(),
      });
      return;
    }

    dispatch({ type: "START_ENRICHMENT" });

    const location = await deps.locationService.getCurrentCoordinates();
    if (!location.ok) {
      dispatch({
        type: "ENRICHMENT_FAILED",
        error: toEnrichmentError(location.error),
      });
      return;
    }

    const weather = await deps.weatherService.getCurrentWeather(
      location.coordinates,
    );
    if (!weather.ok) {
      dispatch({
        type: "ENRICHMENT_FAILED",
        error: toEnrichmentError(weather.error),
      });
      return;
    }

    dispatch({
      type: "ENRICHMENT_SUCCEEDED",
      location: location.coordinates,
      weather: weather.weather,
    });
  };

  const share = async () => {
    const report = state.report;

    if (!deps.shareService || report === null) {
      dispatch({ type: "START_SHARING" });
      dispatch({
        type: "SHARE_FAILED",
        error: {
          type: "shareFailed",
          message: "Sharing failed. Please try again.",
          retryable: true,
        },
      });
      return;
    }

    dispatch({ type: "START_SHARING" });

    const result = await deps.shareService.share(report);
    if (result.ok) {
      dispatch({ type: "SHARE_SUCCEEDED" });
      return;
    }

    dispatch({ type: "SHARE_FAILED", error: result.error });
  };

  return {
    state,
    capture,
    enrich,
    retryEnrichment: enrich,
    continueWithPartialReport: () =>
      dispatch({ type: "CONTINUE_WITH_PARTIAL_REPORT" }),
    dismissError: () => dispatch({ type: "DISMISS_ERROR" }),
    reset: () => dispatch({ type: "RESET_WORKFLOW" }),
    share,
  };
}
