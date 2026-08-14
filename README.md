# BitWiki Foundry

**Foundry builds Atlases.**

BitWiki Foundry is the agent-first repository intelligence and documentation factory. A **BitWiki Atlas** is the generated documentation product for one analyzed repository.

Foundry analyzes a Git repository and produces an Atlas containing:

1. a canonical machine-readable code graph,
2. evidence-backed documentation,
3. a modular visual suite,
4. a tailored but bounded Docusaurus presentation,
5. machine-native interfaces for other agents.

## Product ontology

```text
Foundry
  ↓ analyzes
repository
  ↓ produces
Atlas
```

The core rule is simple:

> Analyze once into a canonical graph. Generate every human and machine view from that graph.

## Differentiators

- **Agent-native substrate** — graph, provenance, manifests, FAQ cache, MCP/A2A surfaces, and raw Markdown are first-class outputs.
- **Visualization suite** — Mermaid is the baseline, not the ceiling. Dependency, control-flow, sequence, data-flow, temporal, code-city, clustering, complexity, and other views consume the same graph.
- **Multi-agent production line** — specialized agents own bounded stages instead of one agent writing the entire wiki.
- **Safe visual identity** — per-repository style is generated through bounded theme tokens and layout templates, not arbitrary fragile site rewrites.

## Architecture

See [`PRD.md`](PRD.md), [`ARD.md`](ARD.md), [`PLAN.md`](PLAN.md), and [`TODO.md`](TODO.md).

## Continuity

See [`AGENTS.md`](AGENTS.md), [`INIT.md`](INIT.md), [`STATE.md`](STATE.md), [`CONTEXT.md`](CONTEXT.md), [`SNAPSHOT.md`](SNAPSHOT.md), and [`HEARTBEAT.md`](HEARTBEAT.md).
