# Milestone 3 — Domain model, reducer, and tests

**Project monitor:** [`implementation-plan.md`](../implementation-plan.md) · Milestone 3

**Milestone status:** `Not started` (set to `Complete` only in M3.7 after M3.1–M3.6 pass)

## Goal

Pure, testable core of the capture workflow: domain types, a pure reducer, and exhaustive reducer unit tests. No services, ViewModel, UI, or native work.

## Milestone acceptance criteria

- Reducer is pure (no side effects, no service imports).
- Transitions cover idle -> capturing -> captured -> enriching -> ready (full/partial) -> sharing -> shared, plus each failure path.
- `npm test` and `npm run typecheck` pass after each implementation card.

---

## Domain Notes

> Locked during M3 planning (2026-06-26). `captureTypes.ts` is the **canonical executable contract** for reducer actions and state. `docs/architecture.md` data-flow names (e.g. `PHOTO_CAPTURED`, `ENRICHED`) are illustrative narrative; M3.2 adds a tight "Canonical reducer actions" alignment section to architecture.md.

**AppError rule:** implement `docs/architecture.md` exactly. **No new `AppError` variants in code unless docs are amended first.**

### State

```ts
type CapturePhase =
  | "idle"
  | "capturing"
  | "captured"
  | "enriching"
  | "ready"
  | "sharing"
  | "shared"
  | "failed";

type CaptureState = {
  phase: CapturePhase;
  photoUri: string | null;
  capturedAt: string | null; // preserved from CAPTURE_SUCCEEDED until report is built
  report: Report | null;
  error: AppError | null;
};
```

`capturedAt` is held at top level (like `photoUri`) so it survives between capture success and report creation; `Report.capturedAt` is populated from it on `ENRICHMENT_SUCCEEDED` / `CONTINUE_WITH_PARTIAL_REPORT`.

### AppError (matches `docs/architecture.md`)

```ts
type AppError =
  | { type: "networkUnavailable"; message: string; retryable: true }
  | { type: "weatherFailed"; message: string; retryable: true }
  | { type: "locationPermissionDenied"; message: string; retryable: true }
  | { type: "cameraPermissionDenied"; message: string; retryable: true }
  | { type: "shareFailed"; message: string; retryable: boolean }
  | { type: "unknown"; message: string; retryable: boolean };
```

### Supporting + report types

```ts
type Coordinates = { latitude: number; longitude: number };
type WeatherSummary = { temperatureCelsius: number; condition: string };
type EnrichmentUnavailableReason =
  | "networkUnavailable"
  | "weatherFailed"
  | "locationPermissionDenied";

type Report = {
  photoUri: string;
  capturedAt: string;
  location?: Coordinates | null;
  weather?: WeatherSummary | null;
  isPartial: boolean;
  enrichmentUnavailableReason?: EnrichmentUnavailableReason;
  note?: string;
};
```

### Canonical action union (SCREAMING_SNAKE)

```ts
type CaptureAction =
  | { type: "START_CAPTURE" }
  | { type: "CAPTURE_SUCCEEDED"; photoUri: string; capturedAt: string }
  | {
      type: "CAPTURE_FAILED";
      error: Extract<AppError, { type: "cameraPermissionDenied" | "unknown" }>;
    }
  | { type: "START_ENRICHMENT" }
  | {
      type: "ENRICHMENT_SUCCEEDED";
      location: Coordinates;
      weather: WeatherSummary;
    }
  | {
      type: "ENRICHMENT_FAILED";
      error: Extract<
        AppError,
        { type: "networkUnavailable" | "weatherFailed" | "locationPermissionDenied" }
      >;
    }
  | { type: "CONTINUE_WITH_PARTIAL_REPORT" }
  | { type: "START_SHARING" }
  | { type: "SHARE_SUCCEEDED" }
  | {
      type: "SHARE_FAILED";
      error: Extract<AppError, { type: "shareFailed" | "unknown" }>;
    }
  | { type: "DISMISS_ERROR" }
  | { type: "RESET_WORKFLOW" };
```

