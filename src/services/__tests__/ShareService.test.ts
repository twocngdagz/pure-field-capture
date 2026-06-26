import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { Report } from "@/features/capture/captureTypes";
import { createFakeShareService } from "../FakeShareService";
import { createShareService } from "../ShareService";

jest.mock("expo-print", () => ({
  printToFileAsync: jest.fn(),
}));

jest.mock("expo-file-system/legacy", () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: "base64" },
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

const mockPrintToFileAsync = jest.mocked(Print.printToFileAsync);
const mockReadAsStringAsync = jest.mocked(FileSystem.readAsStringAsync);
const mockIsAvailableAsync = jest.mocked(Sharing.isAvailableAsync);
const mockShareAsync = jest.mocked(Sharing.shareAsync);

const report: Report = {
  photoUri: "file:///photo.jpg",
  capturedAt: "2026-06-26T10:00:00.000Z",
  location: { latitude: 37.7749, longitude: -122.4194 },
  weather: { temperatureCelsius: 18, condition: "Clear" },
  isPartial: false,
};

const pdfUri = "file:///report.pdf";

describe("createShareService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadAsStringAsync.mockResolvedValue("PHOTO_BASE64");
    mockPrintToFileAsync.mockResolvedValue({ uri: pdfUri, numberOfPages: 1 });
  });

  it("returns shareFailed when photoUri is empty", async () => {
    const service = createShareService();
    const result = await service.share({ ...report, photoUri: "" });

    expect(result).toEqual({
      ok: false,
      error: {
        type: "shareFailed",
        message: "Sharing failed. Please try again.",
        retryable: true,
      },
    });
    expect(mockIsAvailableAsync).not.toHaveBeenCalled();
    expect(mockReadAsStringAsync).not.toHaveBeenCalled();
    expect(mockPrintToFileAsync).not.toHaveBeenCalled();
    expect(mockShareAsync).not.toHaveBeenCalled();
  });

  it("returns shareFailed when sharing is not available", async () => {
    mockIsAvailableAsync.mockResolvedValue(false);

    const service = createShareService();
    const result = await service.share(report);

    expect(result).toEqual({
      ok: false,
      error: {
        type: "shareFailed",
        message: "Sharing is not available on this device.",
        retryable: true,
      },
    });
    expect(mockReadAsStringAsync).not.toHaveBeenCalled();
    expect(mockPrintToFileAsync).not.toHaveBeenCalled();
    expect(mockShareAsync).not.toHaveBeenCalled();
  });

  it("generates a PDF report and shares the PDF uri", async () => {
    mockIsAvailableAsync.mockResolvedValue(true);
    mockShareAsync.mockResolvedValue(undefined);

    const service = createShareService();
    const result = await service.share(report);

    expect(result).toEqual({ ok: true });
    expect(mockReadAsStringAsync).toHaveBeenCalledWith("file:///photo.jpg", {
      encoding: "base64",
    });
    expect(mockPrintToFileAsync).toHaveBeenCalledWith({
      html: expect.stringContaining("37.77490, -122.41940"),
    });
    expect(mockShareAsync).toHaveBeenCalledWith(pdfUri, {
      dialogTitle: "Share field report",
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
    });
    expect(mockShareAsync).not.toHaveBeenCalledWith(
      report.photoUri,
      expect.anything(),
    );
  });

  it("returns shareFailed when photo file read throws", async () => {
    mockIsAvailableAsync.mockResolvedValue(true);
    mockReadAsStringAsync.mockRejectedValue(new Error("read failed"));

    const service = createShareService();
    const result = await service.share(report);

    expect(result).toEqual({
      ok: false,
      error: {
        type: "shareFailed",
        message: "Sharing failed. Please try again.",
        retryable: true,
      },
    });
    expect(mockPrintToFileAsync).not.toHaveBeenCalled();
    expect(mockShareAsync).not.toHaveBeenCalled();
  });

  it("returns shareFailed when printToFileAsync throws", async () => {
    mockIsAvailableAsync.mockResolvedValue(true);
    mockPrintToFileAsync.mockRejectedValue(new Error("print failed"));

    const service = createShareService();
    const result = await service.share(report);

    expect(result).toEqual({
      ok: false,
      error: {
        type: "shareFailed",
        message: "Sharing failed. Please try again.",
        retryable: true,
      },
    });
    expect(mockShareAsync).not.toHaveBeenCalled();
  });

  it("returns shareFailed when printToFileAsync returns no uri", async () => {
    mockIsAvailableAsync.mockResolvedValue(true);
    mockPrintToFileAsync.mockResolvedValue({ uri: "", numberOfPages: 0 });

    const service = createShareService();
    const result = await service.share(report);

    expect(result).toEqual({
      ok: false,
      error: {
        type: "shareFailed",
        message: "Sharing failed. Please try again.",
        retryable: true,
      },
    });
    expect(mockShareAsync).not.toHaveBeenCalled();
  });

  it("returns shareFailed when shareAsync throws", async () => {
    mockIsAvailableAsync.mockResolvedValue(true);
    mockShareAsync.mockRejectedValue(new Error("Share failed"));

    const service = createShareService();
    const result = await service.share(report);

    expect(result).toEqual({
      ok: false,
      error: {
        type: "shareFailed",
        message: "Sharing failed. Please try again.",
        retryable: true,
      },
    });
  });
});

describe("createFakeShareService", () => {
  it("tracks share calls and last report in the fake service", async () => {
    const fake = createFakeShareService();

    await fake.share(report);

    expect(fake.shareCount()).toBe(1);
    expect(fake.lastReport()).toEqual(report);
  });
});
