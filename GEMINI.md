# GEMINI.md

This project keeps a **single source of truth** for agent behavior in
[`AGENTS.md`](./AGENTS.md).

Gemini (and any Gemini-powered agent) must:

1. Read and follow [`AGENTS.md`](./AGENTS.md) in full before acting.
2. Treat [`docs/assessment-contract.md`](./docs/assessment-contract.md) as the project contract.
3. Select work from [`docs/implementation-plan.md`](./docs/implementation-plan.md), one task at a time.
4. Follow the prompt pattern and human decision gates in
   [`docs/ai-workflow.md`](./docs/ai-workflow.md).

Do not duplicate rules here. If guidance changes, update `AGENTS.md` and the relevant
`docs/` file, not this file.
