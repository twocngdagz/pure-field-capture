import type { Report } from "./captureTypes";

export const ENRICHMENT_UNAVAILABLE_COPY = {
  networkUnavailable: "Network unavailable",
  weatherFailed: "Weather unavailable",
  locationPermissionDenied: "Location permission denied",
} as const;

export type ReportPreviewRow = { label: string; value: string };

export type ReportPreviewSection = {
  title: "Capture" | "Location" | "Weather";
  rows: ReportPreviewRow[];
};

export type ReportPreviewModel = {
  title: string;
  isPartial: boolean;
  partialNotice: string | null;
  sections: ReportPreviewSection[];
};

const capturedAtFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const PARTIAL_NOTICE_FALLBACK = "Some enrichment data is unavailable";

function formatCapturedAt(capturedAt: string): string {
  if (!capturedAt) return "Unavailable";

  const date = new Date(capturedAt);
  if (Number.isNaN(date.getTime())) return "Unavailable";

  return `${capturedAtFormatter.format(date)} UTC`;
}

function formatCoordinates(location: Report["location"]): string {
  if (
    !location ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    return "Unavailable";
  }

  return `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`;
}

function formatCondition(weather: Report["weather"]): string {
  if (!weather?.condition) return "Unavailable";

  return weather.condition;
}

function formatTemperature(weather: Report["weather"]): string {
  if (!weather || !Number.isFinite(weather.temperatureCelsius)) {
    return "Unavailable";
  }

  return `${weather.temperatureCelsius}°C`;
}

function getPartialNotice(report: Report): string | null {
  if (!report.isPartial) return null;

  if (report.enrichmentUnavailableReason) {
    return ENRICHMENT_UNAVAILABLE_COPY[report.enrichmentUnavailableReason];
  }

  return PARTIAL_NOTICE_FALLBACK;
}

export function buildReportPreviewModel(report: Report): ReportPreviewModel {
  return {
    title: report.isPartial ? "Partial Report Preview" : "Report Preview",
    isPartial: report.isPartial,
    partialNotice: getPartialNotice(report),
    sections: [
      {
        title: "Capture",
        rows: [{ label: "Captured at", value: formatCapturedAt(report.capturedAt) }],
      },
      {
        title: "Location",
        rows: [
          { label: "Address", value: report.address ?? "Unavailable" },
          { label: "Coordinates", value: formatCoordinates(report.location) },
        ],
      },
      {
        title: "Weather",
        rows: [
          { label: "Condition", value: formatCondition(report.weather) },
          { label: "Temperature", value: formatTemperature(report.weather) },
        ],
      },
    ],
  };
}
