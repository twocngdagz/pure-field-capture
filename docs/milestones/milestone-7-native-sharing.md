# Milestone 7 — Native sharing

**Project monitor:** [`implementation-plan.md`](../implementation-plan.md) · Milestone 7

**Milestone status:** `Complete`

## Goal

Send the captured photo via the native share sheet. Share failure does not crash; the report
preview stays available with retry.

> **Superseded by M7.C1:** The original M7 goal shipped image-only sharing (`report.photoUri`).
> M7.C1 corrects this to a generated PDF report containing photo + enrichment data.

## Milestone acceptance criteria

- Native share sheet opens with the D9 image artifact (`report.photoUri`).
- Share failure maps to `shareFailed`; preview remains available; retry allowed.
- `npm test` and `npm run typecheck` pass after each implementation card.

> **Superseded by M7.C1:** Current behavior shares a generated PDF report (see D9 and M7.C1).

---

## Native Sharing Notes

> Locked during M7 planning (2026-06-26). D9 recorded in [`decisions.md`](../decisions.md) in M7.1.
> **Superseded by M7.C1** for share artifact behavior; historical notes below describe the original image-only implementation.

- **D9 artifact is image-only via `expo-sharing`.** `ShareService` calls
  `Sharing.shareAsync(report.photoUri, options)` — the captured image file is the guaranteed
  share artifact.
- **No report text body in M7.** `expo-sharing.shareAsync` accepts a local file URL plus
  options (`UTI` iOS, `dialogTitle` Android/Web, `mimeType` Android) but has **no message
  field**. Text-bearing report sharing is deferred (e.g. `Share.share`, generated `.txt`/PDF).
- **Cancellation semantics:** share-sheet dismissal is not distinguishable through
  `shareAsync`; a resolved promise is treated as `SHARE_SUCCEEDED`. Only unavailable sharing
  or a rejected/thrown `shareAsync` maps to `shareFailed`.
- **`ShareService` Result shape** (mirrors `WeatherService`):

```ts
export type ShareResult =
  | { ok: true }
  | { ok: false; error: Extract<AppError, { type: "shareFailed" }> };

export type ShareService = { share: (report: Report) => Promise<ShareResult> };
```

- Empty `report.photoUri` → `shareFailed`. `Sharing.isAvailableAsync()` false → `shareFailed`.
- Recommended `shareAsync` options: `dialogTitle: "Share field report"`, `mimeType: "image/jpeg"`,
  `UTI: "public.jpeg"`.
- **Share UI split:** `ReportPreview` owns **Share report** + **Retake** buttons (`onShare`,
  `isSharing`). `CaptureScreen` owns phase banners (`sharing`, `shared`, `shareFailed` + Retry share).
- Preview stays mounted across `ready` / `sharing` / `shared` when `report !== null`.
- File locations: `src/services/ShareService.ts`, `src/services/FakeShareService.ts`,
  `src/features/capture/CaptureViewModel.ts`, `src/features/capture/ReportPreview.tsx`,
  `src/features/capture/CaptureScreen.tsx`.

### Out of scope (Milestone 7 overall)

- Report text/message body alongside the image.
- Generated report documents (PDF, HTML, `.txt`).
- Multi-file sharing.
- Milestone 8 accessibility pass (M7 lays groundwork with labeled Share/Retry controls).

---

## M7.1 — Create M7 control docs + lock D9

**Status:** `Complete`

**Purpose:** Create the detailed task board, lock D9 in `decisions.md`, and connect monitors.

**Files expected to change**

- `docs/decisions.md` (D9 → Accepted)
- `docs/milestones/README.md`
- `docs/milestones/milestone-7-native-sharing.md`
- `docs/implementation-plan.md` (link only; keep status `Not started`)

**Subtasks**

- [x] Lock D9 share artifact in `docs/decisions.md` (image-only via `expo-sharing.shareAsync`).
- [x] Create `docs/milestones/milestone-7-native-sharing.md` with 4 task cards (M7.1–M7.4).
- [x] Record Native Sharing Notes: image-only, no text body, cancellation resolves as success,
  `ShareService` Result shape, UI split between `ReportPreview` and `CaptureScreen`.
- [x] Link Milestone 7 in `docs/implementation-plan.md` to this board.
- [x] Add Milestone 7 to `docs/milestones/README.md` Current boards table (`Open`).
- [x] Keep Milestone 7 status as `Not started` until implementation begins.
- [x] Do not edit `src/` or implement sharing runtime code in this task.

