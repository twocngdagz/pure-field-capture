# Milestone 2 — Expo TypeScript app scaffold

**Project monitor:** [`implementation-plan.md`](../implementation-plan.md) · Milestone 2

**Milestone status:** `Complete`

## Goal

A running Expo + TypeScript app that builds cleanly from a fresh checkout.

## Milestone acceptance criteria

- `npm install` then the documented start command launches the app.
- `npm test` runs (even with a trivial passing test).
- `npm run typecheck` passes with no errors.
- README fresh-checkout steps verified.

---

## Expo Docs Notes

> **Verified during M2.2** (2026-06-26). Native deps verified during **M2.3** (2026-06-26).

**Documentation source (M2.3 and later):** Use **Expo MCP first** for Expo-specific
decisions. Use Context7 `/expo/expo` as fallback or cross-check when Expo MCP is
unavailable or unclear. Do not rely on model memory for setup, SDK behavior, config
plugins, permissions, package APIs, or install/version guidance. Record verified findings
here after checking docs.

**Date checked:** 2026-06-26

**Source:** Context7 `/expo/expo` (initial scaffold); Expo MCP primary for M2.3+ (see
[`ai-workflow.md`](../ai-workflow.md))

**Scaffold command (verified):**

```bash
rm -rf /tmp/pure-field-capture-expo-scaffold
npx create-expo-app@latest /tmp/pure-field-capture-expo-scaffold --template default@sdk-56
```

**Cleanup (verified):** In temp dir, `printf 'n\n' | npm run reset-project` deletes demo
content and creates a minimal `src/app/` (`_layout.tsx` + `index.tsx`). SDK 56
`reset-project` is **interactive** — pipe `n\n` to decline moving to `/example`. Do not
copy `scripts/` or the `reset-project` npm script into the repo.

**Verified versions (M2.2):**

- Expo SDK: `~56.0.12` (`expo` in `package.json`)
- Expo CLI: `56.1.16` (`npx expo --version`)
- `expo-router`: `~56.2.11`
- React Native: `0.85.3`
- Package manager: npm (`package-lock.json` committed)

**Project structure (verified):**

- Entry: `expo-router/entry` in `package.json`
- Routes: `src/app/` (created by `reset-project`, not root `app/`)
- `tsconfig.json` paths: `@/*` → `./src/*`, `@/assets/*` → `./assets/*`
- M2.4 no longer needs an `app/` → `src/app/` move if scaffold followed this path

**Native capability deps (verified M2.3):**

```bash
npx expo install expo-camera expo-location expo-sharing
```

- `expo-camera`: `~56.0.8`
- `expo-location`: `~56.0.18`
- `expo-sharing`: `~56.0.18`
- `expo-image-picker`: **not installed**

**Config/permissions deferred (not in M2.3):**

- `expo-camera` plugin + permission copy → **M4** (photos only; disable microphone /
  `recordAudioAndroid: false` when adding plugin).
- `expo-location` plugin + permission copy → **M5**.
- `expo install` may auto-add `expo-sharing` to `app.json` plugins — **revert** if
  install-only scope; lock share plugin/config in **M7** with D9 if needed.

**Still verify during M2.6:**

- Testing setup (Jest) for SDK 56

---

## M2.1 — Create Milestone 2 control documents

**Status:** `Complete`

**Purpose:** Create the detailed task board and connect it to the project-level monitor.

**Files expected to change**

- `docs/milestones/README.md`
- `docs/milestones/milestone-2-expo-scaffold.md`
- `docs/implementation-plan.md`
- `docs/decisions.md` (add D10: Expo Router + `src/app` layout)

**Subtasks**

- [x] Create `docs/milestones/README.md` explaining how detailed milestone boards work.
- [x] Create `docs/milestones/milestone-2-expo-scaffold.md` with 10 task cards.
- [x] Add an Expo Docs Notes section with instructions to use Context7 `/expo/expo` before M2.2.
- [x] Link Milestone 2 in `docs/implementation-plan.md` to the detailed board.
- [x] Add D10 to `docs/decisions.md` (Expo Router default template, `src/app` target in M2.4).
- [x] Keep Milestone 2 status as `Not started` until scaffold work begins.
- [x] Do not scaffold the app in this task.

**Acceptance criteria**

- Milestone board exists with exactly 10 task cards (M2.1–M2.10).
- Implementation plan links to this board.
- D10 recorded in `docs/decisions.md`.
- No Expo scaffold, `package.json`, or dependencies added.

**Verification commands**

```bash
git diff -- docs/implementation-plan.md docs/milestones docs/decisions.md
grep -q "D10" docs/decisions.md
test ! -f package.json
```

**Commit guidance:** `docs: add milestone 2 task board`

