# PRD — BITwiki Foundry

## Product

**BITwiki Foundry** is the application/control plane. It analyzes repositories and publishes **BITwiki Atlas** output: maintainable repository knowledge with human documentation, visualizations, ratings, provenance, and machine-readable interfaces.

`Git repository → canonical RepoGraph → specialist agents → BITwiki Atlas`

Durable generated output lives in [`bitwikiorg/atlas`](https://github.com/bitwikiorg/atlas). Foundry retains orchestration, planning, queueing, validation, and operational state.

## Primary users

- developers entering unfamiliar codebases
- maintainers who need current, inspectable docs and diagnostics
- AI coding/research agents that need structured repository context

## Differentiators

1. **Graph-first evidence** — one canonical repository model supports docs, visuals, ratings, FAQ, audit, and machine outputs.
2. **Specialist production** — bounded agent roles rather than one LLM writing everything.
3. **Portable output** — Markdown, JSON, JSONL, provenance, graphs, and machine surfaces are first-class.
4. **Template inheritance** — Atlas uses one base documentation contract plus thin repository-archetype overlays.
5. **Independent verification** — generated work is audited, enhanced once, adjudicated, and only then published.

## Output

A published repository version may contain:

- README / overview
- architecture and visual system map
- quickstart and developer workflows
- interfaces / API / CLI reference
- configuration, data/state, operations, and security when applicable
- testing and quality analysis
- FAQ, troubleshooting, and glossary
- codebase scorecard
- repository history / churn / change coupling
- `graph.json`
- `scorecard.json`
- `provenance.jsonl`
- `llms.txt`
- `llms-full.txt`
- `manifest.json`

Each generated version is pinned to an immutable source commit.
