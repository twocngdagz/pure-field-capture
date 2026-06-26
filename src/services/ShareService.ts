import * as Sharing from "expo-sharing";
import type { AppError, Report } from "@/features/capture/captureTypes";

export type ShareResult =
  | { ok: true }
  | { ok: false; error: Extract<AppError, { type: "shareFailed" }> };

export type ShareService = {
  share: (report: Report) => Promise<ShareResult>;
};

const sharingUnavailableError: Extract<AppError, { type: "shareFailed" }> = {
  type: "shareFailed",
  message: "Sharing is not available on this device.",
  retryable: true,
};

const sharingFailedError: Extract<AppError, { type: "shareFailed" }> = {
  type: "shareFailed",
  message: "Sharing failed. Please try again.",
  retryable: true,
};

export const createShareService = (): ShareService => ({
  share: async (report) => {
    if (!report.photoUri) {
      return { ok: false, error: sharingFailedError };
    }

    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        return { ok: false, error: sharingUnavailableError };
      }

      await Sharing.shareAsync(report.photoUri, {
        dialogTitle: "Share field report",
        mimeType: "image/jpeg",
        UTI: "public.jpeg",
      });

      return { ok: true };
    } catch {
      return { ok: false, error: sharingFailedError };
    }
  },
});
