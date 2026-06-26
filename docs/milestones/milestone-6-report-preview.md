# Milestone 6 — Report preview

**Project monitor:** [`implementation-plan.md`](../implementation-plan.md) · Milestone 6

**Milestone status:** `Complete`

## Goal

A clear preview of the captured report before sending: photo, timestamp, GPS coordinates,
weather (or unavailable reason). No sharing.

## Milestone acceptance criteria

- Preview shows photo + enrichment, including unavailable states without crashing.
- Preview copy reflects `enrichmentUnavailableReason` (not just "weather missing").
- Location display is coordinates-only; no address or reverse geocoding.
- Reducer remains the source of truth for `Report`; M6 maps and renders, does not re-compose.
- `npm test` and `npm run typecheck` pass after each implementation card.

---

## Report Preview Notes

> Locked during M6 planning (2026-06-26). M6 implements preview presentation only; the M3 reducer
> contract is frozen.

- **Location display is coordinates-only; no reverse geocoding or address field.** Frozen
  `Report.location` is `Coordinates | null` (`{ latitude, longitude }`). Preview shows
  `37.7749, -122.4194` or "Unavailable". No address, street, city, or `reverseGeocodeAsync`.
- **Reducer owns `Report`.** M3 builds `state.report` in `ENRICHMENT_SUCCEEDED` and
  `CONTINUE_WITH_PARTIAL_REPORT`. M6 must **not** re-compose or re-derive the `Report`.
