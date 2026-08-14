# PRD — BitWiki Foundry

## Product

**BitWiki Foundry** is the application/control plane. It analyzes repositories and produces **BitWiki Atlases**: continuously maintainable repository documentation products with human docs, rich visualizations, provenance, and machine-readable interfaces.

**Foundry → analyzes repository → builds Atlas.**

`Git repository → canonical RepoGraph → specialized agent factory → BitWiki Atlas`

## Primary users
- developers entering unfamiliar codebases
- maintainers who need current docs
- AI coding/research agents that need structured repo context

## Differentiators
1. **Agent-native substrate** — graph, provenance, raw Markdown, manifests, FAQ cache, MCP-ready resources.
2. **Visual intelligence suite** — Mermaid baseline plus dependency, call/control-flow, sequence, data-flow, clustering, complexity, churn, timeline, code-city, API and onboarding views.
3. **Multi-agent factory** — bounded specialist stages instead of one LLM writing the whole wiki.
4. **Safe generated style** — tailored Atlas presentation through validated theme tokens/templates rather than arbitrary fragile site rewrites.
5. **Evidence first** — claims and visuals trace to source evidence or explicitly labeled inference/research.

## MVP
- GitHub/local repo intake pinned to commit SHA
- file/module/symbol extraction
- canonical RepoGraph
- ranking + clustering
- architecture synthesis
- generated Atlas pages
- Mermaid diagrams
- bounded themes/templates
- citations/provenance
- FAQ materialization
- `llms.txt`, `llms-full.txt`, sitemap, robots, JSON graph/index
- static site build + hosting
- incremental refresh from changed files
- deterministic validation before publish

## Visual families
Architecture, dependency, symbol/call, control flow, sequence, data flow, state, ER/schema, inheritance/type, filesystem, clustering, complexity heatmaps, code-city/treemap, change coupling/churn, timeline/history, test topology, API topology, reading paths.

## FAQ cache
Each FAQ entry stores question/aliases, answer, commit SHA, evidence dependencies/hash, generation version, audit state, and timestamps. Cache entries invalidate when evidence hashes change.

## Quality report
Separate deterministic checks from LLM judgments. Score source coverage, provenance, architecture consistency, freshness, links/build, graph completeness, visual usefulness, onboarding, FAQ usefulness, machine readability, unsupported claims, security/license warnings.
