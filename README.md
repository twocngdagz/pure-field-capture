# PURE Field Capture

A mobile app for a property agent in the field: **capture** a photo with the native
camera, **enrich** it with current location and weather, and **send** it via native
sharing. Built as a Senior Mobile Engineer take-home for PURE Home River.

> **Project status:** Core capture -> enrich -> preview -> share flow is implemented, tested,
> and documented for take-home review. Remaining manual checks are device-specific camera,
> location, share-sheet, and screen-reader QA.

## Weather provider

This project uses Open-Meteo for weather enrichment. **No API key is required.**

There is no `.env` and no `.env.example`. If the weather provider ever changes to a
key-based API, the README and [`docs/decisions.md`](./docs/decisions.md) will be updated
first.

## Stack

- React Native + Expo SDK 56 + TypeScript
- Expo Router for file-based routing
- `expo-camera` for native photo capture
- `expo-location` + Open-Meteo REST API for location/weather enrichment
- `expo-print` + `expo-sharing` for generated PDF report sharing (`expo-file-system` for photo read)
- Jest + React Native Testing Library for tests

See [`docs/decisions.md`](./docs/decisions.md) for the reasoning, including native vs
multiplatform trade-offs.

## Architecture

The app keeps workflow state in a pure reducer and puts native/network side effects behind
small injected services. The screen layer wires those pieces together:

- `src/app/index.tsx` renders `CaptureScreen`.
- `CaptureScreen` owns the `CameraView` ref, preview state, and UI branches.
- `useCaptureViewModel` orchestrates capture, enrichment, and sharing actions.
- `captureReducer` owns workflow transitions and preserves the report through recoverable failures.
- Services wrap native/network boundaries: camera permission, location, weather, and sharing.

See [`docs/architecture.md`](./docs/architecture.md) for details.

## Fresh-checkout setup

From a clean checkout:

```bash
git clone <repo-url>
cd pure-field-capture
npm install
npx expo start
```

Run checks:

```bash
npm test
npm run typecheck
```

No API keys or environment variables are needed.

## Timebox strategy

The assessment suggests 4–6 hours for the core app. Work is scoped around a polished
capture -> enrich -> preview -> share flow rather than a broad property-management system. The planned
hour-by-hour breakdown lives in [`docs/ai-workflow.md`](./docs/ai-workflow.md). Time
figures are a *planned/targeted* timebox, not a claim of exact time spent.

## Failure handling

The app handles the obvious failure cases as distinct, recoverable states: camera permission
denied, location permission denied, **no network** (its own state, not a generic API error),
weather API failure, and share failure. Failures are shown as readable UI states with retry
or continue options where appropriate, rather than crashes. The captured photo is preserved
through enrichment failure, and a partial report is allowed. Details in
[`docs/architecture.md`](./docs/architecture.md).

## Accessibility

The core flow includes basic accessibility coverage: roles and clear labels on Capture,
Retry, Continue, Retake, and Share controls; readable loading/error text; report preview
headers; and a labeled captured photo. Status is not conveyed by color alone.

Manual VoiceOver/TalkBack QA is documented as a deferred checklist in the Milestone 8 board.

## AI-assisted workflow

This project was built with AI tools under human control, gated by an assessment contract
and a milestone plan. See [`docs/ai-workflow.md`](./docs/ai-workflow.md) and
[`AGENTS.md`](./AGENTS.md).

## Documentation

| Doc | Purpose |
| --- | --- |
| [`docs/assessment-contract.md`](./docs/assessment-contract.md) | Source-of-truth requirements distilled from the brief. |
| [`docs/implementation-plan.md`](./docs/implementation-plan.md) | Milestones, acceptance criteria, and status. |
| [`docs/decisions.md`](./docs/decisions.md) | Decision records (stack, provider, state strategy, non-goals). |
| [`docs/architecture.md`](./docs/architecture.md) | Layers, data flow, error model, report model. |
| [`docs/testing-strategy.md`](./docs/testing-strategy.md) | What is tested automatically vs manually. |
| [`docs/ai-workflow.md`](./docs/ai-workflow.md) | How AI is used, decision gates, timebox. |
| [`docs/demo-script.md`](./docs/demo-script.md) | Live Google Meet demo walkthrough. |

## License

Take-home exercise; not licensed for distribution.
