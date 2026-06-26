export type CapturePhase =
  | "idle"
  | "capturing"
  | "captured"
  | "enriching"
  | "ready"
  | "sharing"
  | "shared"
  | "failed";

export type Coordinates = { latitude: number; longitude: number };

export type WeatherSummary = { temperatureCelsius: number; condition: string };

export type EnrichmentUnavailableReason =
  | "networkUnavailable"
  | "weatherFailed"
  | "locationPermissionDenied";

export type Report = {
  photoUri: string;
  capturedAt: string;
  location?: Coordinates | null;
  weather?: WeatherSummary | null;
  address?: string | null;
  isPartial: boolean;
  enrichmentUnavailableReason?: EnrichmentUnavailableReason;
  note?: string;
};

export type AppError =
  | { type: "networkUnavailable"; message: string; retryable: true }
  | { type: "weatherFailed"; message: string; retryable: true }
  | { type: "locationPermissionDenied"; message: string; retryable: true }
  | { type: "cameraPermissionDenied"; message: string; retryable: true }
  | { type: "shareFailed"; message: string; retryable: boolean }
  | { type: "unknown"; message: string; retryable: boolean };

export type CaptureState = {
  phase: CapturePhase;
  photoUri: string | null;
  capturedAt: string | null;
  report: Report | null;
  error: AppError | null;
};

export type CaptureAction =
  | { type: "START_CAPTURE" }
  | { type: "CAPTURE_SUCCEEDED"; photoUri: string; capturedAt: string }
  | {
      type: "CAPTURE_FAILED";
      error: Extract<AppError, { type: "cameraPermissionDenied" | "unknown" }>;
    }
  | { type: "START_ENRICHMENT" }
  | {
      type: "ENRICHMENT_SUCCEEDED";
      location: Coordinates;
      weather: WeatherSummary;
      address?: string | null;
    }
  | {
      type: "ENRICHMENT_FAILED";
      error: Extract<
        AppError,
        { type: "networkUnavailable" | "weatherFailed" | "locationPermissionDenied" }
      >;
    }
  | { type: "CONTINUE_WITH_PARTIAL_REPORT" }
  | { type: "START_SHARING" }
  | { type: "SHARE_SUCCEEDED" }
  | {
      type: "SHARE_FAILED";
      error: Extract<AppError, { type: "shareFailed" | "unknown" }>;
    }
  | { type: "DISMISS_ERROR" }
  | { type: "RESET_WORKFLOW" };
