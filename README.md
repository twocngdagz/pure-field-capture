# PURE Field Capture

A mobile app for a property agent in the field: **capture** a photo with the native
camera, **enrich** it with current location and weather, and **send** it via native
sharing. Built as a Senior Mobile Engineer take-home for PURE Home River.

> **Project status:** Expo scaffold complete. The app currently shows a minimal placeholder
> screen. The core capture -> enrich -> share flow has not been implemented yet.

## Weather provider

This project uses Open-Meteo for weather enrichment. **No API key is required.**

There is no `.env` and no `.env.example`. If the weather provider ever changes to a
key-based API, the README and [`docs/decisions.md`](./docs/decisions.md) will be updated
first.

## Stack

- React Native + Expo SDK 56 + TypeScript
- Expo Router for file-based routing
- Jest + React Native Testing Library for tests
- Installed for upcoming milestones: `expo-camera`, `expo-location`, `expo-sharing`
- Planned: Open-Meteo REST API for weather enrichment (no key)
- Planned: native sharing via the platform share sheet / intent

See [`docs/decisions.md`](./docs/decisions.md) for the reasoning, including native vs
multiplatform trade-offs.

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
capture -> enrich -> share flow rather than a broad property-management system. The planned
hour-by-hour breakdown lives in [`docs/ai-workflow.md`](./docs/ai-workflow.md). Time
figures are a *planned/targeted* timebox, not a claim of exact time spent.

## Failure handling (planned)

The app **will** handle the obvious failure cases as distinct, recoverable states —
camera permission denied, location permission denied, **no network** (its own state, not
a generic API error), weather API failure, and share failure. The captured photo **will
always** be preserved, and a **partial report** **will** be allowed. Details in
[`docs/architecture.md`](./docs/architecture.md).

## Accessibility (planned)

The core flow **will** include basic accessibility: roles and clear labels on the Capture,
Retry, Continue, and Share controls; readable loading/error text; and status that is not
conveyed by color alone. The current scaffold screen uses readable text only; control-level
accessibility is added as real controls are implemented.

## AI-assisted workflow

This project **is being built** with AI tools under human control, gated by an assessment
contract and a milestone plan. See [`docs/ai-workflow.md`](./docs/ai-workflow.md) and
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
