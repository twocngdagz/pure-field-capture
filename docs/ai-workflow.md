# AI Workflow

AI tools are used heavily on this project, under human control. This document explains
how, so the workflow is itself part of the submission and the interview discussion.

## How AI is used

- **Planning & documentation:** distilling the assessment into a checkable contract,
  drafting the milestone plan, decision records, architecture, and demo script.
- **Implementation:** generating reducer/ViewModel/service code one milestone-scoped
  task at a time, with the project docs loaded as context.
- **Tests:** drafting reducer, ViewModel, and error-mapping tests alongside behavior.
- **Review:** spotting drift from the contract, missing failure cases, or scope creep.

AI accelerates the work; it does not own direction. The human owner makes the decisions.

## Human decision gates

The agent **stops and asks** before:

- Changing a documented decision in [`decisions.md`](./decisions.md) (stack, weather
  provider, capture mechanism, state strategy).
- Adding a dependency or architectural pattern not already justified.
- Broadening scope beyond the selected task or touching non-goals.
- Any irreversible or direction-changing action (e.g. creating/pushing a remote repo).

## Prompt pattern for future tasks

Every implementation session should open with this restatement before editing:

```
1. Task: <the single task from implementation-plan.md>
2. Acceptance criteria: <copied from the milestone>
3. Files I expect to create/edit: <list>
4. Decisions I need confirmed: <list, or "none">
```

Then: implement → add/update tests → run checks → update plan status → propose a small,
meaningful commit.

## Review discipline

- Work in small, reviewable batches; one task at a time.
- Keep changes scoped to the selected task; no opportunistic refactors.
- Behavior changes ship with tests.
- Re-read the relevant doc before claiming a task is done.

## Anti-drift rules

- The assessment contract wins over code and over the model's assumptions.
- Do not invent requirements. Do not add libraries without a documented decision.
- Keep `networkUnavailable` distinct from `weatherFailed`.
- Never use `expo-image-picker` as the primary capture path.
- Never delete the captured photo to recover from an enrichment failure.
- Prefer boring, proven Expo/React Native patterns.

## Using Cursor / Claude / Codex / Gemini consistently

- [`AGENTS.md`](../AGENTS.md) is the single source of truth. `CLAUDE.md` and `GEMINI.md`
  defer to it; `.cursor/rules/pure-field-capture.mdc` mirrors it for Cursor.
- Whatever tool is used, it must load the project docs first and follow the same prompt
  pattern and gates above.
- Do not run broad autonomous agents without the project docs loaded as context.

## Expo documentation (MCP-first)

For Expo-specific implementation decisions, agents must **not** rely on model memory.
Use current documentation in this order:

1. **Expo MCP** (primary) — when available in Cursor, query for SDK 56 behavior, package
   APIs, config plugins, native permissions, and `npx expo install` guidance.
2. **Context7 `/expo/expo`** (fallback or cross-check) — when Expo MCP is unavailable,
   unclear, or you need to verify a finding.

Record verified commands, versions, and config notes in the active milestone board
([`docs/milestones/milestone-2-expo-scaffold.md`](./milestones/milestone-2-expo-scaffold.md)
Expo Docs Notes section) after checking docs, not from memory.

Apply this especially when:

- **M2.3** — `npx expo install` and SDK-compatible package versions.
- **M4** — `expo-camera` (`CameraView`, `takePictureAsync`), config plugin, permission copy.
- **M5** — `expo-location`, config plugin, permission copy.
- **M7** — `expo-print`, `expo-file-system`, `expo-sharing`, PDF report artifact behavior, and any `app.json` plugin entries.

The Expo MCP is for **documentation and setup guidance**, not a substitute for the
assessment app’s capture/enrich/share workflow. Do not add unrelated MCP stretch features
to the core flow.

## Timebox strategy

The assessment suggests 4–6 hours for the core app. The work is scoped around a polished
capture → enrich → share flow rather than a broad property-management system.

**Planned breakdown** (planned/targeted, not a claim of exact time spent):

- Hour 1: assessment interpretation, architecture, AI rules, project setup
- Hour 2: native camera capture and permission handling
- Hour 3: current GPS location and weather enrichment
- Hour 4: report preview and native sharing
- Hour 5: failure states and meaningful tests
- Hour 6: README, demo script, polish, and review