Retry is a ViewModel intent (re-dispatch `START_ENRICHMENT` or `START_SHARING`), not a separate reducer action.

### Phase transition table

Valid phase -> transition; otherwise **return state unchanged** (no throw).

| Action | From | To | Notes |
| --- | --- | --- | --- |
| `START_CAPTURE` | idle, failed | capturing | clear error |
| `CAPTURE_SUCCEEDED` | capturing | captured | set photoUri + capturedAt |
| `CAPTURE_FAILED` | capturing | failed | set error; photoUri + capturedAt null |
| `START_ENRICHMENT` | captured | enriching | clear error |
| `ENRICHMENT_SUCCEEDED` | enriching | ready | full report from photoUri + capturedAt; isPartial false |
| `ENRICHMENT_FAILED` | enriching | captured | set error; preserve photoUri + capturedAt; report null |
| `CONTINUE_WITH_PARTIAL_REPORT` | captured (with enrichment error) | ready | partial report; isPartial true; enrichmentUnavailableReason = error.type |
| `START_SHARING` | ready | sharing | |
| `SHARE_SUCCEEDED` | sharing | shared | |
| `SHARE_FAILED` | sharing | ready | set error; preserve report |
| `DISMISS_ERROR` | any | same phase | error null; preserve photoUri/capturedAt/report |
| `RESET_WORKFLOW` | any | idle | all fields null |

**Phase semantics:**

- `captured`: photo exists, report not ready; enrichment may be retried or bypassed.
- `ready`: report exists (full or partial).
- `failed`: blocking capture failure (no photo) or unrecoverable state without a useful artifact.

**Illegal/out-of-order policy:** known action + wrong phase returns current state unchanged. Exhaustive `assertNever` in reducer `default` branch. Test a representative pair of illegal transitions (e.g. `ENRICHMENT_SUCCEEDED` from idle, `SHARE_SUCCEEDED` from ready), not every impossible one.

**Reducer default:** M3.5 replaced the temporary permissive default with exhaustive `assertNever(action)`; every `CaptureAction` is handled in the switch, so a future unhandled action type becomes a compile error.

### File locations

- `src/features/capture/captureTypes.ts`
- `src/features/capture/captureReducer.ts`
- `src/features/capture/__tests__/captureReducer.test.ts`

### Out of scope (Milestone 3 overall)

Camera/location/weather/share **service** implementations, ViewModel, UI, native config/permissions, `expo-sharing` usage. No new `AppError` variants without amending docs first.

---

## M3.1 — Create Milestone 3 board

**Status:** `Complete`

**Purpose:** Create the detailed task board and connect it to the project-level monitor.

**Files expected to change**

- `docs/milestones/README.md`
- `docs/milestones/milestone-3-domain-reducer.md`
- `docs/implementation-plan.md` (link only; keep status `Not started`)

**Subtasks**

- [x] Create `docs/milestones/milestone-3-domain-reducer.md` with 7 task cards (M3.1–M3.7).
- [x] Record Domain Notes: state, `AppError`, actions, transition table, illegal-transition policy.
- [x] Link Milestone 3 in `docs/implementation-plan.md` to this board.
- [x] Add Milestone 3 to `docs/milestones/README.md` Current boards table.
- [x] Keep Milestone 3 status as `Not started` until implementation begins.
- [x] Do not implement `captureTypes.ts`, `captureReducer.ts`, or tests in this task.

**Acceptance criteria**

- Milestone board exists with exactly 7 task cards (M3.1–M3.7).
- Implementation plan links to this board.
- Domain contract recorded on the board.
- No `src/features/capture` implementation files added.

**Verification commands**

```bash
git diff -- docs/implementation-plan.md docs/milestones
test -f docs/milestones/milestone-3-domain-reducer.md
grep -q "M3.7" docs/milestones/milestone-3-domain-reducer.md
test ! -f src/features/capture/captureTypes.ts
```

**Commit guidance:** `docs: add milestone 3 task board`

**Human decision gate:** None.

---