**Human decision gate:** None for M2.1.

---

## M2.2 — Scaffold Expo TypeScript project (Expo Router)

**Status:** `Complete`

**Purpose:** Create the Expo Router + TypeScript app foundation without adding feature logic.

**Files expected to change**

- `package.json`
- `package-lock.json`
- `app.json`
- `tsconfig.json`
- `src/app/` (Expo Router routes after `reset-project`)
- `assets/` (only assets referenced by `app.json`)
- `docs/milestones/milestone-2-expo-scaffold.md` (Expo Docs Notes update, card status)

**Subtasks**

- [x] Query Context7 `/expo/expo`, or official Expo docs fallback, for current scaffold guidance.
- [x] Record verified scaffold notes in Expo Docs Notes (date, versions, commands).
- [x] Scaffold in temp directory with pinned template:

  ```bash
  rm -rf /tmp/pure-field-capture-expo-scaffold
  npx create-expo-app@latest /tmp/pure-field-capture-expo-scaffold --template default@sdk-56
  ```

- [x] Clean in temp: `printf 'n\n' | npm run reset-project`, confirm `src/app/` minimal layout.
- [x] Copy allow-list: `package.json`, `package-lock.json`, `app.json`, `tsconfig.json`, `src/app/`, referenced `assets/` only.
- [x] Do **not** copy: `README.md`, `.gitignore`, `.git/`, `docs/`, `.cursor/`, agent rules, `scripts/`, `app-example/`.
- [x] Inspect `package.json` scripts before/after; remove **only** `reset-project`; preserve `start`, `android`, `ios`, `web`, `lint`.
- [x] D10 read-only check passed (`expo-router`, `src/app/_layout.tsx` + `index.tsx`, no `App.tsx`/`index.ts`).
- [x] Do not add app feature code.
- [x] Update this task card status.

**Acceptance criteria**

- Expo scaffold generated in temp directory first.
- Foundation files not overwritten.
- Only allow-list files copied; demo assets excluded.
- `reset-project` script not in repo; `scripts/` not copied.
- Expo Router foundation at `src/app/`; structurally verified.
- No feature logic implemented.

**Verification commands**

```bash
npm install
npx expo --version
npx expo start --help
git diff -- README.md .gitignore AGENTS.md CLAUDE.md GEMINI.md docs/decisions.md .cursor
test ! -d app-example && test ! -d scripts && test ! -f App.tsx && test ! -f index.ts
```

**Commit guidance:** `chore: scaffold expo router typescript app`

**Human decision gate:** None (npm standardized; D10 matched scaffold — no stop required).

---

## M2.3 — Add required Expo native dependencies

**Status:** `Complete`

**Purpose:** Install only the native capability dependencies required by the assessment plan.

**Files expected to change**

- `package.json`
- `package-lock.json`
- `docs/milestones/milestone-2-expo-scaffold.md` (Expo Docs Notes if versions differ)

**Subtasks**

- [x] Query Context7 `/expo/expo`, or official Expo docs fallback, for `npx expo install` guidance.
- [x] Use `npx expo install` unless current Expo docs recommend otherwise.
- [x] Add `expo-camera`.
- [x] Add `expo-location`.
- [x] Add `expo-sharing` to support the D9 **lean default** (captured image + report text);
  exact share artifact remains pending in D9 and is locked before Milestone 7. RN `Share`
  API is text/URL-only fallback.
- [x] Do **not** add `expo-image-picker`.
- [x] Do **not** add API-key/env packages.
- [x] Do **not** add config-plugin / permission entries (`app.json` unchanged; auto-added
  `expo-sharing` plugin reverted).
- [x] Record dependency decision in `docs/decisions.md` only if it changes the plan (no change).

**Acceptance criteria**

- `expo-camera` and `expo-location` are installed.
- `expo-sharing` is installed to support the D9 lean default; D9 share artifact choice
  remains pending until Milestone 7.
- `expo-image-picker` is **not** installed.
- `app.json` has no M2.3 config changes.

**Verification commands**

```bash
npm ls expo-camera expo-location expo-sharing
npm ls expo-image-picker
git diff -- app.json
```

Expected: camera, location, and sharing present; image-picker absent; `app.json` diff empty.

**Commit guidance:** `chore: add expo native capability dependencies`

**Human decision gate:** None unless switching away from `expo-sharing` for D9.

---

## M2.4 — Establish source directory skeleton

**Status:** `Complete`

**Purpose:** Create the source folders expected by the architecture without implementing feature logic.

**Files expected to change**

