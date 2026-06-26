import type { Report } from "../captureTypes";
import { buildReportPdfHtml } from "../reportPdf";

const photoDataUri = "data:image/jpeg;base64,TEST_IMAGE";

const fullReport: Report = {
  photoUri: "file:///photo.jpg",
  capturedAt: "2026-06-26T10:00:00.000Z",
  location: { latitude: 37.7749, longitude: -122.4194 },
  weather: { temperatureCelsius: 18, condition: "Clear" },
  isPartial: false,
};

const partialReport: Report = {
  photoUri: "file:///photo.jpg",
  capturedAt: "2026-06-26T10:00:00.000Z",
  location: null,
  weather: null,
  isPartial: true,
  enrichmentUnavailableReason: "networkUnavailable",
};

describe("buildReportPdfHtml", () => {
  it("includes timestamp, coordinates, weather, and photo for a full report", () => {
    const html = buildReportPdfHtml(fullReport, { photoDataUri });

    expect(html).toContain("Captured at");
    expect(html).toContain("37.77490, -122.41940");
    expect(html).toContain("Clear");
    expect(html).toContain("18°C");
    expect(html).toContain(photoDataUri);
    expect(html).toContain("Report Preview");
  });

  it("includes unavailable reason and partial indicator for a partial report", () => {
    const html = buildReportPdfHtml(partialReport, { photoDataUri });

    expect(html).toContain("Partial Report Preview");
    expect(html).toContain("Network unavailable");
    expect(html).toContain("Unavailable");
    expect(html).toContain(photoDataUri);
  });

  it("escapes HTML in weather condition values", () => {
    const report: Report = {
      ...fullReport,
      weather: { temperatureCelsius: 12, condition: "Rain & \"wind\" <gusts>" },
    };

    const html = buildReportPdfHtml(report, { photoDataUri });

    expect(html).toContain("Rain &amp; &quot;wind&quot; &lt;gusts&gt;");
    expect(html).not.toContain("Rain & \"wind\" <gusts>");
  });

  it("includes bounded photo styling", () => {
    const html = buildReportPdfHtml(fullReport, { photoDataUri });

    expect(html).toContain("max-height: 420px");
    expect(html).toContain("object-fit: contain");
  });
});
