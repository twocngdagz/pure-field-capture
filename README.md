# PURE Field Capture

A mobile app for a property agent in the field: **capture** a photo with the native
camera, **enrich** it with current location and weather, and **send** it via native
sharing. Built as a Senior Mobile Engineer take-home for PURE Home River.

> **Project status:** Foundation only. This commit establishes the assessment contract,
> agent operating rules, and documentation. **The app has not been scaffolded yet** — the
> next step is Milestone 2 (Expo TypeScript scaffold). Setup commands below describe the
> *planned* fresh-checkout path and will be finalized when the app is scaffolded.

## Weather provider

This project uses Open-Meteo for weather enrichment. **No API key is required.**

There is no `.env` and no `.env.example`. If the weather provider ever changes to a
key-based API, the README and [`docs/decisions.md`](./docs/decisions.md) will be updated
first.

## Stack

- React Native + **Expo** + **TypeScript**
- `expo-camera` (`CameraView`, `takePictureAsync`) for native capture and live preview
- `expo-location` for GPS coordinates
- Open-Meteo REST API for weather (no key)
- Native sharing via the platform share sheet / intent
- Jest + React Native Testing Library for tests

See [`docs/decisions.md`](./docs/decisions.md) for the reasoning, including native vs
multiplatform trade-offs.

## Fresh-checkout setup (planned)

Once the app is scaffolded (Milestone 2), a clean checkout will run with:

```bash
git clone <repo-url>
cd pure-field-capture
npm install
npx expo start            # then open on iOS simulator / Android emulator / device
```

Run the tests with:

```bash
npm test
```

No API keys or environment variables are needed.

## Timebox strategy

The assessment suggests 4–6 hours for the core app. Work is scoped around a polished
capture → enrich → share flow rather than a broad property-management system. The planned
hour-by-hour breakdown lives in [`docs/ai-workflow.md`](./docs/ai-workflow.md). Time
figures are a *planned/targeted* timebox, not a claim of exact time spent.

## Failure handling

The app handles the obvious failure cases as distinct, recoverable states — camera
permission denied, location permission denied, **no network** (its own state, not a
generic API error), weather API failure, and share failure. The captured photo is always
preserved, and a **partial report** is allowed. Details in
[`docs/architecture.md`](./docs/architecture.md).

## Accessibility

The core flow includes basic accessibility: roles and clear labels on the Capture, Retry,
Continue, and Share controls; readable loading/error text; and status that is not conveyed
by color alone.

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