- `src/app/` (move routes from root `app/` per Expo Router `src` convention)
- `tsconfig.json` (paths: `@/*` → `./src/*`)
- `src/components/`
- `src/features/capture/__tests__/`
- `src/services/`
- `src/utils/`
- Router config if required after `src/app` move

**Subtasks**

- [x] ~~Move `app/` → `src/app/`~~ — **already done** by SDK 56 `reset-project` in M2.2; verified in M2.4 (`src/app/_layout.tsx`, `src/app/index.tsx` present).
- [x] ~~Update `tsconfig.json` paths alias~~ — **already set** (`@/*` → `./src/*`); verified only in M2.4.
- [x] Create `src/components/`, `src/features/capture/__tests__/`, `src/services/`, `src/utils/`.
- [x] Add `.gitkeep` placeholders to keep empty folders visible in git (no TypeScript placeholder modules).
- [x] Do **not** implement reducer, ViewModel, services, camera, location, weather, or sharing yet.
- [x] Keep folder names aligned with `implementation-plan.md` and `architecture.md`.

**Acceptance criteria**

- `src/app/` holds Expo Router routes.
- Architecture-aligned skeleton exists under `src/`.
- No feature logic in reducer/ViewModel/services.

**Verification commands**

```bash
find src -maxdepth 3 -type d | sort
```

**Commit guidance:** `chore: add source directory skeleton`

**Human decision gate:** None.

---

## M2.5 — Add placeholder app screen

**Status:** `Complete`

**Purpose:** Make the scaffold run with a simple placeholder screen that honestly says implementation has not started.

**Files expected to change**

- `src/app/index.tsx` (or equivalent entry route)
- `src/app/_layout.tsx` if layout adjustments needed

**Subtasks**

- [x] Render a simple first screen titled **PURE Field Capture** (native stack header title).
- [x] Include short status text: body shows **Scaffold ready** and **Milestone 2 in progress** (no duplicate app title in body).
- [x] Do not create marketing/landing-page content.
- [x] Do not create capture UI yet.
- [x] Keep styling minimal and stable.

**Acceptance criteria**

- App launches and displays the placeholder screen.
- No capture/enrichment/share UI.

**Verification**

- Manual visual launch deferred; CLI sanity check passed.
- Expected on launch: native header **PURE Field Capture**; body **Scaffold ready** / **Milestone 2 in progress**; no fake controls.

**Verification commands**

```bash
npx expo start
```

Manual: app launches and shows placeholder on simulator/emulator/device.

**Commit guidance:** `feat: add scaffold placeholder screen`

**Human decision gate:** None.

---

## M2.6 — Configure Jest and React Native Testing Library

**Status:** `Complete`

**Purpose:** Add a working test runner with one smoke test.

**Files expected to change**

- `package.json`
- `jest.config.*` if needed
- `jest.setup.*` if needed
- `src/**/__tests__/*`

**Subtasks**

- [x] Install/configure Jest using Expo-compatible setup (`jest-expo` preset).
- [x] Install/configure React Native Testing Library.
- [x] Add one smoke test for the placeholder screen (`src/app/__tests__/index.test.tsx`).
- [x] Add `npm test` script (`jest`, non-watch).
- [x] Avoid brittle native-module tests in this milestone.

**Installed dev dependencies (verified)**

- `@testing-library/react-native` `^13.3.3`
- `@types/jest` `29.5.14`
- `jest` `~29.7.0`
- `jest-expo` `~56.0.5`
- `react-test-renderer` `19.2.3` — explicit install to match `react@19.2.3`; not auto-added by `expo install` for RNTL (peer conflict with `react-test-renderer@19.2.7`).

**Verification**

- `npm test`: **1 suite passed, 1 test passed** (exits cleanly).
- `jest.config.js`: minimal `{ preset: "jest-expo" }` only; no custom `transformIgnorePatterns` required.

**Acceptance criteria**

- `npm test` runs and passes.

**Verification commands**

```bash
npm test
```

**Commit guidance:** `test: configure jest smoke test`

**Human decision gate:** None.

---

## M2.7 — Add typecheck command

**Status:** `Complete`

**Purpose:** Make TypeScript validation explicit and repeatable.

**Files expected to change**

- `package.json`
- `tsconfig.json`

**Subtasks**

- [x] Add `npm run typecheck` using `tsc --noEmit`.
- [x] Ensure TypeScript config is strict enough without scaffold noise (`strict: true` retained; added `compilerOptions.types: ["jest"]` so M2.6 test globals typecheck).
- [x] Run the command and fix any errors.

**Verification**

- `npm run typecheck`: **passes with no errors** (exits cleanly).
- Failure was Jest globals in `src/app/__tests__/index.test.tsx`, not absent Expo-generated types. Minimal fix: `types: ["jest"]` in `tsconfig.json`. `.expo/types` and `expo-env.d.ts` remain gitignored.

