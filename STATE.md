# STATE.md — Current Truth

status: READY
phase: foundation
active_objective: Implement the graph-first ingestion spine and first real BitWiki Atlas generation path.
next_valid_action: Implement repository snapshot → scanner → RepoGraph/GraphDelta pipeline.
last_updated: 2026-08-14

## Verified
- Canonical names are **BitWiki Foundry** (app) and **BitWiki Atlas** (generated repo-doc product).
- Repository: `bitwikiorg/foundry`.
- Vercel project: `bitwikiorgs-projects/foundry`.
- Git pushes to `main` trigger production Vercel deployments.
- Minimal Foundry landing/control-plane shell is deployed.
- RepoGraph is the architectural anchor.

## Not implemented
- repository ingestion/analyzers
- graph construction/ranking
- multi-agent runtime
- Atlas Docusaurus build pipeline
- visualization renderers
- FAQ cache
- MCP/A2A surfaces
- multi-Atlas hosting automation
