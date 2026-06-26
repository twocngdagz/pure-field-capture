import { Camera } from "expo-camera";
import type { AppError } from "@/features/capture/captureTypes";

export type CameraPermissionResult =
  | { ok: true }
  | { ok: false; error: AppError };

export type CameraCaptureResult =
  | { ok: true; photoUri: string }
  | { ok: false; error: AppError };

export type TakePhoto = () => Promise<CameraCaptureResult>;

export type CameraService = {
  requestPermission: () => Promise<CameraPermissionResult>;
};

const cameraPermissionDenied = (): AppError => ({
  type: "cameraPermissionDenied",
  message: "Camera permission is required to take a photo.",
  retryable: true,
});

const unknownCameraError = (): AppError => ({
  type: "unknown",
  message: "Camera is unavailable. Please try again.",
  retryable: true,
});

export const createCameraService = (): CameraService => ({
  requestPermission: async () => {
    try {
      const current = await Camera.getCameraPermissionsAsync();

      if (current.granted) {
        return { ok: true };
      }

      if (!current.canAskAgain) {
        return { ok: false, error: cameraPermissionDenied() };
      }

      const requested = await Camera.requestCameraPermissionsAsync();

      if (requested.granted) {
        return { ok: true };
      }

      return { ok: false, error: cameraPermissionDenied() };
    } catch {
      return { ok: false, error: unknownCameraError() };
    }
  },
});
