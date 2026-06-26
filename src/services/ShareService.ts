import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { buildReportPdfHtml } from "@/features/capture/reportPdf";
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

async function readPhotoAsDataUri(photoUri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return `data:image/jpeg;base64,${base64}`;
}

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

      const photoDataUri = await readPhotoAsDataUri(report.photoUri);
      const html = buildReportPdfHtml(report, { photoDataUri });
      const { uri } = await Print.printToFileAsync({ html });

      if (!uri) {
        return { ok: false, error: sharingFailedError };
      }

      await Sharing.shareAsync(uri, {
        dialogTitle: "Share field report",
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
      });

      return { ok: true };
    } catch {
      return { ok: false, error: sharingFailedError };
    }
  },
});
