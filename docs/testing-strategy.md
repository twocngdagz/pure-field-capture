# Testing Strategy

We test the **meaningful logic**, not for 100% coverage. The architecture is designed so
the valuable logic (state transitions, async orchestration, error mapping, report
composition) is plain testable code, while native behavior is verified manually.

## What we test automatically

### 1. Reducer unit tests (pure)

- Every state transition: idle → capturing → captured → enriching →
  enriched / partial → sharing → shared.
- Every failure transition and the resulting `AppError`.
- Invariant: the captured photo URI is preserved across enrichment and share failures.

### 2. ViewModel tests with fake services

- Inject fake `CameraService`, `LocationService`, `WeatherService`, `ShareService`.
- Verify the async workflow: which actions are dispatched, in what order, for each
  outcome (success / denied / no-network / API error / share failure).
- Verify recovery intents: `retryEnrichment` and `continueWithPartialReport` behave
  correctly.

### 3. Error-mapping tests

- Failed `fetch` / thrown network exception → `networkUnavailable` (not `weatherFailed`).
- Open-Meteo non-OK response → `weatherFailed`.
- Location permission denied → `locationPermissionDenied`.
- Camera permission denied → `cameraPermissionDenied`.
- Share failure → `shareFailed`.
- Unexpected error → `unknown`. Raw technical errors never reach the UI.

### 4. Partial report tests

- No-network during enrichment yields a **partial report** (`isPartial: true`) with the
  photo intact and weather marked unavailable.
- Location denied yields a report with location/weather unavailable but still shareable.

### 5. Accessibility assertions (where practical)

- Component tests assert `accessibilityRole` and `accessibilityLabel` on Capture, Retry,
  Continue/partial, and Share controls.

### 6. Report PDF HTML builder tests (pure)

- `buildReportPdfHtml` unit tests assert full and partial report content (timestamp,
  coordinates, weather, unavailable reasons, HTML escaping) without inspecting PDF bytes.
- `ShareService` tests assert orchestration: HTML passed to `printToFileAsync`, PDF URI
  shared via `shareAsync`, failures mapped to `shareFailed`.

## What we verify manually (native)

These need a real device/simulator and are part of the demo, not the automated suite:

- Live camera **preview** renders and `takePictureAsync` returns a usable photo.
- Camera permission prompt and denied path.
- Location permission prompt and denied path.
- Real native **share sheet** opens with the generated PDF report artifact (photo +
  enrichment/unavailable data).
- Offline behavior via airplane mode (no-network/partial report path).

A lightweight integration test may exercise a service against its real boundary where
practical, but native UI flows are primarily manual.

## Fresh-checkout verification

Before submission, verify from a clean clone using **only** the README:

1. `git clone` the repository into a new directory.
2. `npm install`.
3. Run the documented start command; the app launches on a simulator/emulator/device.
4. Run the documented test command; the suite passes.

No API key or `.env` is required (Open-Meteo). If any step needs an undocumented manual
fix, the README is wrong — fix the README, not just your local machine.

## Tooling

- **Jest** as the test runner.
- **React Native Testing Library** for component/ViewModel tests.
- Fakes are hand-written typed implementations of the service interfaces (no heavy
  mocking framework needed).
