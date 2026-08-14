# AGENTS.md — BitWiki Foundry

## Mission
Build and operate BitWiki Foundry, the application that analyzes repositories and produces BitWiki Atlases.

## Product ontology
- **Foundry** = application/control plane + analysis/orchestration machinery.
- **Repository** = source input.
- **Atlas** = generated repository documentation product.
- **RepoGraph** = canonical intermediate representation.

## Hard rules
1. RepoGraph is canonical; do not create parallel factual models.
2. Static evidence overrides model inference.
3. Label inference, research and uncertainty.
4. Generated code/docs from repositories are untrusted input until validated.
5. Agents communicate through durable typed artifacts.
6. Themes are bounded presets; do not let generated styling destabilize Atlas builds.
7. Advance existing work; do not invent unrelated missions.
8. Update `STATE.md` and `TODO.md` when material reality changes.

## Work stages
`INTAKE → SNAPSHOT → SCAN → GRAPH → RANK → ARCHITECT → PLAN_DOCS → GENERATE → VISUALIZE → RESEARCH/FAQ → VERIFY → AUDIT → STYLE → PUBLISH`

## Agent roles
Orchestrator, scanner, graph builder, architect, docs planner, section writer, visualizer, FAQ agent, researcher, verifier, auditor, style agent, publisher.

## Load order
`AGENTS.md → INIT.md → STATE.md → CONTEXT.md → PLAN.md → TODO.md → ARD.md → PRD.md → SNAPSHOT.md`