## M3.2 — Define capture domain types

**Status:** `Complete`

**Purpose:** Create the domain contract in TypeScript before reducer work.

**Files expected to change**

- `src/features/capture/captureTypes.ts`
- `docs/architecture.md` (tight "Canonical reducer actions" alignment only)
- `docs/milestones/milestone-3-domain-reducer.md` (card status)

**Subtasks**

- [x] Define `CapturePhase`, `CaptureState`, `AppError`, `Report`, `Coordinates`, `WeatherSummary`, `EnrichmentUnavailableReason`.
- [x] Define `CaptureAction` union per Domain Notes (SCREAMING_SNAKE).
- [x] Match `docs/architecture.md` for `AppError` and `Report` (including `enrichmentUnavailableReason`).
- [x] Add "Canonical reducer actions" section to `docs/architecture.md` listing exact action names from `captureTypes.ts`.
- [x] Do not implement reducer, ViewModel, services, or UI.

**Acceptance criteria**

- Types match Domain Notes and architecture contract.
- `networkUnavailable` distinct from `weatherFailed`.
- `CaptureState` includes `capturedAt: string | null`.
- `npm run typecheck` passes.

**Verification commands**

```bash
npm run typecheck
```

**Commit guidance:** `feat: add capture domain types`

**Human decision gate:** None.

---

## M3.3 — Reducer initial state + idle/capture transitions

**Status:** `Complete`

**Purpose:** First reducer slice with tests: initial state and capture phase.

**Files expected to change**

- `src/features/capture/captureReducer.ts`
- `src/features/capture/__tests__/captureReducer.test.ts`
- `docs/milestones/milestone-3-domain-reducer.md`

**Subtasks**

- [x] Export `initialCaptureState` and `captureReducer` (pure function).
- [x] Implement `START_CAPTURE`, `CAPTURE_SUCCEEDED`, `CAPTURE_FAILED`.
- [x] No service imports or side effects.
- [x] Tests: initial state (`capturedAt: null`), capture success stores `photoUri` + `capturedAt`, capture failure maps camera error and clears photo fields.

**Acceptance criteria**

- Reducer is pure.
- `CAPTURE_SUCCEEDED` sets phase `captured` with photoUri and capturedAt.
- `CAPTURE_FAILED` sets phase `failed` with scenario-specific error.
- `npm test` passes.

**Verification commands**

```bash
npm test
npm run typecheck
```

**Commit guidance:** `feat: add capture reducer idle and capture transitions`

**Human decision gate:** None.

---

## M3.4 — Enrichment transitions

**Status:** `Complete`

**Purpose:** Location/weather enrichment state behavior in the reducer.

**Files expected to change**

- `src/features/capture/captureReducer.ts`
- `src/features/capture/__tests__/captureReducer.test.ts`
- `docs/milestones/milestone-3-domain-reducer.md`

**Subtasks**

- [x] Implement `START_ENRICHMENT`, `ENRICHMENT_SUCCEEDED`, `ENRICHMENT_FAILED`, `CONTINUE_WITH_PARTIAL_REPORT`.
- [x] `ENRICHMENT_FAILED` returns to phase `captured` (not `failed`); preserves `photoUri` + `capturedAt`.
- [x] Partial report sets `isPartial: true` and `enrichmentUnavailableReason`.
- [x] `networkUnavailable` is its own error path (not generic weather failure).
- [x] No service imports.

**Acceptance criteria**

- Photo URI and capturedAt survive every enrichment failure.
- Full report on `ENRICHMENT_SUCCEEDED`; partial report on `CONTINUE_WITH_PARTIAL_REPORT`.
- No generic catch-all for scenario-specific enrichment errors.
- `npm test` passes.

**Verification commands**

```bash
npm test
npm run typecheck
```

**Commit guidance:** `feat: add capture reducer enrichment transitions`

**Human decision gate:** None.

---

## M3.5 — Share/reset transitions

**Status:** `Complete`

**Purpose:** Complete reducer lifecycle without implementing native sharing.

**Files expected to change**

