# Milestone 10 — Reverse-geocoded address preview

**Project monitor:** [`implementation-plan.md`](../implementation-plan.md) · Milestone 10

**Milestone status:** `Complete`

## Goal

Add a best-effort, human-readable address to successful location enrichment while preserving
coordinates (canonical), weather, partial-report behavior, and no-network handling.

## Milestone acceptance criteria

- Successful enrichment may include `address` on the report when reverse geocoding succeeds.
- Coordinates remain the canonical captured location; address is best-effort display metadata.
- Reverse-geocoding failure or empty result yields `address: null` and does NOT, by itself,
  create a partial report.
- Preview shows `Address` (or `Unavailable`) and `Coordinates` rows in the Location section.
- No new libraries, API keys, or `.env` files.
- `npm test` and `npm run typecheck` pass after M10.2.

---

## Reverse Geocoding Notes

> Planned during M10.1 (2026-06-27). Decision D11 recorded in [`decisions.md`](../decisions.md).

- **Use `expo-location` only.** `Location.reverseGeocodeAsync({ latitude, longitude })` after
  foreground permission is granted and coordinates are obtained.
- **Non-fatal geocoding.** `getAddressForCoordinates` runs in its own try/catch; empty or
  thrown geocode yields `address: null` while `ok: true` with coordinates.
- **Formatter priority:** non-empty `formattedAddress` wins; else compose from street line
  (`streetNumber` + `street`, or `street`, or `name`), locality (`city` / `district` /
  `subregion`), region + `postalCode`, `country`; trim/drop empties; de-dupe adjacent;
  `null` if nothing usable.
- **Preview format:** two Location rows — `Address` first (`report.address ?? "Unavailable"`),
  then `Coordinates` (existing formatter).
- **No new `AppError`.** Address failure is not user-visible as its own error state.

### Out of scope (Milestone 10 overall)

- New libraries beyond existing `expo-location`.
- API keys, `.env`, backend geocoding services.
- Replacing coordinates with address as the canonical location value.
- Partial report solely because reverse geocoding failed.

---

## M10.1 — Register reverse-geocoding enhancement

**Status:** `Complete`

**Purpose:** Register Milestone 10, record decision D11, and connect monitors. No `src/`
changes.

**Files expected to change**

- `docs/milestones/milestone-10-reverse-geocoding.md`
- `docs/decisions.md` (D11)
- `docs/implementation-plan.md`
- `docs/milestones/README.md`

**Subtasks**

- [x] Create `docs/milestones/milestone-10-reverse-geocoding.md` with 2 task cards (M10.1–M10.2).
- [x] Record Reverse Geocoding Notes and locked implementation decisions for M10.2.
- [x] Add decision `D11 — Best-effort reverse-geocoded address` to `docs/decisions.md`.
- [x] Link Milestone 10 in `docs/implementation-plan.md` to this board.
- [x] Add Milestone 10 to `docs/milestones/README.md` Current boards table (`Open`).
- [x] Add Milestone 6 historical note: coordinates-only shipped in M6; address tracked in M10.
- [x] Do not edit `src/` in this task.

**Acceptance criteria**

- Milestone board exists with exactly 2 task cards (M10.1–M10.2).
- D11 is recorded in `docs/decisions.md`.
- Implementation plan links to this board; Milestone 10 is `In progress`.
- Board index lists Milestone 10 as `Open`.
- No `src/` changes.

**Verification commands**

```bash
git diff --stat
git status --short
test -f docs/milestones/milestone-10-reverse-geocoding.md
grep -q "M10.2" docs/milestones/milestone-10-reverse-geocoding.md
grep -q "D11" docs/decisions.md
```

**Commit guidance:** `docs: register reverse-geocoding enhancement (M10.1)`

**Human decision gate:** None.

---

## M10.2 — Implement best-effort address preview

**Status:** `Complete`

**Purpose:** Single vertical slice — reverse geocode in `LocationService`, wire address
through domain/ViewModel/reducer, show Address + Coordinates in preview, update tests, close
Milestone 10.

