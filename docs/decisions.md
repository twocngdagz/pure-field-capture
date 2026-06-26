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

## D10 — Expo Router + `src/app` layout

**Decision:** Scaffold with the Expo **default** template (Expo Router + TypeScript) using
`--template default@sdk-56`. Route files live under `src/app/` as produced by the SDK 56
`reset-project` flow in M2.2 (`_layout.tsx` + `index.tsx`). Use `tsconfig` path alias
`@/*` → `./src/*` (set by the scaffold). M2.4 verifies route placement and creates the
remaining `src/` skeleton (`components/`, `features/capture/`, `services/`, `utils/`).

**Reason:** Expo Router is the current Expo default and recommended file-based routing.
It gives native stack transitions between screens (e.g. capture → report preview) and is a
clear signal of modern Expo practice. Refines D1 (which chose Expo + TypeScript only).

**Scaffold procedure:** Generate in a temp directory outside the repo (`create-expo-app`
with `--template default@sdk-56`); run `reset-project` in temp (pipe `n\n` — interactive);
selectively copy scaffold files; preserve foundation `README.md`, `.gitignore`, agent rules,
`docs/`, `.cursor/`. Do not copy `scripts/` or the `reset-project` npm script.

**Trade-off:** More generated boilerplate to strip than a blank `App.tsx` template, but
better alignment with assessment navigation and interview expectations.

## D9 — Native share artifact

**Status:** Accepted (corrected post-M7 via M7.C1)

**Decision:** Share a **generated PDF report** containing the captured photo and enrichment
data (timestamp, coordinates or unavailable reason, weather condition and temperature or
unavailable reason, partial-report indication) via `expo-print` + `expo-sharing`.

**Implementation:** `ShareService` reads the captured photo as base64 via
`expo-file-system/legacy`, builds report HTML through a pure `buildReportPdfHtml(report)`
function (reusing `buildReportPreviewModel` for consistent strings), generates a PDF with
`Print.printToFileAsync({ html })`, and shares the PDF URI with
`Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" })`.

**Why:** The original M7 image-only artifact (`report.photoUri` via `expo-sharing`) shared
only the photo and dropped enrichment data, under-delivering on the assessment requirement
to capture, enrich, and send the resulting capture.

**Not included:** multi-file sharing, platform share extensions, or `expo-image-manipulator`
for photo resizing (base64 original photo is sufficient for this corrective slice; resizing
is a future optimization if PDF generation fails due to image size/memory).

**Cancellation semantics:** share-sheet dismissal is not distinguishable through
`shareAsync`; a resolved promise is treated as success. Only unavailable sharing or a
rejected/thrown `shareAsync` maps to `shareFailed`.

## D11 — Best-effort reverse-geocoded address

**Status:** Accepted

**Decision:** After successful GPS capture, attempt reverse geocoding via `expo-location`
`Location.reverseGeocodeAsync({ latitude, longitude })` to add a best-effort, human-readable
address to enrichment.

**Reason:** Field agents benefit from a readable address in the report preview and shared
PDF, while coordinates remain the canonical captured location for weather and auditability.

**Consequences:**

- Coordinates remain the canonical location value on `Report`.
- `address` is optional, best-effort display metadata (`address?: string | null`).
- Reverse-geocoding failure or empty result yields `address: null` and does NOT, by itself,
  create a partial report or a new `AppError`.
- No API keys, no new libraries, no `.env`. Uses existing `expo-location` only.
- Preview shows `Address` (or `Unavailable`) and `Coordinates` as separate Location rows.
