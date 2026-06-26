import { CameraView } from "expo-camera";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  createCameraService,
  type CameraService,
  type TakePhoto,
} from "@/services/CameraService";
import type { AppError } from "./captureTypes";
import { useCaptureViewModel } from "./CaptureViewModel";

type PreviewStatus = "checkingPermission" | "permissionDenied" | "ready";

const unknownCameraError: AppError = {
  type: "unknown",
  message: "Camera is unavailable. Please try again.",
  retryable: true,
};

export type CaptureScreenProps = {
  cameraService?: CameraService;
  takePhoto?: TakePhoto;
  now?: () => Date;
};

export function CaptureScreen({
  cameraService: cameraServiceProp,
  takePhoto: takePhotoProp,
  now,
}: CaptureScreenProps) {
  const cameraRef = useRef<CameraView>(null);
  const [previewStatus, setPreviewStatus] =
    useState<PreviewStatus>("checkingPermission");
  const [previewError, setPreviewError] = useState<AppError | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const cameraService = useMemo(
    () => cameraServiceProp ?? createCameraService(),
    [cameraServiceProp],
  );

  const refTakePhoto = useCallback<TakePhoto>(async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync();

      if (!photo?.uri) {
        return { ok: false, error: unknownCameraError };
      }

      return { ok: true, photoUri: photo.uri };
    } catch {
      return { ok: false, error: unknownCameraError };
    }
  }, []);

  const takePhoto = useMemo(
    () => takePhotoProp ?? refTakePhoto,
    [takePhotoProp, refTakePhoto],
  );

  const deps = useMemo(
    () => ({ cameraService, takePhoto, now }),
    [cameraService, takePhoto, now],
  );

  const viewModel = useCaptureViewModel(deps);
  const { state } = viewModel;

  const checkPreviewPermission = useCallback(async () => {
    setPreviewStatus("checkingPermission");
    setPreviewError(null);

    const result = await cameraService.requestPermission();

    if (result.ok) {
      setPreviewStatus("ready");
      return;
    }

    setPreviewStatus("permissionDenied");
    setPreviewError(result.error);
  }, [cameraService]);

  useEffect(() => {
    checkPreviewPermission();
  }, [checkPreviewPermission]);

  useEffect(() => {
    if (previewStatus !== "ready") {
      setIsCameraReady(false);
    }
  }, [previewStatus]);

  const canCapture =
    previewStatus === "ready" &&
    isCameraReady &&
    (state.phase === "idle" || state.phase === "failed");

  if (previewStatus === "checkingPermission") {
    return (
      <View style={styles.centered}>
        <Text style={styles.statusText}>Preparing camera...</Text>
      </View>
    );
  }

  if (previewStatus === "permissionDenied" && previewError !== null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{previewError.message}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry camera permission"
          onPress={checkPreviewPermission}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        facing="back"
        style={styles.preview}
        testID="camera-preview"
        accessibilityLabel="Camera preview"
        onCameraReady={() => setIsCameraReady(true)}
      />

      {state.phase === "capturing" && (
        <Text style={styles.statusText}>Capturing...</Text>
      )}

      {state.phase === "captured" && (
        <View style={styles.capturedBanner}>
          <Text style={styles.statusText}>Photo captured</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retake photo"
            onPress={viewModel.reset}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Retake</Text>
          </Pressable>
        </View>
      )}

      {state.phase === "failed" && state.error !== null && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{state.error.message}</Text>
          <View style={styles.inlineActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retry capture"
              onPress={viewModel.capture}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Retry</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
              onPress={viewModel.dismissError}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Capture photo"
        accessibilityState={{ disabled: !canCapture }}
        disabled={!canCapture}
        onPress={viewModel.capture}
        style={[styles.captureButton, !canCapture && styles.captureButtonDisabled]}
      >
        <Text style={styles.captureButtonText}>
          {state.phase === "capturing" ? "Capturing..." : "Capture photo"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  preview: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    textAlign: "center",
    padding: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    padding: 12,
  },
  capturedBanner: {
    padding: 12,
    alignItems: "center",
  },
  errorBanner: {
    padding: 12,
    alignItems: "center",
  },
  inlineActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#208AEF",
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  captureButton: {
    padding: 16,
    backgroundColor: "#208AEF",
    alignItems: "center",
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