**Files expected to change**

- `src/services/LocationService.ts`
- `src/services/FakeLocationService.ts`
- `src/services/__tests__/LocationService.test.ts`
- `src/features/capture/captureTypes.ts`
- `src/features/capture/captureReducer.ts`
- `src/features/capture/CaptureViewModel.ts`
- `src/features/capture/reportView.ts`
- `src/features/capture/__tests__/captureReducer.test.ts`
- `src/features/capture/__tests__/CaptureViewModel.test.ts`
- `src/features/capture/__tests__/reportView.test.ts`
- `src/features/capture/__tests__/ReportPreview.test.tsx`
- `src/features/capture/__tests__/reportPdf.test.ts` (PDF HTML uses `buildReportPreviewModel`; address rows must appear in generated PDF)
- `docs/architecture.md` (report model `address?: string | null`; `LocationService` row)
- `docs/milestones/milestone-10-reverse-geocoding.md` (card status)
- `docs/implementation-plan.md` (close Milestone 10)
- `docs/milestones/README.md` (Milestone 10 row `Complete`)
- `README.md` / `docs/demo-script.md` only if the demo will mention address display

**Subtasks**

- [x] **LocationService** (`src/services/LocationService.ts`): extend `LocationResult` success
  to `{ ok: true; coordinates; address: string | null }`. Add private `getAddressForCoordinates`
  with its own try/catch calling `Location.reverseGeocodeAsync` -> `formatAddress(results[0])`,
  returning `null` on empty/throw so coordinates never fail. Add `formatAddress` helper (priority:
  non-empty `formattedAddress` wins; else compose street line, locality, region/postalCode,
  country; trim/drop empties; de-dupe adjacent; `null` if nothing usable).
- [x] **Fakes** (`src/services/FakeLocationService.ts`): default
  `{ ok: true, coordinates, address: "1 Market St, San Francisco" }`.
- [x] **Domain / ViewModel / reducer**: add `address?: string | null` to `Report` and
  `ENRICHMENT_SUCCEEDED` payload in `src/features/capture/captureTypes.ts`; ViewModel `enrich`
  dispatches `address: location.address`; reducer `ENRICHMENT_SUCCEEDED` writes
  `address: action.address ?? null`; `CONTINUE_WITH_PARTIAL_REPORT` sets `address: null`. No new
  `AppError`.
- [x] **Preview** (`src/features/capture/reportView.ts`): Location section renders two rows —
  `Address`: `report.address ?? "Unavailable"` (first), then existing `Coordinates`.
- [x] **Tests**: update `LocationService.test.ts` (new `address` field; parts compose,
  `formattedAddress` wins, empty -> `null`, geocode throws -> `address: null` with `ok: true`,
  permission denied still `locationPermissionDenied`), reducer, ViewModel,
  `reportView.test.ts`, `ReportPreview.test.tsx`, and `reportPdf.test.ts` (shared PDF uses
  `buildReportPreviewModel` via `reportPdf.ts`; assert Address row appears in HTML when
  `report.address` is set).
- [x] Update `docs/architecture.md` report model and `LocationService` row.
- [x] Run `npm test` and `npm run typecheck`.
- [x] Set Milestone 10 status to `Complete` in `docs/implementation-plan.md`; mark this card
  `Complete`.

**Acceptance criteria**

- Address appears on full reports when geocoding succeeds; `Unavailable` when `address` is null.
- Coordinates always shown when location enrichment succeeded.
- Partial reports unchanged (location unavailable; `address: null`).
- Reverse-geocode failure does not fail enrichment or create a partial report by itself.
- All verification commands pass.

**Verification commands**

```bash
npm test
npm run typecheck
git status --short
```

**Commit guidance:** `feat: add best-effort reverse-geocoded address preview`

**Human decision gate:** None. OS geocoder variance is a deferred manual check on device/simulator.

---
