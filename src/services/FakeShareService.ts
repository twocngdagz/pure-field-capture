import type { Report } from "@/features/capture/captureTypes";
import type { ShareResult, ShareService } from "./ShareService";

export const createFakeShareService = (
  result: ShareResult = { ok: true },
): ShareService & { shareCount: () => number; lastReport: () => Report | null } => {
  let count = 0;
  let last: Report | null = null;

  return {
    share: async (report) => {
      count += 1;
      last = report;
      return result;
    },
    shareCount: () => count,
    lastReport: () => last,
  };
};
