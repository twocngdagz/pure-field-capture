# Decisions

Lightweight decision records. Each entry is a deliberate choice that constrains
implementation. Change a decision here **before** changing behavior in code.

## D1 — React Native with Expo and TypeScript

**Decision:** Use React Native with Expo and TypeScript.

**Reason:** The assessment is time-boxed and asks for native camera, native sharing,
REST API enrichment, failure handling, tests, and demo readiness. Expo provides
production-ready access to the required native capabilities while allowing fast
iteration.

**Why not SwiftUI / Kotlin for this assessment:** A fully native app would be valid, but
this workflow is mostly platform-agnostic: capture, location, REST enrichment, report
preview, and sharing. React Native / Expo lets the same architecture serve both iOS and
Android later. The prompt explicitly allows React Native / Expo.

**Trade-off:** Expo is appropriate for this level of native capability. For deeper
platform-specific requirements later — advanced background services, custom camera
processing, or native extensions — the project can move to development builds, config
plugins, or native modules.

## D2 — Open-Meteo for weather, no API key

**Decision:** Use Open-Meteo for weather enrichment using GPS coordinates.

**Reason:** No API key required, no `.env` setup, simpler fresh checkout for the
reviewer, and good enough for GPS-based weather context.

**Consequence:** Do **not** add `.env` / `.env.example`. If the provider ever switches to
a key-based API (e.g. OpenWeatherMap), then add `.env.example`, a README API-key setup
section, and `EXPO_PUBLIC_OPENWEATHER_API_KEY` — and update this decision first.

## D3 — Native camera, no image picker as primary path

**Decision:** Use `expo-camera` with `CameraView` and `takePictureAsync`. Show a real
camera preview.

**Reason:** The assessment explicitly requires native camera capture, not a stock photo
picker.

**Not allowed as primary path:** `expo-image-picker`, gallery picker, stock photo
picker, placeholder image, mock-only capture flow. Image picker may be mentioned only as
a possible future fallback.

## D4 — Reducer + ViewModel state strategy

**Decision:** A ViewModel hook with `useReducer` drives the capture workflow. The reducer
is pure and only handles state transitions. Side effects (camera, GPS, weather fetch,
report generation, native sharing) run in ViewModel action functions or injected
services; results are dispatched back into the reducer.

**Reason:** Predictable, testable state transitions without unnecessary global state.

**Consequence:** Reducer tests verify pure transitions; ViewModel tests use fake services
to verify async workflow behavior.

## D5 — Error model

**Decision:** Normalize failures into a discriminated `AppError` union:

```ts
type AppError =
  | { type: 'networkUnavailable'; message: string; retryable: true }
  | { type: 'weatherFailed'; message: string; retryable: true }
  | { type: 'locationPermissionDenied'; message: string; retryable: true }
  | { type: 'cameraPermissionDenied'; message: string; retryable: true }
  | { type: 'shareFailed'; message: string; retryable: boolean }
  | { type: 'unknown'; message: string; retryable: boolean };
```

**Reason:** Keeps no-network distinct from generic API failure and lets the UI present
scenario-specific, recoverable messages instead of a catch-all error.

## D6 — Timebox strategy

**Decision:** Scope to a polished capture → enrich → share flow rather than a broad
property-management system. See the planned breakdown in
[`ai-workflow.md`](./ai-workflow.md).

**Reason:** The assessment values a solid, working demo over breadth and asks us to
timebox (4–6 hours core).

**Note:** Time figures are a *planned/targeted* timebox, not a claim of exact time spent,
unless actual time is tracked.

## D7 — Basic accessibility in the core flow

**Decision:** Take a basic slice of the accessibility stretch goal into the core flow:
roles + labels on Capture/Retry/Continue/Share, readable loading/error text, no
color-only status, labeled report sections.

**Reason:** This is a field workflow that should stay usable with assistive technology;
the cost is low and the signal is high.

## D8 — Intentional non-goals for the core submission

Not built unless explicitly selected later: authentication, backend API, property
database, multi-user workflows, full offline sync queue, map view, MCP/AI feature,
mobile CI, advanced native camera processing. Documented as future work.

## D9 — Native share artifact (pending — lock before Milestone 7)

**Status:** Pending. Must be decided and recorded here **before** implementing
`ShareService` in Milestone 7.

**Options:**
- **Captured image + report text** — share the actual photo file through the native share
  sheet with a text caption/body (timestamp, location, weather or unavailable reason).
  Best matches the assessment “send the capture” requirement.
- **Generated report file** — a single shareable artifact (e.g. `.txt` or simple HTML/PDF)
  that includes or accompanies the captured image via `expo-sharing`.
- **Plain-text report body only** — `Share.share({ message })` without the image file.
  Acceptable fallback, but weaker for “send the capture” unless paired with a real file.

**Lean default if undecided at M7:** share the **captured image file** through the native
share sheet **plus** report text (caption or companion message with timestamp, location,
weather or unavailable reason). Do not default to a local photo URI string in plain text —
that is not sharing the capture. Lock the final choice here before coding.
