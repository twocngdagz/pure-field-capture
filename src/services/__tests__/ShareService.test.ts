import * as Sharing from "expo-sharing";
import type { Report } from "@/features/capture/captureTypes";
import { createFakeShareService } from "../FakeShareService";
import { createShareService } from "../ShareService";

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

const mockIsAvailableAsync = jest.mocked(Sharing.isAvailableAsync);
const mockShareAsync = jest.mocked(Sharing.shareAsync);

const report: Report = {
  photoUri: "file:///photo.jpg",
  capturedAt: "2026-06-26T10:00:00.000Z",
  location: { latitude: 37.7749, longitude: -122.4194 },
  weather: { temperatureCelsius: 18, condition: "Clear" },
  isPartial: false,
};

describe("createShareService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(mockShareAsync).not.toHaveBeenCalled();
  });

  it("shares the photo file when sharing is available", async () => {
    mockIsAvailableAsync.mockResolvedValue(true);
    mockShareAsync.mockResolvedValue(undefined);

    const service = createShareService();
    const result = await service.share(report);

    expect(result).toEqual({ ok: true });
    expect(mockIsAvailableAsync).toHaveBeenCalledTimes(1);
    expect(mockShareAsync).toHaveBeenCalledWith("file:///photo.jpg", {
      dialogTitle: "Share field report",
      mimeType: "image/jpeg",
      UTI: "public.jpeg",
    });
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
