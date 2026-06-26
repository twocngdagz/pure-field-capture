# Architecture

A small, layered React Native / Expo app organized around a single capture workflow.
The design goal is **predictable, testable state** with side effects pushed to the edges.

## App layers

```
UI (screens / components)
        │  user intent (tap Capture / Retry / Continue / Share)
        ▼
ViewModel hook (captureViewModel)
        │  calls services, awaits results, dispatches actions
        ▼
Reducer (captureReducer, pure)            Services (injected, side-effectful)
   state transitions only                  CameraService / LocationService /
                                           WeatherService / ShareService
```

- **UI** renders state and forwards user intent. No business logic, no fetching.
- **ViewModel** orchestrates the async workflow: it calls services, maps their results
  (success or `AppError`), and dispatches actions into the reducer.
- **Reducer** is a pure function `(state, action) => state`. No I/O, no service imports,
  no timers.
- **Services** are typed boundaries around native/remote capabilities. They are injected
  so tests can substitute fakes.

## Data flow

```
User taps Capture
  → ViewModel requests camera permission through CameraService
  → on denial: dispatch CAPTURE_FAILED(cameraPermissionDenied | unknown)
  → on grant: ViewModel calls injected TakePhoto adapter (UI-owned CameraView ref)
  → adapter returns photo URI or AppError
  → ViewModel dispatches CAPTURE_SUCCEEDED or CAPTURE_FAILED
  → reducer updates state
  → UI re-renders

Capture succeeds
  → ViewModel calls LocationService then WeatherService
  → on success: dispatch ENRICHMENT_SUCCEEDED (location + weather)
  → on no network: dispatch ENRICHMENT_FAILED(networkUnavailable) → partial report allowed
  → on weather error: dispatch ENRICHMENT_FAILED(weatherFailed)   → partial report allowed
  → on location denied: dispatch ENRICHMENT_FAILED(locationPermissionDenied) → location/weather marked unavailable
  (photo URI is preserved across all of these)

User taps Share
  → ViewModel calls ShareService.share(report)
  → on success: dispatch SHARE_SUCCEEDED
  → on failure: dispatch SHARE_FAILED(shareFailed) → preview stays, retry allowed
```

## State management

The app uses a **ViewModel hook with `useReducer`** for the capture workflow.

The reducer is **pure** and only handles state transitions.

Side effects — camera capture, GPS lookup, weather fetch, report generation, and native
sharing — are executed in ViewModel action functions or injected services. After each
side effect completes, the ViewModel dispatches the result back into the reducer.

This keeps state transitions predictable and testable while avoiding unnecessary global
state. No Redux/global store is introduced; the workflow is local to the capture feature.

### Reducer responsibility

- Own the capture state machine and the current `AppError` (if any).
- Apply transitions deterministically; never perform or trigger side effects.
- Preserve the captured photo URI across enrichment/share failures.

### ViewModel responsibility

- Hold the reducer state and expose intent handlers (`capture`, `retryEnrichment`,
  `continueWithPartialReport`, `share`).
- Call injected services and adapters, translate failed results into `AppError`, and dispatch.
- Contain the async orchestration logic that the reducer must stay free of.
- Own workflow timing, not native refs (`CameraView` ref lives in the screen; photo capture
  is injected as `TakePhoto`).

## Canonical reducer actions

`captureTypes.ts` is the source of truth for executable reducer action names.
The reducer uses SCREAMING_SNAKE action types:

`START_CAPTURE`, `CAPTURE_SUCCEEDED`, `CAPTURE_FAILED`,
`START_ENRICHMENT`, `ENRICHMENT_SUCCEEDED`, `ENRICHMENT_FAILED`,
`CONTINUE_WITH_PARTIAL_REPORT`, `START_SHARING`, `SHARE_SUCCEEDED`,
`SHARE_FAILED`, `DISMISS_ERROR`, `RESET_WORKFLOW`.

## Service boundaries

| Service | Native/remote capability | Notes |
| --- | --- | --- |
| `CameraService` | `expo-camera` permission APIs | Permission request + `AppError` normalization (`cameraPermissionDenied` \| `unknown`). Photo capture is a UI-owned `CameraView.takePictureAsync()` adapter (`TakePhoto`), wired in the screen. |
| `LocationService` | `expo-location` | Current coordinates; may return `locationPermissionDenied`. |
| `WeatherService` | Open-Meteo REST (no key) | GPS → weather; maps fetch/network failures to `networkUnavailable`, API failures to `weatherFailed`. |
| `ShareService` | native sharing (`expo-print` + `expo-sharing`) | Generates a PDF report from report HTML (`expo-print`) and opens the native share sheet (`expo-sharing`); failure maps to `shareFailed`. |

Each service is an interface with a real implementation and a fake for tests.

## Error model

```ts
type AppError =
  | { type: 'networkUnavailable'; message: string; retryable: true }
  | { type: 'weatherFailed'; message: string; retryable: true }
  | { type: 'locationPermissionDenied'; message: string; retryable: true }
  | { type: 'cameraPermissionDenied'; message: string; retryable: true }
  | { type: 'shareFailed'; message: string; retryable: boolean }
  | { type: 'unknown'; message: string; retryable: boolean };
```

- `networkUnavailable` is **distinct** from `weatherFailed` (API error) where practical.
- Raw technical errors are never surfaced to the UI; services normalize them.
- The UI renders the `message` and offers retry/continue based on `retryable` and the
  scenario.

## Report model

A report composes the capture with enrichment and tolerates missing pieces:

```ts
type EnrichmentUnavailableReason =
  | 'networkUnavailable'
  | 'weatherFailed'
  | 'locationPermissionDenied';

type Report = {
  photoUri: string;                 // always present once captured
  capturedAt: string;               // ISO timestamp
  location?: { latitude: number; longitude: number } | null;
  weather?: WeatherSummary | null;  // null when unavailable
  isPartial: boolean;               // true when location/weather missing
  enrichmentUnavailableReason?: EnrichmentUnavailableReason;
  note?: string;
};
```

`enrichmentUnavailableReason` preserves *why* enrichment failed so preview and PDF report
copy can distinguish no-network from API failure from location denied — not just that weather
is missing. Set when `isPartial` is true and enrichment was attempted.

A **partial report** is a first-class outcome: a report with `isPartial: true` when
location or weather could not be obtained. The photo is never discarded to produce one.

## Native capability boundaries

- Native access is confined to the service layer, keeping the reducer and most of the
  ViewModel testable in plain JS.
- Native behavior (live camera preview, real share sheet) is **manually verified** and
  lightly integration-tested where practical — see
  [`testing-strategy.md`](./testing-strategy.md).
- Permissions (camera, location) are requested at the service boundary and surfaced as
  `AppError` variants, not exceptions leaking into the UI.
