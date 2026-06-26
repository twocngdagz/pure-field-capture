# Milestone boards

Detailed milestone boards live here. They complement the project-level monitor in
[`implementation-plan.md`](../implementation-plan.md).

## How the two layers work

| Layer | File | Role |
| --- | --- | --- |
| Project monitor | [`implementation-plan.md`](../implementation-plan.md) | Milestone goals, high-level tasks, milestone status (`Not started` / `In progress` / `Complete`). |
| Milestone board | `docs/milestones/milestone-*.md` | Small task cards (M2.1, M2.2, …) with subtasks, verification commands, and commit guidance. |

Agents pick the **lowest open milestone** in the implementation plan, then **one unchecked
task** on that milestone's detailed board (or one unchecked top-level task if no board
exists yet).

## Conventions

- **Checkbox syntax:** `- [ ]` open · `- [x]` done.
- **One card per session:** complete a single task card (e.g. M2.2 only) per controlled
  prompt. Do not bundle cards.
- **Definition of done:** a task is complete only when its acceptance criteria pass and
  verification commands have been run successfully. Update checkboxes and card status
  before claiming done.
- **Milestone complete:** set the milestone to `Complete` in
  [`implementation-plan.md`](../implementation-plan.md) only when **every** task card on
  that milestone's board is complete (e.g. M2.10 closes Milestone 2 after M2.1–M2.9).

## Current boards

| Milestone | Board | Status |
| --- | --- | --- |
| 2 — Expo scaffold | [`milestone-2-expo-scaffold.md`](./milestone-2-expo-scaffold.md) | Complete |
| 3 — Domain reducer | [`milestone-3-domain-reducer.md`](./milestone-3-domain-reducer.md) | Complete |
| 4 — Camera capture | [`milestone-4-camera-capture.md`](./milestone-4-camera-capture.md) | Complete |
| 5 — Location & weather | [`milestone-5-location-weather.md`](./milestone-5-location-weather.md) | Complete |
| 6 — Report preview | [`milestone-6-report-preview.md`](./milestone-6-report-preview.md) | Complete |
| 7 — Native sharing | [`milestone-7-native-sharing.md`](./milestone-7-native-sharing.md) | Complete |