**Acceptance criteria**

- Milestone board exists with exactly 4 task cards (M7.1–M7.4).
- D9 is Accepted in `decisions.md` before M7.2.
- Implementation plan links to this board.
- No `src/` changes.

**Verification commands**

```bash
git diff --stat
git status --short
test -f docs/milestones/milestone-7-native-sharing.md
grep -q "M7.4" docs/milestones/milestone-7-native-sharing.md
grep -q "Accepted" docs/decisions.md
```

**Commit guidance:** `docs: add milestone 7 board and lock D9 share artifact`

**Human decision gate:** None.

---

## M7.2 — Implement ShareService

**Status:** `Complete`

**Purpose:** Wrap `expo-sharing` to share the D9 image artifact with Result-style errors. No
ViewModel or UI.

**Files expected to change**

- `src/services/ShareService.ts`
- `src/services/FakeShareService.ts`
- `src/services/__tests__/ShareService.test.ts`
- `docs/milestones/milestone-7-native-sharing.md` (card status)

**Subtasks**

- [x] Verify D9 is Accepted in `docs/decisions.md` before implementing.
- [x] Implement `ShareService.share(report)` — empty `photoUri` → `shareFailed`;
  `Sharing.isAvailableAsync()` false → `shareFailed`; `shareAsync` resolves → `{ ok: true }`;
  throws → `shareFailed` (`retryable: true`).
- [x] Use `Sharing.shareAsync(report.photoUri, { dialogTitle: "Share field report", mimeType: "image/jpeg", UTI: "public.jpeg" })`.
- [x] Do **not** attempt a report text/message body (`shareAsync` has no message field).
- [x] `createFakeShareService(result?)` with `shareCount()` and `lastReport()`.
- [x] Unit tests: unavailable → `shareFailed`; throws → `shareFailed`; resolves → `ok`.
- [x] No ViewModel, UI, or reducer changes.

**Acceptance criteria**

- Service bridges to native share sheet for the image file.
- Failures never throw to callers; mapped to `shareFailed`.
- Share-sheet cancellation is not tested as failure (API resolves on dismiss).

**Verification commands**

```bash
npm test
npm run typecheck
```

**Commit guidance:** `feat: add ShareService for native image sharing`

**Human decision gate:** None.

---

## M7.3 — Wire ViewModel & Share UI

**Status:** `Complete`

**Purpose:** Connect share action to preview and test success/failure paths.

**Files expected to change**

- `src/features/capture/CaptureViewModel.ts`
- `src/features/capture/__tests__/CaptureViewModel.test.ts`
- `src/features/capture/ReportPreview.tsx`
- `src/features/capture/__tests__/ReportPreview.test.tsx`
- `src/features/capture/CaptureScreen.tsx`
- `src/features/capture/__tests__/CaptureScreen.test.tsx`
- `docs/milestones/milestone-7-native-sharing.md` (card status)

**Subtasks**

- [x] `CaptureViewModel`: optional `shareService` dep + `share()` — `START_SHARING` → service →
  `SHARE_SUCCEEDED` / `SHARE_FAILED`.
- [x] `ReportPreview`: add `onShare` + `isSharing?`; **Share report** button (disabled while
  `isSharing`) beside Retake; `accessibilityLabel` on Share.
- [x] `CaptureScreen`: render `ReportPreview` when `report !== null` and
  `phase` is `ready`, `sharing`, or `shared`; wire default `createShareService()`.
- [x] `CaptureScreen` banners: `sharing` → "Sharing report..."; `shared` → "Report shared";
  `ready` + `error.type === "shareFailed"` → error message + **Retry share** (`viewModel.share`).
- [x] `CaptureViewModel.test.ts`: fake `{ ok: true }` → `SHARE_SUCCEEDED`; fake
  `{ ok: false, shareFailed }` → `SHARE_FAILED` (no cancellation-specific test).
- [x] `ReportPreview.test.tsx` + `CaptureScreen.test.tsx`: share button, sharing status, shared,
  retry share; preview persists on share failure.
- [x] No sharing UI beyond Share + Retry share.

**Acceptance criteria**

- ViewModel tracks `sharing` / `shared` / `ready` + `shareFailed` correctly.
- UI allows infinite retries without losing the underlying report on share failure.
- Preview stays visible during and after sharing.

