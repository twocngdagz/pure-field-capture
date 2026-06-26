# Implementation Plan

Milestones are small and reviewable. Agents pick the **lowest open milestone** and work
**one task at a time**, updating the status marker when a task is done.

Status legend: `Not started` · `In progress` · `Complete`

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
- AGENTS.md / CLAUDE.md / GEMINI.md enforcement layer.
- `.cursor/rules/pure-field-capture.mdc`.
- `docs/`: assessment contract, this plan, decisions, architecture, testing strategy,
  AI workflow, demo script.
- README (fresh-checkout intent, Open-Meteo no-key note), `.gitignore`.
- Document: Open-Meteo needs no API key; do not add `.env` unless a key-based API is
  introduced; AGENTS.md forbids image picker as primary path.

**Acceptance criteria**
- All foundation files exist and are internally consistent.
- First commit established: `chore: establish assessment contract and agent workflow`.

**Demo notes:** Show the docs/agent contract as evidence of a controlled AI workflow.

---

## Milestone 2 — Expo TypeScript app scaffold — `Not started`

**Goal:** A running Expo + TypeScript app that builds cleanly from a fresh checkout.

**Tasks**
- Scaffold Expo (TypeScript template). Add `expo-camera`, `expo-location`,
  `expo-sharing` (and printing/file utilities as needed for the report artifact).
- Establish `src/` structure and a single placeholder screen.
- Configure test runner (Jest + React Native Testing Library).

**Acceptance criteria**
- `npm install` then the documented start command launches the app.
- Test command runs (even with a trivial passing test).
- README fresh-checkout steps verified.

**Test expectations:** One smoke test proving the test runner works.

**Demo notes:** Show the app launching on a simulator from a clean clone.

---

## Milestone 3 — Domain model, reducer, and tests — `Not started`

**Goal:** Pure, testable core of the capture workflow.

**Tasks**
- Define `captureTypes.ts`: capture state machine, actions, `AppError`, `Report`.
- Implement `captureReducer.ts` as a pure function.
- Unit-test all reducer transitions including failure transitions.

**Acceptance criteria**
- Reducer is pure (no side effects, no imports of services).
- Transitions cover: idle → capturing → captured → enriching → enriched/partial →
  sharing → shared, plus each `*_FAILED` path.

**Test expectations:** Reducer unit tests for every transition and error mapping.

---

## Milestone 4 — Native camera capture & permission handling — `Not started`

**Goal:** Real camera capture with a live preview.

**Tasks**
- `CameraService` wrapping `expo-camera` (`CameraView`, `takePictureAsync`).
- Capture screen showing an **actual camera preview**.
- Handle camera permission denied with a clear, recoverable message.

**Acceptance criteria**
- Uses `expo-camera` `CameraView`. **No** `expo-image-picker` as primary path.
- Shows a real camera preview.
- Camera permission denied is handled gracefully (`cameraPermissionDenied`).

**Test expectations:** ViewModel test with a fake `CameraService` for success and denied.

**Demo notes:** Show the live preview and the permission-denied path.

---

## Milestone 5 — Location capture & Open-Meteo enrichment — `Not started`

**Goal:** Attach current GPS location and weather to the capture.

**Tasks**
- `LocationService` (`expo-location`) for current coordinates.
- `WeatherService` calling **Open-Meteo** with the coordinates (no API key).
- Wire enrichment into the ViewModel; dispatch results into the reducer.

**Task 5.3 — Handle no-network state**
- *5.3.1 Normalize network failures:* catch failed fetch/network exceptions, map to
  `networkUnavailable`, never expose raw technical errors.
- *5.3.2 Offline/partial enrichment UI:* clear offline message; allow retry; allow
  continue with partial report.
- *5.3.3 Tests:* network failure returns a partial report; ViewModel shows a retryable
  offline state; captured photo URI is preserved.

**Acceptance criteria**
- Explicit no-network handling, distinct from generic API error where practical.
- Captured photo survives network/weather failure.
- Partial report is allowed.
- Location permission denied marks location & weather unavailable but still allows a report.

**Test expectations:** ViewModel tests with fake services for success, no-network,
weather failure, and location denied; error-mapping tests.

**Demo notes:** Toggle airplane mode to show the offline/partial path.

---

## Milestone 6 — Report preview — `Not started`

**Goal:** A clear preview of the captured report before sending.

**Tasks**
- Compose the report (photo, timestamp, location, weather or "unavailable").
- Render a preview screen with clearly labeled sections.

**Acceptance criteria**
- Preview shows photo + enrichment, including unavailable states without crashing.
- Report preview key sections have clear, readable labels.

**Test expectations:** Report composition logic unit-tested (full vs partial report).

---

## Milestone 7 — Native sharing — `Not started`

**Goal:** Send the capture via the native share sheet / intent.

**Tasks**
- `ShareService` wrapping native sharing (`expo-sharing` / printing to a shareable
  artifact as appropriate).
- Wire share action into the ViewModel.

**Acceptance criteria**
- Native share sheet opens with the report artifact.
- Share failure does not crash; preview stays available; retry allowed (`shareFailed`).

**Test expectations:** ViewModel test with a fake `ShareService` for success and failure.

**Demo notes:** Share to Mail/Messages from the share sheet.

---

## Milestone 8 — Accessibility pass — `Not started`

**Goal:** Keep the core field flow usable with assistive technologies.

**Tasks**
- Add `accessibilityRole="button"` and clear `accessibilityLabel` to Capture, Retry,
  Continue/partial, and Share controls.
- Make loading/error states readable text; do not convey status by color only.
- Label report preview key sections.

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
- Finalize README: fresh-checkout setup, Open-Meteo no-key note, native vs
  multiplatform decision, timebox strategy, AI workflow, no-network behavior,
  accessibility note.
- Finalize [`demo-script.md`](./demo-script.md).
- Verify fresh checkout end-to-end; clean up commit history.

**Acceptance criteria**
- Clean `git clone` → install → run works following the README only.
- Demo script covers happy path + every failure scenario.

**Demo notes:** This milestone is the dress rehearsal.
