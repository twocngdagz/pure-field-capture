# Milestone 5 — Location capture & Open-Meteo enrichment

**Project monitor:** [`implementation-plan.md`](../implementation-plan.md) · Milestone 5

**Milestone status:** `Not started`

## Goal

Attach current GPS coordinates and Open-Meteo weather to a captured photo. Handle no-network,
location denied, and weather API failure with distinct recoverable paths. Preserve the photo
on all enrichment failures. No report preview or sharing.

## Milestone acceptance criteria

- `LocationService` returns `Coordinates` (latitude/longitude); no reverse geocoding.
- `WeatherService` calls Open-Meteo with coordinates (no API key).
- `networkUnavailable` is distinct from `weatherFailed` where practical.
- Captured photo survives enrichment failure; partial report allowed with `enrichmentUnavailableReason`.
- User triggers enrichment via **Enrich report** after capture (not automatic).
- `npm test` and `npm run typecheck` pass after each implementation card.

---

## Location & Weather Notes

> Locked during M5 planning (2026-06-26). M5 implements enrichment only; the M3 reducer contract is frozen.

- Use `expo-location` for foreground location permission and current coordinates only.
- **No reverse geocoding.** `LocationService` returns `Coordinates` (`{ latitude, longitude }`).
  The frozen M3 contract has no `address` field on `Report` or `ENRICHMENT_SUCCEEDED`.
  Reverse geocoding / human-readable address is stretch only; requires a documented post-core
  decision and type contract update before implementation.
- **Foreground location only.** No background location permission.
- Native location config belongs in M5.2: `expo-location` config plugin, iOS foreground location
  usage description, Android foreground location permission per Expo SDK 56 guidance.
- Use **Open-Meteo** for weather enrichment (D2). No API key, no `.env`.
- Enrichment flow is **sequential**: get coordinates first, then fetch weather with those coordinates.
- Enrichment is **user-triggered**: after `CAPTURE_SUCCEEDED`, UI shows **Enrich report**;
  tapping it calls `viewModel.enrich()` which dispatches `START_ENRICHMENT`.
- Error mapping in services:
  - `fetch` throw / network failure → `networkUnavailable`
  - HTTP non-OK / bad payload → `weatherFailed`
  - Location permission denied → `locationPermissionDenied`
- Preserve the captured `photoUri` on all enrichment failures; never delete the photo.
- For Expo-specific decisions, follow `AGENTS.md`: use Expo MCP first when applicable, and
  Context7 `/expo/expo` as fallback or cross-check for SDK/API docs. Do not rely on model memory.
- `LocationService` and `WeatherService` own native/API boundaries and `AppError` normalization;
  never throw raw errors to callers.
- `CaptureViewModel` owns enrichment orchestration and dispatches reducer actions.
- Reducer stays pure; no service/native imports (M3 contract frozen).
- File locations: `src/services/LocationService.ts`, `src/services/WeatherService.ts`,
  `src/services/FakeLocationService.ts`, `src/services/FakeWeatherService.ts`,
  `src/features/capture/CaptureViewModel.ts`, `src/features/capture/CaptureScreen.tsx`.
- M5 does not implement report preview UI or sharing.

### Out of scope (Milestone 5 overall)

- Reverse geocoding / address lookup.
- Address fields in `Report`.
- Report preview screen (Milestone 6).
- `expo-sharing` / share workflow (Milestone 7).
- No new `AppError` variants without amending docs first.

---

## M5.1 — Create Milestone 5 Board

**Status:** `Complete`

**Purpose:** Create the detailed task board and connect it to the project-level monitor.

**Files expected to change**

- `docs/milestones/README.md`
- `docs/milestones/milestone-5-location-weather.md`
- `docs/implementation-plan.md` (link only; keep status `Not started`)

**Subtasks**

