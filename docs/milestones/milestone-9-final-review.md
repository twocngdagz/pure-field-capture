# Milestone 9 — README, demo script & final review

**Project monitor:** [`implementation-plan.md`](../implementation-plan.md) · Milestone 9

**Milestone status:** `Not started`

## Goal

Submission-ready repo: a reviewer can clone, install, run, and demo from the docs alone.

## Milestone acceptance criteria

- Clean `git clone` -> `npm install` -> `npx expo start` works following the README only.
- Demo script covers the happy path + every failure scenario with real UI labels.
- `npm test` and `npm run typecheck` pass.
- Hard rules satisfied: no `.env`/`.env.example`; `expo-camera` is the primary capture path.

---

## Final Review Notes

> Planned during M9.1 (2026-06-27).

- **M9 is finalize + verify**, not new features. No behavior, reducer, or service changes.
- Docs already largely exist (README, `demo-script.md`); M9.2 aligns them to the implemented
  flow.
- **No commit-history rewrite by default.** Any rewrite is a separate human-approved
  operation.
- Device-specific manual QA (camera, location, native share sheet, VoiceOver/TalkBack) is
  recorded as a deferred checklist, not blocking.

### Out of scope (Milestone 9 overall)

- New features, screens, backend, auth, or database.
- Mobile CI.
- Commit-history rewrite (unless human-approved).
- Milestone-8-style `src/` changes.

---

## M9.1 — Create final review board

**Status:** `Complete`

**Purpose:** Create the board and connect monitors.

**Files expected to change**

- `docs/milestones/milestone-9-final-review.md`
- `docs/implementation-plan.md` (link only; keep status `Not started`)
- `docs/milestones/README.md`

**Subtasks**

- [x] Create `docs/milestones/milestone-9-final-review.md` with 3 task cards (M9.1–M9.3).
- [x] Record Final Review Notes: finalize + verify, no history rewrite by default.
- [x] Link Milestone 9 in `docs/implementation-plan.md` to this board.
- [x] Add Milestone 9 to `docs/milestones/README.md` Current boards table (`Open`).
- [x] Keep Milestone 9 status as `Not started` until M9.3 closes the milestone.
- [x] Do not edit `src/` in this task.

**Acceptance criteria**

- Milestone board exists with exactly 3 task cards (M9.1–M9.3).
- Implementation plan links to this board.
- Board index lists Milestone 9 as `Open`.
- No `src/` changes.

**Verification commands**

```bash
git diff --stat
git status --short
test -f docs/milestones/milestone-9-final-review.md
grep -q "M9.3" docs/milestones/milestone-9-final-review.md
```

**Commit guidance:** `docs: add milestone 9 task board`

**Human decision gate:** None.

---

## M9.2 — Final docs and demo

**Status:** `Not started`

**Purpose:** Make the README and demo script accurate and submission-ready for the reviewer.

**Files expected to change**

- `README.md`
- `docs/demo-script.md`
- `docs/milestones/milestone-9-final-review.md` (card status)

**Subtasks (README)**

- [ ] Update the project-status blockquote (under the intro) to the final wording:
  > Core capture -> enrich -> preview -> share flow is implemented, tested, and documented
  > for take-home review. Remaining manual checks are device-specific camera, location,
  > share-sheet, and screen-reader QA.
- [ ] Timebox strategy: change `capture -> enrich -> share` to
  `capture -> enrich -> preview -> share`.
- [ ] Retitle `Failure handling (planned)` -> `Failure handling`; convert "will handle" to
  present tense.
- [ ] Add a short **Architecture** section (after Stack or Fresh-checkout) using D4
  vocabulary and the implemented layers:
  - `src/app/index.tsx` renders `CaptureScreen`.
  - `CaptureScreen` owns the `CameraView` ref, preview state, and UI branches.
  - `useCaptureViewModel` orchestrates capture, enrichment, and sharing actions.
  - `captureReducer` owns workflow transitions and preserves the report through recoverable
    failures.
  - Services wrap native/network boundaries: camera permission, location, weather, sharing.
  - Link to [`docs/architecture.md`](./docs/architecture.md) for detail (root-relative in
    README).
- [ ] AI-assisted workflow: change "is being built" to "was/has been built".
- [ ] Do not overwork Weather provider / Stack / Fresh-checkout / Accessibility /
  Documentation (already accurate); fix only broken links.

**Subtasks (demo-script)**

- [ ] Use real UI labels: `Capture photo`, `Enrich report`, `Share report`, `Retry
  enrichment`, `Continue with partial report`, `Retry share`, `Retake`.
- [ ] Reflect real screens/states: camera preview, `Photo captured`, `Adding location and
  weather...`, `Report Preview`, `Partial Report Preview`, `Sharing report...`, `Report
  shared`.
- [ ] Fix the happy path to show the explicit `Enrich report` step (capture -> Enrich
  report -> preview -> Share report).
- [ ] Keep the existing failure-scenario sections (no-network/partial, share-failure retry,
  accessibility note); mark manual/device-dependent parts honestly (share sheet,
  VoiceOver/TalkBack, real permissions).
- [ ] Keep it a checklist with talking points, not a screenplay.

**Acceptance criteria**

- README is accurate and submission-ready.
- Demo script can be run live without surprises.
- No invented features or vocabulary.

**Verification commands**

```bash
npm test
npm run typecheck
```

**Commit guidance:** `docs: finalize README and demo script`

**Human decision gate:** None.

---

## M9.3 — Final gate and close project

**Status:** `Not started`

**Purpose:** Run the final quality gate, confirm hard rules, review history, and close
Milestone 9.

**Files expected to change**

- `docs/implementation-plan.md`
- `docs/milestones/milestone-9-final-review.md`
- `docs/milestones/README.md`

**Subtasks**

- [ ] Run `npm test` and `npm run typecheck`.
- [ ] Confirm hard rules: no `.env`/`.env.example`; `expo-camera`/`CameraView` is the primary
  capture path (no `expo-image-picker` dependency/usage).
- [ ] Review commit history for clarity; do not squash/rebase unless explicitly approved.
- [ ] Set Milestone 9 status to `Complete` in `docs/implementation-plan.md`; check all M9
  task boxes.
- [ ] Set board header `Milestone status` to `Complete`; mark this card `Complete`.
- [ ] Update `docs/milestones/README.md` Milestone 9 row to `Complete`.
- [ ] Record final gate evidence + the deferred device-QA checklist on this card.

**Acceptance criteria**

- All verification commands pass.
- Hard rules confirmed.
- Commit history reviewed (any rewrite is a separate human-approved operation).
- Milestone 9 marked `Complete` only after M9.1–M9.2 pass.

**Verification commands**

```bash
npm test
npm run typecheck
git status --short
git log --oneline
```

**Commit guidance:** `docs: close milestone 9 final review`

**Human decision gate:** None. Live fresh-checkout run and device QA deferred if the
environment cannot run Expo; board records the CLI gate.

---
