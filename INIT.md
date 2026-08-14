# INIT.md — Foundry Reconstitution

Run before substantial work.

`PREFLIGHT → INSPECT → LOAD → RECONCILE → VALIDATE → DECLARE`

## PREFLIGHT
Confirm repository, branch, runtime, permissions and deployment target.

## INSPECT
Read root state files and current repository tree. Check current Vercel/project state when deployment work is involved.

## LOAD
Read `AGENTS.md`, `STATE.md`, `CONTEXT.md`, `PLAN.md`, `TODO.md`, `ARD.md`, `PRD.md`, `SNAPSHOT.md`.

## RECONCILE
Evidence overrides stored state; stored state overrides assumptions. Identify drift between repository, deployment and docs.

## VALIDATE
Confirm product ontology remains: Foundry builds Atlases from repositories; RepoGraph remains canonical.

## DECLARE
- `READY` — coherent, no blocker
- `READY_WITH_WARNINGS` — usable with known drift
- `BLOCKED` — required dependency/authority missing

Update `STATE.md` only when reality materially changed.