- [x] Create `docs/milestones/milestone-5-location-weather.md` with 4 task cards (M5.1–M5.4).
- [x] Record Location & Weather Notes: coordinates only, no reverse geocoding, foreground location,
  Open-Meteo no key, preserve photo on failure, sequential enrichment, user-triggered Enrich.
- [x] Link Milestone 5 in `docs/implementation-plan.md` to this board.
- [x] Add Milestone 5 to `docs/milestones/README.md` Current boards table (`Open`).
- [x] Keep Milestone 5 status as `Not started` until implementation begins.
- [x] Do not edit `app.json`, `src/`, or implement location/weather runtime code in this task.

**Acceptance criteria**

- Milestone board exists with exactly 4 task cards (M5.1–M5.4).
- Implementation plan links to this board.
- Location/weather contract recorded on the board.
- No `src/` or `app.json` changes.

**Verification commands**

```bash
git diff --stat
git status --short
test -f docs/milestones/milestone-5-location-weather.md
grep -q "M5.4" docs/milestones/milestone-5-location-weather.md
```

**Commit guidance:** `docs: add milestone 5 task board`

**Human decision gate:** None.

---

## M5.2 — Native Location Config + Location & Weather Services

**Status:** `Complete`

**Purpose:** Add location native permissions/config and implement location and weather service
boundaries with fakes and tests. No ViewModel or UI.

**Files expected to change**

- `app.json` (`expo-location` config plugin, iOS foreground location usage description,
  Android foreground location permission; no background location)
- `src/services/LocationService.ts`
- `src/services/WeatherService.ts`
- `src/services/FakeLocationService.ts`
- `src/services/FakeWeatherService.ts`
- `src/services/__tests__/LocationService.test.ts`
- `src/services/__tests__/WeatherService.test.ts`
- `docs/milestones/milestone-5-location-weather.md` (card status)

**Subtasks**

- [x] Add `expo-location` config plugin to `app.json` with iOS foreground location usage
  description and Android foreground location permission per Expo SDK 56 guidance.
- [x] Do **not** add background location permission.
- [x] Implement `LocationService`: request foreground location permission, get current
  coordinates; return `Coordinates` or `AppError` (`locationPermissionDenied` | `unknown`).
- [x] No `reverseGeocodeAsync()`; coordinates only.
- [x] Implement `WeatherService`: fetch Open-Meteo current weather for given coordinates
  (no API key); return `WeatherSummary` or `AppError`.
- [x] Map `fetch` throw / network failure to `networkUnavailable`; HTTP non-OK / bad payload
  to `weatherFailed`; never expose raw technical errors.
- [x] Implement `FakeLocationService` and `FakeWeatherService` for tests.
- [x] Unit tests: location success, permission denied, native failure; weather success,
  no-network (`networkUnavailable`), API failure (`weatherFailed`); fake-service contracts.
- [x] No ViewModel, UI, or reducer changes.

**Acceptance criteria**

- `app.json` has foreground location native config; no background location permission.
- Services return typed success results or normalized `AppError`; never throw raw errors.
- `networkUnavailable` is distinct from `weatherFailed` in weather error mapping.
- Tests pass with fake services.
- Reducer remains untouched.

**Verification commands**

```bash
npm test
npm run typecheck
```

**Commit guidance:** `feat: add location config and enrichment services`

**Human decision gate:** None.

---

## M5.3 — Enrichment ViewModel Wiring

**Status:** `Not started`

**Purpose:** Inject location and weather services into enrichment orchestration via the
ViewModel; test without UI.

**Files expected to change**

- `src/features/capture/CaptureViewModel.ts`
- `src/features/capture/__tests__/CaptureViewModel.test.ts`
- `docs/milestones/milestone-5-location-weather.md` (card status)

**Subtasks**

- [ ] Inject `LocationService` and `WeatherService` into `useCaptureViewModel` deps.
- [ ] Add `enrich()` intent: dispatch `START_ENRICHMENT`, call location then weather
  sequentially, dispatch `ENRICHMENT_SUCCEEDED` or `ENRICHMENT_FAILED`.
