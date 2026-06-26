import type { CameraPermissionResult, CameraService } from "./CameraService";

export const createFakeCameraService = (
  result: CameraPermissionResult = { ok: true },
): CameraService & { requestCount: () => number } => {
  let count = 0;

  return {
    requestPermission: async () => {
      count += 1;
      return result;
    },
    requestCount: () => count,
  };
};
