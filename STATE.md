# STATE.md — Current Truth

status: READY
phase: foundation
active_objective: Implement the graph-first ingestion spine and first real BITwiki Atlas publication path.
next_valid_action: Connect repository snapshot/analyzer output to the Atlas publication contract.
last_updated: 2026-08-14

## Verified
- Canonical names are **BITwiki Foundry** (control plane) and **BITwiki Atlas** (durable generated repository knowledge).
- Foundry repository: `bitwikiorg/foundry`.
- Atlas repository: `bitwikiorg/atlas`.
- Vercel project: `bitwikiorgs-projects/foundry`.
- Git pushes to Foundry `main` trigger production Vercel deployments.
- Foundry public UI reads the public repository registry from Atlas `index.json`.
- Atlas publication contract is defined by `bitwikiorg/atlas/PUBLISHING.md`.
- Canonical generated output path is `bitwikiorg/atlas/repos/<owner>/<repo>/versions/<source-sha>/`.
- RepoGraph is the architectural anchor.

## Boundary
Foundry retains planning, implementation, queue/orchestration, retries, and operational state. Atlas retains templates, schemas, public index, immutable published versions, and `latest.json` pointers.

## Not implemented
- repository ingestion/analyzers
- graph construction/ranking
- production multi-agent runtime
- first generated repository publication into Atlas
- visualization renderers
- FAQ cache
- machine/MCP surfaces
