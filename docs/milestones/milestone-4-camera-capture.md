# Milestone 4 — Native camera capture & permission handling

**Project monitor:** [`implementation-plan.md`](../implementation-plan.md) · Milestone 4

**Milestone status:** `Not started` (set to `Complete` only in M4.5 after M4.1–M4.4 pass)

## Goal

Real camera capture with a live preview: native config, `CameraService`, `CaptureViewModel`, and capture screen wiring. No location, weather, report preview, or sharing.

## Milestone acceptance criteria

- Uses `expo-camera` `CameraView` and `takePictureAsync`. **No** `expo-image-picker` as primary path.
- Shows a real camera preview on device/simulator.
- Camera permission denied is handled gracefully (`cameraPermissionDenied`).
- `npm test` and `npm run typecheck` pass after each implementation card.

---

## Camera Notes

> Locked during M4 planning (2026-06-26). M4 implements camera capture only; the M3 reducer contract is frozen.

- Use `expo-camera` and `CameraView`; do not use `expo-image-picker`.
- Capture still photos only. No video, no microphone/audio.
- Native config belongs in M4.2: `expo-camera` config plugin, iOS camera usage copy, Android camera permission per Expo SDK 56 guidance.
- For Expo-specific decisions, follow `AGENTS.md`: use Expo MCP first when applicable, and Context7 `/expo/expo` as fallback or cross-check for SDK/API docs. Do not rely on model memory.
- `CameraService` owns native camera permission and `AppError` normalization (`cameraPermissionDenied` | `unknown`); never throws raw errors to callers. `takePictureAsync` is a UI-owned `CameraView` ref adapter (`TakePhoto`), wired in M4.4.
- `CaptureViewModel` owns async orchestration and dispatches reducer actions.
- Reducer stays pure; no service/native imports (M3 contract frozen).
- File locations: `src/services/CameraService.ts`, `src/services/FakeCameraService.ts`, `src/features/capture/CaptureViewModel.ts`.
- M4 does not implement location, weather enrichment, report preview, or sharing.

### Out of scope (Milestone 4 overall)

Location/weather services, enrichment ViewModel wiring, report preview UI, `expo-sharing`, `expo-location` usage in capture flow. No new `AppError` variants without amending docs first.

---

## M4.1 — Create Milestone 4 Board

**Status:** `Complete`

**Purpose:** Create the detailed task board and connect it to the project-level monitor.

**Files expected to change**

- `docs/milestones/README.md`
- `docs/milestones/milestone-4-camera-capture.md`
- `docs/implementation-plan.md` (link only; keep status `Not started`)

**Subtasks**

- [x] Create `docs/milestones/milestone-4-camera-capture.md` with 5 task cards (M4.1–M4.5).
- [x] Record Camera Notes: expo-camera, photo-only, service/ViewModel boundaries, file locations.
- [x] Link Milestone 4 in `docs/implementation-plan.md` to this board.
- [x] Add Milestone 4 to `docs/milestones/README.md` Current boards table.
- [x] Keep Milestone 4 status as `Not started` until implementation begins.
- [x] Do not edit `app.json`, `src/`, or implement camera runtime code in this task.

**Acceptance criteria**

- Milestone board exists with exactly 5 task cards (M4.1–M4.5).
- Implementation plan links to this board.
- Camera contract recorded on the board.
- No `src/` or `app.json` changes.

**Verification commands**

```bash
git diff --stat
git status --short
test -f docs/milestones/milestone-4-camera-capture.md
grep -q "M4.5" docs/milestones/milestone-4-camera-capture.md
```

**Commit guidance:** `docs: add milestone 4 task board`

**Human decision gate:** None.

---

## M4.2 — Native Camera Config + CameraService

**Status:** `Complete`

**Purpose:** Add camera native permissions/config and implement the camera service boundary with tests.

**Files expected to change**

- `app.json` (`expo-camera` config plugin, iOS `NSCameraUsageDescription`, Android camera permission; photo-only, no microphone)
- `src/services/CameraService.ts`
- `src/services/FakeCameraService.ts`
- `src/services/__tests__/CameraService.test.ts` (or equivalent test location per testing strategy)
- `docs/milestones/milestone-4-camera-capture.md` (card status)

**Subtasks**

- [x] Add `expo-camera` config plugin to `app.json` with iOS camera usage description and Android camera permission per Expo SDK 56 guidance.
- [x] Keep photo-only capture; do not add microphone/video/audio permissions.
- [x] Implement `CameraService` for camera permission request and `AppError` normalization.
- [x] Define `CameraCaptureResult` and `TakePhoto` type contract for UI-owned `CameraView` ref capture (wired in M4.4).
- [x] Normalize failures to `AppError` (`cameraPermissionDenied` | `unknown`); never throw raw errors to callers.
- [x] Implement `FakeCameraService` for tests.
- [x] Unit tests: already-granted, request-grants, request-denies, cannot-ask-again, throw->unknown, and fake-service contract.
- [x] No UI, ViewModel, or reducer changes.

**Acceptance criteria**

- `app.json` has camera native config; no microphone permission added.
- `requestPermission()` returns `{ ok: true }` for granted permission, or an `{ ok: false; error }` `AppError` result (`cameraPermissionDenied` | `unknown`) for denied/unavailable camera permission.
- Tests pass with fake service.
- Reducer remains untouched.

**Verification commands**

```bash
npm test
npm run typecheck
```

**Commit guidance:** `feat: add camera native config and CameraService`

**Human decision gate:** None.