**Verification commands**

```bash
npm test
npm run typecheck
```

**Commit guidance:** `feat: wire native share into capture flow`

**Human decision gate:** None. Manual share-sheet verification deferred if environment cannot
run Expo; component tests pass.

---

## M7.4 — Quality Gate & Close Milestone 7

**Status:** `Complete`

**Purpose:** Run quality gate, align implementation-plan monitors, and close Milestone 7.

**Files expected to change**

- `docs/implementation-plan.md`
- `docs/milestones/milestone-7-native-sharing.md`
- `docs/milestones/README.md`
- `README.md`

**Subtasks**

- [x] Run `npm test` and `npm run typecheck`.
- [x] Set Milestone 7 status to `Complete` in `docs/implementation-plan.md`; check all M7
  task boxes (including D9).
- [x] Align implementation-plan M7 task wording with accepted D9: image-only via
  `expo-sharing`; text-bearing artifacts deferred.
- [x] Set board header `Milestone status` to `Complete`; mark this card `Complete`.
- [x] Update `docs/milestones/README.md` Milestone 7 row to `Complete`.
- [x] Record gate evidence and manual QA note on this card.
- [x] Do **not** start Milestone 8 in this task.

**Gate results**

- `npm test`: 116 passing / 10 suites.
- `npm run typecheck`: clean.
- Manual share-sheet QA: not run in this environment; deferred checklist recorded.

**Manual QA note**

Live share-sheet QA deferred in this environment; CLI gate passed.

When running locally:

1. `npx expo start`
2. Capture a photo and complete enrichment to reach **Report Preview**.
3. Tap **Share report**.
4. Verify the native share sheet opens.
5. Share to Mail or Messages and confirm the captured image is attached.
6. Dismiss/cancel the share sheet and confirm the app treats it as completed/returned without crashing.
7. Force sharing unavailable/failure if possible and confirm the preview remains visible with **Retry share**.

**Acceptance criteria**

- All verification commands pass.
- Milestone 7 marked `Complete` only after M7.1–M7.3 pass.

**Verification commands**

```bash
npm test
npm run typecheck
git status --short
```

**Commit guidance:** `docs: close milestone 7 native sharing`

**Human decision gate:** None. Manual share-sheet verification deferred if environment cannot
run Expo; board notes CLI sanity check passed.

---

## M7.C1 — Corrective: share generated PDF report

**Status:** `Complete`

**Reason:** User-approved correction after M7 completion. The original D9 image-only artifact
shared the photo but dropped enrichment data, under-delivering on the capture → enrich → send
requirement.

**Files expected to change**

- `package.json` / `package-lock.json` (`expo-print`, `expo-file-system`)
- `src/features/capture/reportPdf.ts`
- `src/features/capture/__tests__/reportPdf.test.ts`
- `src/services/ShareService.ts`
- `src/services/__tests__/ShareService.test.ts`
- `docs/decisions.md` (D9)
- `docs/milestones/milestone-7-native-sharing.md` (this card)
- `docs/milestones/milestone-9-final-review.md` (M9.C1)
- `docs/implementation-plan.md` (post-completion note)
- `README.md`, `docs/demo-script.md`, `docs/architecture.md`, `docs/testing-strategy.md`, `docs/ai-workflow.md`

**Subtasks**

- [x] Verify `expo-print` API with Context7 `/expo/expo` (Expo MCP unavailable for docs).
- [x] Update D9 to generated PDF report artifact.
- [x] Implement `buildReportPdfHtml` + PDF generation and sharing in `ShareService`.
- [x] Add/update `reportPdf` and `ShareService` tests.
- [x] Run `npm test` and `npm run typecheck`.

**Gate results**

- `npm test` and `npm run typecheck`: pass.
- Shared artifact is a generated PDF (photo + enrichment/unavailable data), not `report.photoUri`.
- Expo docs source: Context7 `/expo/expo` (`printToFileAsync`, `shareAsync` with PDF mimeType).

**Acceptance criteria**

- Shared artifact includes photo, timestamp, coordinates/unavailable reason, weather/unavailable reason, partial indication.
- Share failures map to `shareFailed`; preview remains available; retry allowed.
- No `expo-image-manipulator` added (base64 original photo; resizing deferred).

**Commit guidance:** `feat: share generated PDF report instead of photo only`

---
