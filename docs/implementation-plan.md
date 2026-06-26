# Implementation Plan

Milestones are small and reviewable. Agents pick the **lowest open milestone** (status
not `Complete`), then **one unchecked task** (`- [ ]`) inside it.

**Status legend**
- Milestone: `Not started` · `In progress` · `Complete`
- Task: `- [ ]` open · `- [x]` done. Mark tasks `- [x]` as you finish them; set the
  milestone to `Complete` only when every task in it is checked.

Target directory shape (created incrementally, not all at once):

```
src/
  app/                      # screens / navigation
  features/capture/
    captureReducer.ts       # pure state transitions
    captureViewModel.ts     # async workflow, dispatches results
    captureTypes.ts         # state, actions, AppError, Report
    __tests__/
  services/
    CameraService.ts
    LocationService.ts
    WeatherService.ts
    ShareService.ts
  components/
  utils/
```

---

## Milestone 1 — Project foundation & AI workflow — `Complete`

**Goal:** Make the project safe for controlled AI-assisted implementation before any app
code exists.

**Tasks**
- [x] AGENTS.md / CLAUDE.md / GEMINI.md enforcement layer.
- [x] `.cursor/rules/pure-field-capture.mdc`.
- [x] `docs/`: assessment contract, this plan, decisions, architecture, testing strategy,
  AI workflow, demo script.
- [x] README (fresh-checkout intent, Open-Meteo no-key note), `.gitignore`.
- [x] Document: Open-Meteo needs no API key; do not add `.env` unless a key-based API is
  introduced; AGENTS.md forbids image picker as primary path.
- [x] Docs polish: README planned-vs-implemented wording; agent task-picking granularity;
  report `enrichmentUnavailableReason`; Milestone 2 typecheck criterion.

**Acceptance criteria**
- All foundation files exist and are internally consistent.
- First commit established: `chore: establish assessment contract and agent workflow`.

**Demo notes:** Show the docs/agent contract as evidence of a controlled AI workflow.

---

## Milestone 2 — Expo TypeScript app scaffold — `Complete`

**Detailed task board:** [`milestones/milestone-2-expo-scaffold.md`](./milestones/milestone-2-expo-scaffold.md)
(M2.1–M2.10). Do not mark this milestone `Complete` until M2.10 passes on that board.

**Goal:** A running Expo + TypeScript app that builds cleanly from a fresh checkout.

**Tasks**
- [x] Scaffold Expo (TypeScript template). Add `expo-camera`, `expo-location`,
  `expo-sharing` (and file utilities as needed for the share artifact — see D9).
- [x] Establish `src/` structure and a single placeholder screen.
- [x] Configure test runner (Jest + React Native Testing Library).
- [x] Add `npm run typecheck` (or equivalent `tsc --noEmit`) and wire it in package.json.

**Acceptance criteria**
- `npm install` then the documented start command launches the app.
- `npm test` runs (even with a trivial passing test).
- `npm run typecheck` passes with no errors.
- README fresh-checkout steps verified.

**Test expectations:** One smoke test proving the test runner works.

**Demo notes:** Show the app launching on a simulator from a clean clone.

---

## Milestone 3 — Domain model, reducer, and tests — `Complete`

**Detailed task board:** [`milestones/milestone-3-domain-reducer.md`](./milestones/milestone-3-domain-reducer.md)
(M3.1–M3.7). Do not mark this milestone `Complete` until M3.7 passes on that board.

**Goal:** Pure, testable core of the capture workflow.

**Tasks**
- [x] Define `captureTypes.ts`: capture state machine, actions, `AppError`, `Report`
  (including `enrichmentUnavailableReason`).
- [x] Implement `captureReducer.ts` as a pure function.
- [x] Unit-test all reducer transitions including failure transitions.

**Acceptance criteria**
- Reducer is pure (no side effects, no imports of services).
- Transitions cover: idle → capturing → captured → enriching → enriched/partial →
  sharing → shared, plus each `*_FAILED` path.

**Test expectations:** Reducer unit tests for every transition and error mapping.

---

## Milestone 4 — Native camera capture & permission handling — `Complete`

**Detailed task board:** [`milestones/milestone-4-camera-capture.md`](./milestones/milestone-4-camera-capture.md)
(M4.1–M4.5). Do not mark this milestone `Complete` until M4.5 passes on that board.

**Goal:** Real camera capture with a live preview.

**Tasks**
- [x] Camera permission service (`expo-camera`) and UI-owned `CameraView` / `takePictureAsync` capture adapter.
- [x] Capture screen showing an **actual camera preview**.
- [x] Handle camera permission denied with a clear, recoverable message.

