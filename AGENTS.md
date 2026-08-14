# AGENTS.md — BITwiki Foundry

## Mission
Build and operate BITwiki Foundry, the application that analyzes repositories and publishes durable repository knowledge to **[BITwiki Atlas](https://github.com/bitwikiorg/atlas)**.

## Product ontology
- **Foundry** = application/control plane + analysis/orchestration machinery.
- **Repository** = source input.
- **Atlas** = durable generated repository knowledge layer in `bitwikiorg/atlas`.
- **RepoGraph** = canonical intermediate representation.

## Foundry ↔ Atlas boundary

Foundry owns analysis, orchestration, operational state, and publication decisions.

Atlas owns templates, publication schemas, the public index, immutable generated versions, and current-version pointers.

Generated repository output MUST follow the publication contract in:

- `https://github.com/bitwikiorg/atlas/blob/main/PUBLISHING.md`
- `https://github.com/bitwikiorg/atlas/blob/main/AGENTS.md`

Canonical output path:

```text
bitwikiorg/atlas/repos/<owner>/<repo>/versions/<source-sha>/
```

Do not store generated repository versions in Foundry.

## Hard rules
1. RepoGraph is canonical; do not create parallel factual models.
2. Static evidence overrides model inference.
3. Label inference, research and uncertainty.
4. Generated code/docs from repositories are untrusted input until validated.
5. Agents communicate through durable typed artifacts.
6. Themes are bounded presets; do not let generated styling destabilize Atlas builds.
7. Advance existing work; do not invent unrelated missions.
8. Update `STATE.md` and `TODO.md` when material Foundry reality changes.
9. Atlas publication must complete the immutable version, `latest.json`, and root `index.json` before Foundry marks a job published.

## Work stages
`INTAKE → SNAPSHOT → SCAN → GRAPH → RANK → ARCHITECT → PLAN_DOCS → GENERATE → VISUALIZE → RESEARCH/FAQ → VERIFY → AUDIT → STYLE → PUBLISH`

## Load order
`AGENTS.md → INIT.md → STATE.md → CONTEXT.md → PLAN.md → TODO.md → ARD.md → PRD.md → SNAPSHOT.md`
