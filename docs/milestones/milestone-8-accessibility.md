# Milestone 8 — Accessibility pass

**Project monitor:** [`implementation-plan.md`](../implementation-plan.md) · Milestone 8

**Milestone status:** `Not started`

## Goal

Keep the core capture -> enrich -> preview -> share flow usable with assistive technology.

## Milestone acceptance criteria

- Primary controls have `accessibilityRole="button"` and a clear `accessibilityLabel`.
- Loading/error states are readable text; status is never conveyed by color only.
- Report preview key sections have clear labels/headers.
- `npm test` and `npm run typecheck` pass after each implementation card.

---

## Accessibility Notes

> Planned during M8.1 (2026-06-26). D7 recorded in [`decisions.md`](../decisions.md).

- **D7 slice already delivered most of this.** The core flow already has roles, labels, and
  readable status/error text from earlier milestones. M8 is **audit + targeted fixes**, not a
  from-scratch accessibility implementation.
- **No workflow redesign.** Do not change reducer, services, ViewModel behavior, or visual
  layout beyond what a genuine accessibility gap requires.
- **No color-only status.** Disabled capture and sharing states use `accessibilityState` and
  readable text, not color alone.
- File locations: `src/features/capture/CaptureScreen.tsx`,
  `src/features/capture/ReportPreview.tsx`, and their `__tests__`.

### Out of scope (Milestone 8 overall)

- New screens, navigation changes, or visual redesign.
- Reducer, service, or ViewModel behavior changes unrelated to accessibility gaps.
- Live-region / announcement engine (defer unless the audit proves it necessary).
- Milestone 9 README/demo finalization.

---

## M8.1 — Create accessibility board

**Status:** `Complete`

**Purpose:** Create the board and connect monitors.

**Files expected to change**

- `docs/milestones/milestone-8-accessibility.md`
- `docs/implementation-plan.md` (link only; keep status `Not started`)
- `docs/milestones/README.md`

**Subtasks**

- [x] Create `docs/milestones/milestone-8-accessibility.md` with 3 task cards (M8.1–M8.3).
- [x] Record Accessibility Notes: D7 slice, audit + targeted fixes, no workflow redesign.
- [x] Link Milestone 8 in `docs/implementation-plan.md` to this board.
- [x] Add Milestone 8 to `docs/milestones/README.md` Current boards table (`Open`).
- [x] Keep Milestone 8 status as `Not started` until M8.3 closes the milestone.
- [x] Do not edit `src/` in this task.

**Acceptance criteria**

- Milestone board exists with exactly 3 task cards (M8.1–M8.3).
- Implementation plan links to this board.
- Board index lists Milestone 8 as `Open`.
- No `src/` changes.

**Verification commands**

```bash
git diff --stat
git status --short
test -f docs/milestones/milestone-8-accessibility.md
grep -q "M8.3" docs/milestones/milestone-8-accessibility.md
```

**Commit guidance:** `docs: add milestone 8 task board`

**Human decision gate:** None.

---

## M8.2 — Accessibility audit and targeted fixes

**Status:** `Complete`

**Purpose:** Verify the existing D7 accessibility slice across the implemented capture ->
enrich -> preview -> share flow, then apply only targeted fixes where the audit finds gaps.

**Files expected to change**

- `src/features/capture/__tests__/CaptureScreen.test.tsx`
- `src/features/capture/__tests__/ReportPreview.test.tsx`
- `docs/milestones/milestone-8-accessibility.md` (card status)

**Subtasks**

- [x] Inspect primary controls: Capture photo, Retry camera permission, Enrich report, Retry
  enrichment, Continue with partial report, Retake photo, Share report, Retry share, Dismiss.
- [x] Verify each has `accessibilityRole="button"`, a clear `accessibilityLabel`, and a
  disabled state where applicable.
- [x] Verify readable states: Preparing camera, Capturing, Adding location and weather,
  Sharing report, error messages, Report shared.
- [x] Verify preview semantics: report title header, section headers, captured-photo label,
  partial notice readable as text.
- [x] Apply only fixes found by the audit.

**Audit results**

- Primary controls already have role + labels.
- Loading/error/share states are readable text.
- Report preview title/sections/photo/partial notice are labeled/readable.
- No source accessibility fixes required.
- Added targeted regression assertions in component tests.
- Readable state audit used existing component coverage where states are observable
  without new async test scaffolding; transient states not worth new helpers
  (`Preparing camera...`, `Sharing report...`) were verified by existing functional
  tests / implementation review and recorded here as audit evidence.
- Capture disabled-state is implemented via `accessibilityState={{ disabled: !canCapture }}`;
  deeper disabled-path coverage deferred (mock fires `onCameraReady` immediately).

**Acceptance criteria**

- Existing accessible controls are verified, not rewritten.
- Any missing role/label/disabled-state/readable-text gap is fixed, with tests where
  practical.
- No workflow, reducer, service, or visual redesign changes.

**Test expectations**

- Update component tests only if a fix changes rendered accessibility props or labels.
- Otherwise record audit evidence on the board and run the gate.

**Verification commands**

```bash
npm test
npm run typecheck
```

**Commit guidance:** `test: assert accessibility semantics in capture flow` (use `fix:` if
the audit changes component code)

**Human decision gate:** None.

---

## M8.3 — Quality gate and close Milestone 8

**Status:** `Not started`

**Purpose:** Run the quality gate, align implementation-plan monitors, and close Milestone 8.

**Files expected to change**

- `docs/implementation-plan.md`
- `docs/milestones/milestone-8-accessibility.md`
- `docs/milestones/README.md`

**Subtasks**

- [ ] Run `npm test` and `npm run typecheck`.
- [ ] Set Milestone 8 status to `Complete` in `docs/implementation-plan.md`; check all M8
  task boxes.
- [ ] Align implementation-plan M8 task wording with what the audit verified or fixed.
- [ ] Set board header `Milestone status` to `Complete`; mark this card `Complete`.
- [ ] Update `docs/milestones/README.md` Milestone 8 row to `Complete`.
- [ ] Record gate evidence and a deferred manual screen-reader QA note on this card.
- [ ] Do **not** start Milestone 9 in this task.

**Acceptance criteria**

- All verification commands pass.
- Milestone 8 marked `Complete` only after M8.1–M8.2 pass.

**Verification commands**

```bash
npm test
npm run typecheck
git status --short
```

**Commit guidance:** `docs: close milestone 8 accessibility`

**Human decision gate:** None. Manual screen-reader QA deferred if the environment cannot
run Expo; board records the CLI gate.

---