**Acceptance criteria**
- Uses `expo-camera` `CameraView`. **No** `expo-image-picker` as primary path.
- Shows a real camera preview.
- Camera permission denied is handled gracefully (`cameraPermissionDenied`).

**Test expectations:** ViewModel test with a fake `CameraService` for success and denied.

**Demo notes:** Show the live preview and the permission-denied path.

---

## Milestone 5 — Location capture & Open-Meteo enrichment — `Complete`

**Detailed task board:** [`milestones/milestone-5-location-weather.md`](./milestones/milestone-5-location-weather.md)
(M5.1–M5.4). Do not mark this milestone `Complete` until M5.4 passes on that board.

**Goal:** Attach current GPS location and weather to the capture.

**Tasks**
- [x] `LocationService` (`expo-location`) for current coordinates (no reverse geocoding).
- [x] `WeatherService` calling **Open-Meteo** with the coordinates (no API key).
- [x] Wire enrichment into the ViewModel; dispatch results into the reducer.

**5.3 — Handle no-network state**

- [x] 5.3.1 Normalize network failures: catch failed fetch/network exceptions, map to
  `networkUnavailable`, never expose raw technical errors.
- [x] 5.3.2 Offline/partial enrichment UI: clear offline message; allow retry; allow
  continue with partial report.
- [x] 5.3.3 Tests: network failure returns a partial report; ViewModel shows a retryable
  offline state; captured photo URI is preserved.

**Acceptance criteria**
- Explicit no-network handling, distinct from generic API error where practical.
- Captured photo survives network/weather failure.
- Partial report is allowed; `enrichmentUnavailableReason` set on partial reports.
- Location permission denied marks location & weather unavailable but still allows a report.

**Test expectations:** ViewModel tests with fake services for success, no-network,
weather failure, and location denied; error-mapping tests.

**Demo notes:** Toggle airplane mode to show the offline/partial path.

---

## Milestone 6 — Report preview — `Not started`

**Detailed task board:** [`milestones/milestone-6-report-preview.md`](./milestones/milestone-6-report-preview.md)
(M6.1–M6.4). Do not mark this milestone `Complete` until M6.4 passes on that board.

**Goal:** A clear preview of the captured report before sending.

**Tasks**
- [ ] Compose the report (photo, timestamp, location, weather or unavailable reason).
- [ ] Render a preview screen with clearly labeled sections.

**Acceptance criteria**
- Preview shows photo + enrichment, including unavailable states without crashing.
- Preview copy reflects `enrichmentUnavailableReason` (not just "weather missing").
- Report preview key sections have clear, readable labels.

**Test expectations:** Report composition logic unit-tested (full vs partial report).

---

## Milestone 7 — Native sharing — `Not started`

**Goal:** Send the capture via the native share sheet / intent.

**Tasks**
- [ ] **Lock share artifact in [`decisions.md`](./decisions.md) (D9)** before implementing
  `ShareService` — plain text, image, generated file, or simple report document.
- [ ] `ShareService` implementing the locked D9 artifact via native sharing.
- [ ] Wire share action into the ViewModel.

**Acceptance criteria**
- Native share sheet opens with the report artifact defined in D9.
- Share failure does not crash; preview stays available; retry allowed (`shareFailed`).

**Test expectations:** ViewModel test with a fake `ShareService` for success and failure.

**Demo notes:** Share to Mail/Messages from the share sheet.

---

## Milestone 8 — Accessibility pass — `Not started`

**Goal:** Keep the core field flow usable with assistive technologies.

**Tasks**
- [ ] Add `accessibilityRole="button"` and clear `accessibilityLabel` to Capture, Retry,
  Continue/partial, and Share controls.
- [ ] Make loading/error states readable text; do not convey status by color only.
- [ ] Label report preview key sections.

**Acceptance criteria**
- Primary buttons have role + clear label.
- Error and loading states are readable.
- Report preview key sections have clear labels.

**Test expectations:** Where practical, assert accessibility labels/roles in component tests.

**Demo notes:** Mention this is a field workflow that should remain usable with a screen reader.

---

## Milestone 9 — README, demo script & final review — `Not started`

**Goal:** Submission-ready repo.

**Tasks**
- [ ] Finalize README: fresh-checkout setup, Open-Meteo no-key note, native vs
  multiplatform decision, timebox strategy, AI workflow, no-network behavior,
  accessibility note.
- [ ] Finalize [`demo-script.md`](./demo-script.md).
- [ ] Verify fresh checkout end-to-end; clean up commit history.

**Acceptance criteria**
- Clean `git clone` → install → run works following the README only.
- Demo script covers happy path + every failure scenario.

**Demo notes:** This milestone is the dress rehearsal.
