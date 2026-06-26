import { render, screen, userEvent } from "@testing-library/react-native";
import type { EnrichmentUnavailableReason, Report } from "../captureTypes";
import { ENRICHMENT_UNAVAILABLE_COPY } from "../reportView";
import { ReportPreview } from "../ReportPreview";

const fullReport: Report = {
  photoUri: "file:///photo.jpg",
  capturedAt: "2026-06-26T10:00:00.000Z",
  location: { latitude: 37.7749, longitude: -122.4194 },
  weather: { temperatureCelsius: 18, condition: "Clear" },
  address: "1 Market St, San Francisco",
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
    expect(screen.getByText("1 Market St, San Francisco")).toBeTruthy();
    expect(screen.getByText("37.77490, -122.41940")).toBeTruthy();
    expect(screen.getByText("Clear")).toBeTruthy();
    expect(screen.getByText("18°C")).toBeTruthy();

    expect(screen.getByRole("header", { name: "Report Preview" })).toBeTruthy();
    expect(screen.getByRole("header", { name: "Capture" })).toBeTruthy();
    expect(screen.getByRole("header", { name: "Location" })).toBeTruthy();
    expect(screen.getByRole("header", { name: "Weather" })).toBeTruthy();
    expect(screen.getByLabelText("Captured field photo")).toBeTruthy();
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

  it("renders Share report when onShare is provided and calls onShare on press", async () => {
    const user = userEvent.setup();
    const onShare = jest.fn();

    render(
      <ReportPreview
        report={fullReport}
        onRetake={jest.fn()}
        onShare={onShare}
        isSharing={false}
      />,
    );

    expect(screen.getByTestId("share-report")).toBeTruthy();

    await user.press(screen.getByRole("button", { name: "Share report" }));

    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it("disables Share report while isSharing is true", () => {
    render(
      <ReportPreview
        report={fullReport}
        onRetake={jest.fn()}
        onShare={jest.fn()}
        isSharing={true}
      />,
    );

    const shareButton = screen.getByTestId("share-report");
    expect(shareButton).toBeTruthy();
    expect(shareButton.props.accessibilityState?.disabled).toBe(true);
  });

  it("hides Share report when onShare is not provided", () => {
    render(<ReportPreview report={fullReport} onRetake={jest.fn()} />);

    expect(screen.queryByTestId("share-report")).toBeNull();
  });
});
