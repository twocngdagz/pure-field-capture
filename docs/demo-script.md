# Demo Script

A tight, ~5–8 minute live walkthrough over Google Meet, screen-sharing a simulator,
emulator, or device. Each section lists what to do and what to say.

> Setup before the call: app running on a simulator/device, a second app available to
> share into (Mail/Messages), and a way to toggle airplane mode quickly.

## 1. Happy path — capture → enrich → send

**Do:**

- Open the app and show the camera preview.
- Tap `Capture photo`.
- After `Photo captured` appears, tap `Enrich report`.
- Point out `Adding location and weather...`.
- On `Report Preview`, point out the captured photo, timestamp, coordinates, weather condition, and temperature.
- Tap `Share report`.
- Point out `Sharing report...`, then `Report shared` after the share sheet returns.

Native share-sheet behavior is device-dependent; if running in this environment, describe the expected share sheet instead of forcing it.

**Say:** "This is the core field workflow: a property agent captures a photo, the app
enriches it with location and current weather, and they send it on with native sharing."

## 2. Camera permission denied

**Do:** With camera permission denied (reset/deny in settings), open the app and point out the error message and `Retry` button.

**Say:** "Camera access is required for capture, so we explain that clearly and offer a
recoverable path rather than failing silently."

## 3. Location permission denied

**Do:** Deny location permission, capture a photo, tap `Enrich report`, and point out enrichment failure with `Continue with partial report` available.

**Say:** "Location is optional context. We still produce a report — the photo is the
point — and we mark location and weather as unavailable instead of blocking the user."

## 4. No-network / weather failure path

**Do:**

- Disable network or use the prepared failure path.
- Capture a photo.
- Tap `Enrich report`.
- Point out the error text: `Network is unavailable. Please try again.`
- Point out the available actions: `Retry enrichment`, `Continue with partial report`, and `Retake`.
- Tap `Continue with partial report`.
- Point out `Partial Report Preview`, `Network unavailable`, and `Unavailable` rows.

**Say:** The photo is preserved even when enrichment fails. The field user can retry when the
network comes back, or continue with a partial report instead of losing the capture.

## 5. Native sharing

**Do:** From `Report Preview` or `Partial Report Preview`, tap `Share report`. If convenient, demonstrate a share failure and point out `Retry share` while the preview remains.

**Say:** "Sharing uses the platform share sheet. If it fails, we keep the preview and
allow retry instead of crashing."

## 6. Architecture walkthrough

**Say:** "State lives in a pure reducer; a ViewModel hook orchestrates side effects
through injected services (camera, location, weather, share). That keeps transitions
predictable and the core logic testable without native dependencies." Show
[`architecture.md`](./architecture.md) and the `src/` layout.

## 7. Testing walkthrough

**Say:** "We test the meaningful logic: every reducer transition, the async workflow with
fake services, error mapping (network vs API), and partial-report behavior. Native camera
and sharing are verified manually." Show the test run and
[`testing-strategy.md`](./testing-strategy.md).

## 8. AI workflow explanation

**Say:** "AI did a lot of the typing, under human control. Everything is gated by an
assessment contract and a milestone plan; agents work one scoped task at a time and stop
before changing decisions or scope." Show [`ai-workflow.md`](./ai-workflow.md) and the
agent rule files.

## 9. Native vs multiplatform & future work

**Say:** "I considered native SwiftUI/Kotlin, but the prompt allowed React Native/Expo,
which gives the required native capabilities under the timebox while keeping a
cross-platform path. With more time I'd add offline sync, a map view, an MCP-assisted
maintenance summary, a backend/dashboard, and mobile CI — all intentionally left out of
the core submission." Show [`decisions.md`](./decisions.md).