---

## M4.3 — CaptureViewModel + Unit Tests

**Status:** `Complete`

**Purpose:** Wire `CameraService` and injected `TakePhoto` into async capture orchestration via the ViewModel; test without UI.

**Files expected to change**

- `src/features/capture/CaptureViewModel.ts`
- `src/features/capture/__tests__/CaptureViewModel.test.ts`
- `docs/architecture.md` (narrow camera/ViewModel alignment)
- `docs/milestones/milestone-4-camera-capture.md` (card status)

**Subtasks**

- [x] Create `useCaptureViewModel` hook injecting `CameraService`, `TakePhoto`, and optional `now`.
- [x] On capture intent: dispatch `START_CAPTURE`, request permission, then call injected `takePhoto`.
- [x] Success maps to `CAPTURE_SUCCEEDED` with `photoUri` and `capturedAt` (ISO timestamp from `now`).
- [x] Permission or photo failure maps to `CAPTURE_FAILED` with returned `AppError`.
- [x] Expose `dismissError` and `reset` intent handlers.
- [x] Unit tests with `FakeCameraService` and local fake `TakePhoto`: success, permission denied/unknown, photo failure, dismissError, reset; assert `cameraService.requestCount() === 1` on capture orchestration paths.
- [x] No UI changes.

**Acceptance criteria**

- ViewModel dispatches correct reducer actions on success and failure.
- Tests pass without native camera or UI.
- Reducer stays pure; side effects only in ViewModel/service.

**Verification commands**

```bash
npm test
npm run typecheck
```

**Commit guidance:** `feat: add CaptureViewModel for camera workflow`

**Human decision gate:** None.

---

## M4.4 — Camera Screen Wiring

**Status:** `Complete`

**Purpose:** Replace the placeholder screen with a real camera preview wired to the ViewModel.

**Files expected to change**

- `src/features/capture/CaptureScreen.tsx`
- `src/features/capture/__tests__/CaptureScreen.test.tsx`
- `src/app/index.tsx`
- `src/app/__tests__/index.test.tsx`
- `docs/milestones/milestone-4-camera-capture.md` (card status)

**Subtasks**

- [x] Replace placeholder in `src/app/index.tsx` with thin `<CaptureScreen />` wrapper.
- [x] Render `CameraView` after camera permission is granted; keep it mounted for preview. Reducer phase `capturing` is shutter-in-progress only, not preview mounting.
- [x] Screen-local `previewStatus` gates preview mount; mount-time denial shows full-screen recoverable fallback with retry.
- [x] Capture-time failure shows inline recoverable error with retry and dismiss.
- [x] Reflect reducer phases in UI (idle/capturing/captured/failed with error message).
- [x] Rear camera only (`facing="back"`); no camera-switch control in M4.
- [x] After success: "Photo captured" + Retake; no report preview/enrichment/share UI.
- [x] Basic accessibility: `accessibilityRole`, `accessibilityLabel` on capture/retry/retake/dismiss; readable status text.
- [x] Component tests in `CaptureScreen.test.tsx`; route smoke test mocks `CaptureScreen` in `index.test.tsx`.
- [x] No `expo-image-picker`. No `_layout.tsx` changes.

**Acceptance criteria**

- Real camera preview works on device/simulator when permitted (manual `npx expo start`; deferred if environment cannot run Expo — CLI typecheck + component tests pass).
- Mount-time permission denial is recoverable and clearly communicated (full-screen fallback).
- Capture-time failure is recoverable (inline error + retry/dismiss).
- UI reflects reducer state; no image-picker primary path.

**Verification commands**

```bash
npx expo start
npm test
npm run typecheck
```

**Commit guidance:** `feat: add camera capture screen`

**Human decision gate:** None. Manual visual launch deferred if environment cannot run Expo; board notes CLI sanity check passed.

---

## M4.5 — Quality Gate + Close Milestone 4

**Status:** `Not started`

**Purpose:** Run all Milestone 4 checks and update project monitors.

**Files expected to change**

- `docs/implementation-plan.md`
- `docs/milestones/milestone-4-camera-capture.md`
- `docs/milestones/README.md`

**Subtasks**

- [ ] Run `npm test` and `npm run typecheck`.
- [ ] Confirm no M5+ feature work leaked (no `expo-location`, Open-Meteo, enrichment ViewModel wiring, share UI).
- [ ] Confirm `expo-image-picker` is not installed.
- [ ] Set Milestone 4 status to `Complete` in `docs/implementation-plan.md` and check top-level M4 tasks.
- [ ] Set board header `Milestone status` to `Complete`; mark this card `Complete`.
- [ ] Update `docs/milestones/README.md` Milestone 4 row to `Complete`.
- [ ] Record known follow-up for M5.
- [ ] Do **not** start Milestone 5 in this task.

**Known follow-up for M5**

- Implement `LocationService` and `WeatherService` (Open-Meteo).
- Wire enrichment into ViewModel; dispatch `START_ENRICHMENT`, `ENRICHMENT_SUCCEEDED`, `ENRICHMENT_FAILED`.

**Acceptance criteria**

- All verification commands pass.
- Milestone 4 marked `Complete` only after M4.1–M4.4 pass.
- Board, plan, and README are consistent.

**Verification commands**

```bash
npm test
npm run typecheck
npm ls expo-image-picker
rg -n "expo-location|open-meteo|Open-Meteo|expo-sharing" src
git status --short
```

**Commit guidance:** `docs: close milestone 4 camera capture`

**Human decision gate:** None.