- [ ] Add `retryEnrichment()` (re-run enrichment after recoverable failure).
- [ ] Add `continueWithPartialReport()` dispatching `CONTINUE_WITH_PARTIAL_REPORT`.
- [ ] On success: dispatch `ENRICHMENT_SUCCEEDED` with `location: Coordinates` and
  `weather: WeatherSummary` per frozen reducer contract.
- [ ] On failure: dispatch `ENRICHMENT_FAILED` with normalized `AppError`; preserve `photoUri`.
- [ ] Unit tests with fake services: success, location denied, no-network
  (`networkUnavailable`), weather API failure (`weatherFailed`); retry and continue-with-partial
  paths; assert captured photo URI preserved on failure.
- [ ] No UI changes.

**Acceptance criteria**

- ViewModel dispatches correct enrichment reducer actions on success and failure.
- Tests pass without native location, network, or UI.
- Reducer stays pure; side effects only in ViewModel/services.

**Verification commands**

```bash
npm test
npm run typecheck
```

**Commit guidance:** `feat: add enrichment orchestration to CaptureViewModel`

**Human decision gate:** None.

---

## M5.4 — Enrichment UI + Gate + Close Milestone 5

**Status:** `Not started`

**Purpose:** Wire enrichment recovery UI into `CaptureScreen`, run quality gate, and close
Milestone 5 monitors.

**Files expected to change**

- `src/features/capture/CaptureScreen.tsx`
- `src/features/capture/__tests__/CaptureScreen.test.tsx`
- `docs/implementation-plan.md`
- `docs/milestones/milestone-5-location-weather.md`
- `docs/milestones/README.md`

**Subtasks**

- [ ] Captured state: show **Enrich report** button (alongside Retake); tapping calls
  `viewModel.enrich()`.
- [ ] Enriching state: loading spinner/status text while `phase === "enriching"`.
- [ ] Offline/no-network error: clear message with **Retry** and **Continue with partial report**
  buttons when `error.type === "networkUnavailable"`.
- [ ] Location denied / weather failed: partial path with retry or continue where applicable.
- [ ] Basic accessibility: `accessibilityRole`, `accessibilityLabel` on Enrich/Retry/Continue/Retake;
  readable status and error text.
- [ ] Component tests: enriching status text; network failure shows Retry + Continue; Continue
  transitions to partial ready state; photo URI preserved.
- [ ] Run gate: `npm test`, `npm run typecheck`, M6/M7 leakage scan (allow `expo-location`,
  `expo-camera`, Open-Meteo; scan for share/preview leakage).
- [ ] Set Milestone 5 status to `Complete` in `docs/implementation-plan.md`.
- [ ] Set board header `Milestone status` to `Complete`; mark this card `Complete`.
- [ ] Update `docs/milestones/README.md` Milestone 5 row to `Complete`.
- [ ] Record gate evidence and manual QA note on this card.
- [ ] Do **not** start Milestone 6 in this task.

**Acceptance criteria**

- Enrichment UI reflects reducer phases and scenario-specific errors.
- Offline state is explicitly handled with Retry and Continue with partial report.
- Captured photo survives enrichment failure.
- All verification commands pass.
- Milestone 5 marked `Complete` only after M5.1–M5.3 pass.

**Verification commands**

```bash
npm test
npm run typecheck
rg -n "expo-sharing|Sharing\\.|ShareService|ReportPreview" src
git status --short
```

**Commit guidance:** Split within this card (same pattern as M4.4 feat + M4.5 docs):

1. `feat: add enrichment recovery UI` — `CaptureScreen` enrichment states and component tests.
2. `docs: close milestone 5 location weather` — gate evidence and monitor updates.

Do not combine UI and close into one commit.

**Human decision gate:** None. Manual enrichment/location verification deferred if environment
cannot run Expo; board notes CLI sanity check passed.

---
