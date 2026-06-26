# Assessment Contract

This is the **source of truth** for what must be built, distilled from the take-home
PDF (*L3 — Senior Software Engineer (Mobile) Take-Home Exercise*, PURE Home River) and
the required plan patch. If code and this document disagree, this document wins until
it is deliberately updated.

## Scenario

A **Property Agent** handles multiple rental properties and does most of their work in
the field. When visiting a property they need to quickly **capture** what they see,
**enrich** it with useful context, and **send** it to someone else (tenant, vendor, or
their own inbox).

Build a mobile app for a field **property capture**:

1. **Capture** — native camera photo documenting something at the property
   (maintenance issue, pest problem, general condition).
2. **Enrich** — pull relevant context from a public REST API (e.g. current weather for
   the property's GPS location).
3. **Send** — share the resulting capture out via the platform's native sharing.

## Core app requirements (Part 2)

- [ ] Native camera capture (not a stock photo picker as the primary path).
- [ ] Native camera **preview** (real `CameraView`).
- [ ] Integrate at least one public REST API for enrichment.
- [ ] Native sharing to send the capture to another app (share sheet / intent).
- [ ] Graceful handling of the obvious failure cases:
  - camera permission denied
  - location permission denied
  - **no network** (treated as a distinct failure state)
  - API errors (e.g. weather request failure)
- [ ] Genuine use of native device capabilities (camera, sharing, location).

## Architecture & write-up requirements (Part 1)

A short write-up (a page or a diagram is plenty) covering:

- [ ] Overall app architecture and how it is structured for maintainability and scale.
- [ ] State management and data-flow approach.
- [ ] Stack choice and the trade-offs behind it (native vs multiplatform).
- [ ] What you'd build next and what was intentionally left out given the timebox.

These live in [`architecture.md`](./architecture.md) and [`decisions.md`](./decisions.md).

## Testing & demo requirements (Part 3)

- [ ] Automated tests covering the **meaningful logic** (unit and/or integration).
      Sensible approach, not 100% coverage.
- [ ] App builds and runs cleanly **from a fresh checkout**; README makes this easy.
- [ ] Ready to run a **live demo over Google Meet** (simulator, emulator, or device).
- [ ] Ready for a code/design walkthrough.

## Failure states (explicit behavior)

| Scenario | Required behavior |
| --- | --- |
| Camera permission denied | Explain camera access is required for capture; offer a path to retry / open settings. |
| Location permission denied | Allow photo/report where possible; mark location & weather as unavailable. |
| No network | Normalize to `networkUnavailable`. Do **not** delete the photo. Show weather is unavailable. Allow retry and allow continuing with a partial report. |
| Weather API error | Distinguish from no-network where practical. Preserve the photo. Allow retry or partial report. |
| Sharing failure | Do not crash. Keep the report preview available. Allow retry. |

Suggested offline message:

> You appear to be offline. Your photo was captured, but weather context could not be
> fetched. You can retry or continue with a partial report.

## Stretch goals (explicitly optional)

From the PDF — pick any, be ready to discuss the rest:

- AI assist via MCP (e.g. maintenance summary, issue categorization).
- Offline support — queue captures and sync later.
- Map & geocoding — show captures on a map.
- **Accessibility** — labels, dynamic type, contrast. *(We take a basic slice of this
  into the core flow; see [`decisions.md`](./decisions.md).)*
- Mobile CI — pipeline that builds and runs tests on each push.

## Submission expectations

- Create a GitHub repository and share it with the recruiting contact.
- Clear README with setup/run instructions and any API keys needed (none here).
- Commit history shows the app built in smaller, meaningful increments.
- Submit at least 24 hours before the scheduled interview.

## Interview talking points

- Live capture → enrich → send walkthrough in real time.
- Code and design-decision walkthrough.
- Native vs multiplatform reasoning for this app.
- Testing approach and any stretch goals taken on.
- How AI tools were used — what worked, what was adjusted, how AI fits the workflow.
