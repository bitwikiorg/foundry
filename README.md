# BITwiki Foundry

**Foundry maps repositories into usable knowledge.**

Foundry is the control plane. It reads a submitted public GitHub repository as immutable evidence, builds a canonical RepoGraph, coordinates bounded specialist agents, and publishes the durable result to **[BITwiki Atlas](https://github.com/bitwikiorg/atlas)**.

```text
bitwikiorg/foundry
  control plane + public site
        ↓ reads
submitted public repository
  pinned SHA · read only
        ↓ publishes
bitwikiorg/atlas
  durable generated knowledge
```

A repository job never writes to the submitted repository or back into Foundry. Generated repository knowledge belongs only in Atlas under its documented publication contract.

The Foundry Vercel site does not need a per-repository deployment: it reads Atlas's public `index.json` through `/api/atlas-index`, so a verified Atlas publication becomes visible through the existing site.

## Core rule

> Analyze once into a canonical graph. Generate human and machine views from the same pinned evidence.

## Boundaries

- **Foundry:** control plane, public UI, planning and operational state.
- **Source repository:** public, pinned, read-only evidence input.
- **Atlas:** templates, schemas, public index, immutable generated versions and current pointers.

See Atlas [`PUBLISHING.md`](https://github.com/bitwikiorg/atlas/blob/main/PUBLISHING.md) for the generated-output contract.
