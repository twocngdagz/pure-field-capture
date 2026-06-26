# Demo Script

A tight, ~5–8 minute live walkthrough over Google Meet, screen-sharing a simulator,
emulator, or device. Each section lists what to do and what to say.

> Setup before the call: app running on a simulator/device, a second app available to
> share into (Mail/Messages), and a way to toggle airplane mode quickly.

## 1. Happy path — capture → enrich → send

**Do:** Open the app → tap **Capture** → take a photo of something → watch enrichment
attach GPS location + current weather → review the report preview → tap **Share** → send
via the native share sheet.

**Say:** "This is the core field workflow: a property agent captures a photo, the app
enriches it with location and current weather, and they send it on with native sharing."

## 2. Camera permission denied

**Do:** With camera permission denied (reset/deny in settings), try to capture.

**Say:** "Camera access is required for capture, so we explain that clearly and offer a
recoverable path rather than failing silently."

## 3. Location permission denied

**Do:** Deny location permission and capture.

**Say:** "Location is optional context. We still produce a report — the photo is the
point — and we mark location and weather as unavailable instead of blocking the user."

## 4. No-network / weather failure

**Do:** Turn on airplane mode, capture, and let enrichment fail.

**Say:** "No-network is treated as its own failure state, not a generic API error. The
photo is preserved, weather shows as unavailable, and the user can retry or continue."

Expected message:

> You appear to be offline. Your photo was captured, but weather context could not be
> fetched. You can retry or continue with a partial report.

## 5. Partial report

**Do:** From the offline state, choose **Continue with partial report**, then preview.

**Say:** "A partial report is a first-class outcome — full photo and timestamp, with
enrichment marked unavailable. We never discard the capture to recover from a failure."

## 6. Native sharing

**Do:** Share the report and, if convenient, demonstrate a share failure staying
recoverable (preview remains, retry available).

**Say:** "Sharing uses the platform share sheet. If it fails, we keep the preview and
allow retry instead of crashing."

## 7. Architecture walkthrough

**Say:** "State lives in a pure reducer; a ViewModel hook orchestrates side effects
through injected services (camera, location, weather, share). That keeps transitions
predictable and the core logic testable without native dependencies." Show
[`architecture.md`](./architecture.md) and the `src/` layout.

## 8. Testing walkthrough

**Say:** "We test the meaningful logic: every reducer transition, the async workflow with
fake services, error mapping (network vs API), and partial-report behavior. Native camera
and sharing are verified manually." Show the test run and
[`testing-strategy.md`](./testing-strategy.md).

## 9. AI workflow explanation

**Say:** "AI did a lot of the typing, under human control. Everything is gated by an
assessment contract and a milestone plan; agents work one scoped task at a time and stop
before changing decisions or scope." Show [`ai-workflow.md`](./ai-workflow.md) and the
agent rule files.

## 10. Native vs multiplatform & future work

**Say:** "I considered native SwiftUI/Kotlin, but the prompt allowed React Native/Expo,
which gives the required native capabilities under the timebox while keeping a
cross-platform path. With more time I'd add offline sync, a map view, an MCP-assisted
maintenance summary, a backend/dashboard, and mobile CI — all intentionally left out of
the core submission." Show [`decisions.md`](./decisions.md).
