import { render, screen, userEvent } from "@testing-library/react-native";
import type { EnrichmentUnavailableReason, Report } from "../captureTypes";
import { ENRICHMENT_UNAVAILABLE_COPY } from "../reportView";
import { ReportPreview } from "../ReportPreview";

const fullReport: Report = {
  photoUri: "file:///photo.jpg",
  capturedAt: "2026-06-26T10:00:00.000Z",
  location: { latitude: 37.7749, longitude: -122.4194 },
  weather: { temperatureCelsius: 18, condition: "Clear" },
  isPartial: false,
};

const partialReport = (reason?: EnrichmentUnavailableReason): Report => ({
  photoUri: "file:///photo.jpg",
  capturedAt: "2026-06-26T10:00:00.000Z",
  location: null,
  weather: null,
  isPartial: true,
  enrichmentUnavailableReason: reason,
});

describe("ReportPreview", () => {
  it("renders a full report with photo, sections, and row values", () => {
    render(<ReportPreview report={fullReport} onRetake={jest.fn()} />);

    expect(screen.getByTestId("report-preview-title")).toHaveTextContent(
      "Report Preview",
    );
    expect(screen.queryByTestId("report-partial-notice")).toBeNull();
    expect(screen.getByTestId("report-photo")).toBeTruthy();
    expect(screen.getByText("Capture")).toBeTruthy();
    expect(screen.getByText("Location")).toBeTruthy();
    expect(screen.getByText("Weather")).toBeTruthy();
    expect(screen.getByText("Jun 26, 2026, 10:00 AM UTC")).toBeTruthy();
    expect(screen.getByText("37.77490, -122.41940")).toBeTruthy();
    expect(screen.getByText("Clear")).toBeTruthy();
    expect(screen.getByText("18°C")).toBeTruthy();
  });

  it("renders a partial report with notice and unavailable enrichment rows", () => {
    render(
      <ReportPreview
        report={partialReport("networkUnavailable")}
        onRetake={jest.fn()}
      />,
    );

    expect(screen.getByTestId("report-preview-title")).toHaveTextContent(
      "Partial Report Preview",
    );
    expect(screen.getByTestId("report-partial-notice")).toHaveTextContent(
      ENRICHMENT_UNAVAILABLE_COPY.networkUnavailable,
    );
    expect(screen.getAllByText("Unavailable").length).toBeGreaterThanOrEqual(2);
  });

  it("calls onRetake when Retake is pressed", async () => {
    const user = userEvent.setup();
    const onRetake = jest.fn();

    render(<ReportPreview report={fullReport} onRetake={onRetake} />);

    await user.press(screen.getByRole("button", { name: "Retake photo" }));

    expect(onRetake).toHaveBeenCalledTimes(1);
  });
});
