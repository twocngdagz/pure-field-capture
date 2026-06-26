# AGENTS.md — PURE Field Capture

This file is the **enforcement layer** for every AI-assisted coding session in this
repository. It is intentionally short and directive. The full plan and rationale
live in [`docs/`](./docs).

## Before you do anything

1. Read [`docs/assessment-contract.md`](./docs/assessment-contract.md) — the project contract.
2. Read [`docs/implementation-plan.md`](./docs/implementation-plan.md) — the milestone plan and status.
3. Pick the **lowest open milestone** (status not `Complete`), then **exactly one**
   unchecked task (`- [ ]`) inside it. Do not start tasks in a later milestone.

## How to work

- **One task at a time.** Do not bundle milestones.
- **Restate before editing.** State the task, its acceptance criteria, the files you
  expect to touch, and any decision that needs human confirmation.
- **Keep scope narrow.** Do not invent requirements beyond the assessment. Do not add
  libraries or architectural patterns without a documented decision.
- **Prefer boring, proven Expo/React Native patterns.**
- **Stop before irreversible or direction-changing choices.** Ask the human owner first.

## Hard rules (do not violate)

- **Never** use `expo-image-picker` as the primary capture path. Use `expo-camera`
  with a real `CameraView` and `takePictureAsync`. Image picker may only be noted as
  a possible *future* fallback.
- **Use Open-Meteo** for weather enrichment unless a documented decision in
  [`docs/decisions.md`](./docs/decisions.md) changes it.
- **No API keys, no `.env`, no `.env.example`** unless the weather provider switches to
  a key-based API (e.g. OpenWeatherMap). If that happens, document it first.
- **Preserve the captured photo** through any enrichment failure. Never delete the
  photo URI because weather/location failed.
- **Keep no-network distinct** from generic API failure. `networkUnavailable` is its
  own `AppError` type and its own UX path (retry / continue with partial report).
- **Do not hide scenario-specific errors** behind a generic catch-all UI. Camera
  denied, location denied, no network, weather failure, and share failure each have
  defined behavior — see [`docs/architecture.md`](./docs/architecture.md).
- **Keep the reducer pure.** Side effects belong in ViewModel action functions or
  injected services, never in the reducer.

## Definition of done for a task

- Behavior changes ship with added/updated tests (reducer unit tests, ViewModel tests
  with fake services, error-mapping tests — see
  [`docs/testing-strategy.md`](./docs/testing-strategy.md)).
- Relevant tests/checks run clean before you finalize.
- [`docs/implementation-plan.md`](./docs/implementation-plan.md) is updated: mark the
  completed task `- [x]`; set the milestone to `Complete` only when all its tasks are
  checked.
- Commit message is meaningful and milestone-scoped.

## Non-goals for the core submission

Do not build (unless explicitly selected later): authentication, a backend API, a
property database, multi-user workflows, full offline sync queue, map view, MCP/AI
feature, or mobile CI. These are documented as future work only.

## Do not

- Commit secrets, API keys, build outputs, simulator artifacts, or `.env` files.
- Create or push a remote repository unless the human owner explicitly asks.
- Fake a git identity. If commit is blocked, report the exact commands the owner must run.