- **M6.2 is presentation mapping**, not domain composition: `buildReportPreviewModel(report)`
  maps an existing `Report` to display-ready sections/rows plus readable
  `enrichmentUnavailableReason` copy (`networkUnavailable` → "Network unavailable",
  `weatherFailed` → "Weather unavailable", `locationPermissionDenied` → "Location permission
  denied").
- **M6.3 replaces the M5.4 placeholder ready UI** in `CaptureScreen` with `<ReportPreview />`
  when `phase === "ready" && report !== null`. M5.4 status-only blocks ("Report data ready",
  "Partial report ready") are superseded, not stacked.
- **Photo via react-native `Image`**: `source={{ uri: report.photoUri }}`, `testID="report-photo"`,
  `accessibilityLabel="Captured field photo"`. M6 presents the URI as-is; no fetch/validation.
- File locations: `src/features/capture/reportView.ts`, `src/features/capture/ReportPreview.tsx`,
  `src/features/capture/CaptureScreen.tsx` (ready-phase integration).
- M6 does not implement sharing (Milestone 7).

### Out of scope (Milestone 6 overall)

- Reverse geocoding / human-readable address.
- Address fields in `Report`.
- `expo-sharing` / native share workflow (Milestone 7).
- Full Milestone 8 accessibility pass (M6 lays groundwork with labeled sections only).

---

## M6.1 — Create Milestone 6 Board

**Status:** `Complete`

**Purpose:** Create the detailed task board and connect it to the project-level monitor.

**Files expected to change**

- `docs/milestones/README.md`
- `docs/milestones/milestone-6-report-preview.md`
- `docs/implementation-plan.md` (link only; keep status `Not started`)

**Subtasks**

- [x] Create `docs/milestones/milestone-6-report-preview.md` with 4 task cards (M6.1–M6.4).
- [x] Record Report Preview Notes: coordinates-only, reducer owns Report, M6.2 presentation mapper,
  M6.3 replaces M5.4 ready placeholder, RN Image photo, M6.4 leak scan excludes ReportPreview.
- [x] Link Milestone 6 in `docs/implementation-plan.md` to this board.
- [x] Add Milestone 6 to `docs/milestones/README.md` Current boards table (`Open`).
- [x] Keep Milestone 6 status as `Not started` until implementation begins.
- [x] Do not edit `src/` or implement preview runtime code in this task.

**Acceptance criteria**

- Milestone board exists with exactly 4 task cards (M6.1–M6.4).
- Implementation plan links to this board.
- Report preview contract recorded on the board.
- No `src/` changes.

**Verification commands**

```bash
git diff --stat
git status --short
test -f docs/milestones/milestone-6-report-preview.md
grep -q "M6.4" docs/milestones/milestone-6-report-preview.md
```

**Commit guidance:** `docs: add milestone 6 task board`

**Human decision gate:** None.

---

## M6.2 — Report preview model (presentation mapping)

**Status:** `Complete`

**Purpose:** Map an existing `Report` to a display-ready preview model with pure, unit-tested
presentation logic. No UI, no reducer changes, no `Report` re-composition.

**Files expected to change**

- `src/features/capture/reportView.ts`
- `src/features/capture/__tests__/reportView.test.ts`
- `docs/milestones/milestone-6-report-preview.md` (card status)

**Subtasks**

- [x] Define `ReportPreviewModel` (title, sections with labeled rows, `isPartial`).
- [x] Implement `buildReportPreviewModel(report: Report)` — does **not** create or mutate `Report`.
- [x] Map location to coordinates string (`lat, lon` to 5 decimal places) or "Unavailable".
- [x] Map weather to condition + temperature string or "Unavailable".
- [x] Map each `enrichmentUnavailableReason` to readable copy for partial reports.
- [x] Format `capturedAt` for display (readable timestamp from ISO string).
- [x] Unit tests: full report (coords + weather rows); partial report for each
  `enrichmentUnavailableReason`; missing location/weather → "Unavailable".
- [x] No ViewModel, UI, or reducer changes.

**Acceptance criteria**

- Presentation mapping is pure and heavily tested.
- No `Report` re-composition; reducer remains source of truth.
- Handles all missing data without throwing.

**Verification commands**

```bash
npm test
npm run typecheck
```

**Commit guidance:** `feat: add report preview presentation model`

**Human decision gate:** None.

---

## M6.3 — Report preview UI

**Status:** `Complete`

**Purpose:** Render the composed report with clearly labeled sections; replace the M5.4
placeholder ready-phase UI in `CaptureScreen`.

**Files expected to change**

- `src/features/capture/ReportPreview.tsx`
- `src/features/capture/__tests__/ReportPreview.test.tsx`
- `src/features/capture/CaptureScreen.tsx`
- `src/features/capture/__tests__/CaptureScreen.test.tsx`
- `docs/milestones/milestone-6-report-preview.md` (card status)

**Subtasks**

- [x] Implement `ReportPreview` component consuming `buildReportPreviewModel(report)`.
- [x] Render captured photo with react-native `Image` (`testID="report-photo"`,
  `accessibilityLabel="Captured field photo"`).
- [x] Render photo via RN Image; sectioned labels: Capture (captured at), Location (coordinates),
  Weather (condition + temperature).
- [x] When `isPartial`, render distinct info block with `enrichmentUnavailableReason` readable copy.
- [x] Replace M5.4 minimal ready blocks in `CaptureScreen` with
  `<ReportPreview report={state.report} onRetake={viewModel.reset} />` when
  `phase === "ready" && report !== null`.
- [x] Guard: `phase === "ready" && report === null` shows "Report unavailable".
- [x] Basic accessibility: `accessibilityRole`, `accessibilityLabel` on Retake and section labels.
- [x] `ReportPreview.test.tsx`: photo uri, full/partial sections, reason copy.
- [x] Update `CaptureScreen.test.tsx`: replace M5.4 ready-status assertions with ReportPreview
  integration assertions (full ready, partial ready, Retake).
- [x] No sharing UI.

**Acceptance criteria**

- Preview renders for full and partial reports without undefined errors.
- M5.4 placeholder ready UI replaced, not duplicated.
- Ready phase shows labeled preview sections (photo, timestamp, coordinates, weather or unavailable reason);
  no sharing controls.

**Verification commands**

```bash
npm test
npm run typecheck
```

**Commit guidance:** `feat: add report preview UI`

**Human decision gate:** None. Manual visual preview deferred if environment cannot run Expo;
component tests pass.

---

## M6.4 — Quality Gate & Close Milestone 6

**Status:** `Complete`

**Purpose:** Run quality gate, align stale implementation-plan wording, and close Milestone 6
monitors.

**Files expected to change**

- `docs/implementation-plan.md`
- `docs/milestones/milestone-6-report-preview.md`
- `docs/milestones/README.md`

**Subtasks**

- [x] Run `npm test` and `npm run typecheck`.
- [x] Run M7 leakage scan: `rg -n "expo-sharing|Sharing\\.|ShareService" src` (no hits;
  `ReportPreview` is expected M6 work).
- [x] Set Milestone 6 status to `Complete` in `docs/implementation-plan.md`; check top-level M6
  tasks.
- [x] Align stale implementation-plan top-level task wording from "Compose the report (...)" to
  reflect the locked split: reducer composes `Report`; M6 maps to preview model and renders it
  (coordinates, not address).
- [x] Set board header `Milestone status` to `Complete`; mark this card `Complete`.
- [x] Update `docs/milestones/README.md` Milestone 6 row to `Complete`.
- [x] Record gate evidence and manual QA note on this card.
- [x] Do **not** start Milestone 7 in this task.

**Gate results**

- `npm test`: pass (9 suites, 103 tests; includes report preview model and UI tests).
- `npm run typecheck`: pass.
- M7 leakage scan: pass — no `expo-sharing`, `Sharing.`, or `ShareService` references under
  `src/` (`rg` exit 1 = no matches). `ReportPreview` / `reportView` are expected M6 artifacts.
- Manual live report preview on simulator/device: not run in this environment.

**Manual QA note**

Live simulator/device preview deferred in this environment; CLI gate passed.

When running locally:

1. `npx expo start`
2. Capture a photo, tap **Enrich report**, verify **Report Preview** shows the photo, captured
   timestamp, coordinates, weather condition, and temperature.
3. Simulate no network / weather failure, tap **Continue with partial report**, verify **Partial
   Report Preview**, reason copy, and `Unavailable` rows.
4. Tap **Retake** and verify the flow returns to capture.

**Acceptance criteria**

- All verification commands pass.
- Preview reflects `enrichmentUnavailableReason` in partial reports.
- Milestone 6 marked `Complete` only after M6.1–M6.3 pass.

**Verification commands**

```bash
npm test
npm run typecheck
rg -n "expo-sharing|Sharing\\.|ShareService" src
git status --short
```

**Commit guidance:** `docs: close milestone 6 report preview`

**Human decision gate:** None. Manual report preview on simulator/device deferred if environment
cannot run Expo; board notes CLI sanity check passed.

---
