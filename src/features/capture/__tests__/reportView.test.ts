import type { EnrichmentUnavailableReason, Report } from "../captureTypes";
import {
  ENRICHMENT_UNAVAILABLE_COPY,
  buildReportPreviewModel,
  type ReportPreviewModel,
} from "../reportView";

const fullReport: Report = {
  photoUri: "file:///photo.jpg",
  capturedAt: "2026-06-26T10:00:00.000Z",
  location: { latitude: 37.7749, longitude: -122.4194 },
  weather: { temperatureCelsius: 18, condition: "Clear" },
  isPartial: false,
};

const partialReport = (
  reason?: EnrichmentUnavailableReason,
): Report => ({
  photoUri: "file:///photo.jpg",
  capturedAt: "2026-06-26T10:00:00.000Z",
  location: null,
  weather: null,
  isPartial: true,
  enrichmentUnavailableReason: reason,
});

const rowValue = (
  model: ReportPreviewModel,
  sectionTitle: "Capture" | "Location" | "Weather",
  label: string,
): string => {
  const section = model.sections.find((s) => s.title === sectionTitle);
  const row = section?.rows.find((r) => r.label === label);
  return row?.value ?? "";
};

describe("buildReportPreviewModel", () => {
  it("maps a full report to sectioned preview rows", () => {
    const model = buildReportPreviewModel(fullReport);

    expect(model.title).toBe("Report Preview");
    expect(model.isPartial).toBe(false);
    expect(model.partialNotice).toBeNull();
    expect(model.sections.map((s) => s.title)).toEqual(["Capture", "Location", "Weather"]);
    expect(rowValue(model, "Capture", "Captured at")).toBe("Jun 26, 2026, 10:00 AM UTC");
    expect(rowValue(model, "Location", "Coordinates")).toBe("37.77490, -122.41940");
    expect(rowValue(model, "Weather", "Condition")).toBe("Clear");
    expect(rowValue(model, "Weather", "Temperature")).toBe("18°C");
  });

  it.each([
    "networkUnavailable",
    "weatherFailed",
    "locationPermissionDenied",
  ] as const)("maps partial report with %s reason", (reason) => {
    const model = buildReportPreviewModel(partialReport(reason));

    expect(model.title).toBe("Partial Report Preview");
    expect(model.isPartial).toBe(true);
    expect(model.partialNotice).toBe(ENRICHMENT_UNAVAILABLE_COPY[reason]);
    expect(rowValue(model, "Location", "Coordinates")).toBe("Unavailable");
    expect(rowValue(model, "Weather", "Condition")).toBe("Unavailable");
    expect(rowValue(model, "Weather", "Temperature")).toBe("Unavailable");
  });

  it("uses fallback partial notice when reason is missing", () => {
    const model = buildReportPreviewModel(partialReport());

    expect(model.partialNotice).toBe("Some enrichment data is unavailable");
  });

  it("shows Unavailable for empty capturedAt", () => {
    const model = buildReportPreviewModel({ ...fullReport, capturedAt: "" });

    expect(rowValue(model, "Capture", "Captured at")).toBe("Unavailable");
  });

  it("shows Unavailable for null location on a full report", () => {
    const model = buildReportPreviewModel({ ...fullReport, location: null });

    expect(rowValue(model, "Location", "Coordinates")).toBe("Unavailable");
  });

  it("shows Unavailable for null weather on a full report", () => {
    const model = buildReportPreviewModel({ ...fullReport, weather: null });

    expect(rowValue(model, "Weather", "Condition")).toBe("Unavailable");
    expect(rowValue(model, "Weather", "Temperature")).toBe("Unavailable");
  });

  it("shows Unavailable for non-finite coordinates", () => {
    const model = buildReportPreviewModel({
      ...fullReport,
      location: { latitude: NaN, longitude: -122.4194 },
    });

    expect(rowValue(model, "Location", "Coordinates")).toBe("Unavailable");
  });
});