- `src/features/capture/captureReducer.ts`
- `src/features/capture/__tests__/captureReducer.test.ts`
- `docs/milestones/milestone-3-domain-reducer.md`

**Subtasks**

- [x] Implement `START_SHARING`, `SHARE_SUCCEEDED`, `SHARE_FAILED`, `DISMISS_ERROR`, `RESET_WORKFLOW`.
- [x] `SHARE_FAILED` preserves report; `DISMISS_ERROR` clears error only.
- [x] `RESET_WORKFLOW` returns to initial state (all fields null).
- [x] Illegal known actions return unchanged state (test representative cases).
- [x] No `expo-sharing` or native calls.

**Acceptance criteria**

- Share transitions work on `ready`/`sharing` phases only.
- Reducer remains pure.
- `npm test` passes.

**Verification commands**

```bash
npm test
npm run typecheck
```

**Commit guidance:** `feat: add capture reducer share and reset transitions`

**Human decision gate:** None.

---

## M3.6 — Milestone 3 quality gate

**Status:** `Complete`

**Purpose:** Run all Milestone 3 checks before marking the milestone complete.

**Files expected to change**

- `docs/milestones/milestone-3-domain-reducer.md` (card status)

**Subtasks**

- [x] Run `npm test`.
- [x] Run `npm run typecheck`.
- [x] Confirm M2 smoke test (`src/app/__tests__/index.test.tsx`) still passes.
- [x] Confirm no M4+ feature work leaked (no CameraService, ViewModel, camera UI).
- [x] Confirm reducer has no service imports.

**Gate results**

- `npm test`: pass (2 suites, 39 tests; includes `src/app/__tests__/index.test.tsx` smoke test).
- `npm run typecheck`: pass.
- `captureReducer.ts` imports: only types from `./captureTypes`; no service or `expo-` imports (`rg` exit 1 = no matches = pass).
- M4+ leakage scan under `src/`: no `expo-camera`, `CameraView`, `takePictureAsync`, `expo-location`, `Location.`, `fetch(`, `open-meteo`/`Open-Meteo`, `expo-sharing`, or `Sharing.` (`rg` exit 1 = no matches = pass).
- `git status --short` before board edit: clean working tree.

**Acceptance criteria**

- All verification commands pass.
- Quality gate checklist complete.

**Verification commands**

```bash
npm test
npm run typecheck
rg -n "from ['\"]expo-|require\(['\"]expo-" src/features/capture/captureReducer.ts
rg -n "from ['\"].*services" src/features/capture/captureReducer.ts
rg -n "expo-camera|CameraView|takePictureAsync|expo-location|Location\\.|fetch\\(|open-meteo|Open-Meteo|expo-sharing|Sharing\\." src
git status --short
```

**Commit guidance:** `chore: verify milestone 3 domain reducer`

**Human decision gate:** None.

---

## M3.7 — Close Milestone 3

**Status:** `Not started`

**Purpose:** Update project monitors only after all Milestone 3 work is complete and verified.

**Files expected to change**

- `docs/implementation-plan.md`
- `docs/milestones/milestone-3-domain-reducer.md`

**Subtasks**

- [ ] Confirm M3.1 through M3.6 are all complete.
- [ ] Set Milestone 3 status to `Complete` in `docs/implementation-plan.md`.
- [ ] Check all three top-level Milestone 3 tasks in the implementation plan.
- [ ] Set board header `Milestone status` to `Complete`.
- [ ] Record known follow-up for M4.
- [ ] Do **not** start Milestone 4 in this task.

**Known follow-up for M4**

- Wire reducer into camera workflow via ViewModel (later milestone).
- Implement `CameraService` with `expo-camera`; keep camera side effects outside the reducer.

**Acceptance criteria**

- Milestone 3 marked `Complete` only after M3.1–M3.6 pass.
- Board and plan are consistent.

**Verification commands**

```bash
npm test
npm run typecheck
git status --short
```

**Commit guidance:** `docs: close milestone 3 domain reducer`

**Human decision gate:** None.