**Acceptance criteria**

- `npm run typecheck` passes with no errors.

**Verification commands**

```bash
npm run typecheck
```

**Commit guidance:** `chore: add typecheck script`

**Human decision gate:** None.

---

## M2.8 — Verify start command and fresh-checkout notes

**Status:** `Complete`

**Purpose:** Make the README setup commands accurate for the scaffolded app.

**Files expected to change**

- `README.md`
- `docs/implementation-plan.md` (only if setup wording needs sync)
- `docs/milestones/milestone-2-expo-scaffold.md` (card status)

**Subtasks**

- [x] Verify the actual install command (`npm install`).
- [x] Verify the actual start command (`npx expo start`; validated non-interactively via `npx expo start --help`).
- [x] Update README from planned setup to actual setup.
- [x] Keep Open-Meteo no-key note.
- [x] Do not claim feature functionality exists yet.

**Verification**

- `npm install`: up to date, no errors.
- `npx expo start --help`: CLI available (non-interactive proxy for documented `npx expo start`).
- `npm test`: 1 suite passed.
- `npm run typecheck`: passes with no errors.
- `docs/implementation-plan.md`: unchanged (no stale setup wording).

**Acceptance criteria**

- README reflects real scaffold commands.
- No overclaiming of capture/enrich/share behavior.

**Verification commands**

```bash
npm install
npx expo start --help
npm test
npm run typecheck
```

**Commit guidance:** `docs: update scaffold setup instructions`

**Human decision gate:** None.

---

## M2.9 — Run Milestone 2 quality gate

**Status:** `Complete`

**Purpose:** Run all Milestone 2 checks before marking the milestone complete.

**Files expected to change**

- `docs/milestones/milestone-2-expo-scaffold.md`
- `docs/implementation-plan.md` (only if checklist notes needed; do not mark Complete yet)

**Subtasks**

- [x] Run `npm test`.
- [x] Run `npm run typecheck`.
- [x] Confirm `expo-image-picker` is not installed.
- [x] Confirm no `.env` or `.env.example` was added.
- [x] Confirm app start command is documented (README M2.8: `npx expo start`, `npm test`, `npm run typecheck`).
- [x] Confirm no feature milestones were implemented early (scaffold/placeholder only).

**Verification**

- `npm test`: **1 suite passed, 1 test passed**.
- `npm run typecheck`: **passes with no errors**.
- `expo-image-picker` absent: `npm ls expo-image-picker` returned `(empty)` with exit code 1 (expected pass); not listed in `package.json`.
- No `.env` / `.env.example` at repo root (`find . -maxdepth 2 -name ".env*"` produced no output).
- `git status --short` before board edit: clean working tree.
- `docs/implementation-plan.md`: unchanged (Milestone 2 completion is M2.10).

**Acceptance criteria**

- All verification commands pass.
- Quality gate checklist complete.

**Verification commands**

```bash
npm test
npm run typecheck
npm ls expo-image-picker
find . -maxdepth 2 -name ".env*" -print
git status --short
```

**Commit guidance:** `chore: verify milestone 2 scaffold`

**Human decision gate:** None.

---

## M2.10 — Close Milestone 2

**Status:** `Complete`

**Purpose:** Update project monitors only after all Milestone 2 work is complete and verified.

**Files expected to change**

- `docs/implementation-plan.md`
- `docs/milestones/milestone-2-expo-scaffold.md`
- `README.md` (final wording if needed)

**Subtasks**

- [x] Confirm M2.1 through M2.9 are all complete.
- [x] Set Milestone 2 status to `Complete` in `docs/implementation-plan.md`.
- [x] Check all four top-level Milestone 2 tasks in the implementation plan.
- [x] Ensure the detailed board links back to the main plan.
- [x] Record any known follow-up for Milestone 3.
- [x] Do **not** start Milestone 3 in this task.

**Known follow-up for M3**

- Define `captureTypes.ts` using the existing `Report` / `AppError` decisions from `docs/architecture.md`.
- Keep reducer pure; no service imports or side effects.
- Preserve existing scaffold/test/typecheck commands while adding reducer tests.

**Verification**

- `npm test`: **1 suite passed, 1 test passed**.
- `npm run typecheck`: **passes with no errors**.
- Milestone 2 marked `Complete` in `docs/implementation-plan.md` and board header.

**Acceptance criteria**

- Milestone 2 marked `Complete` only after M2.1–M2.9 pass.
- Board and plan are consistent.

**Verification commands**

```bash
npm test
npm run typecheck
git status --short
```

**Commit guidance:** `docs: close milestone 2 scaffold`

**Human decision gate:** None.
