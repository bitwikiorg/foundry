# TODO.md — BITwiki Foundry

## P0 — public front door
- [x] Public Atlas index shell with filters and empty state.
- [x] Repository + email submission UI and explicit indexing consent modal.
- [x] Separate optional marketing consent.
- [x] Define Atlas index schema and zero-state network statistics.
- [x] Add submission API contract with no-PII-log behavior.
- [ ] Connect `SUBMISSION_WEBHOOK_URL` to durable intake storage / agent queue.
- [ ] Add rate limiting, bot protection, abuse controls, and duplicate-repo detection.
- [ ] Implement Foundry Judge admission criteria and auditable rejection reasons.
- [ ] Add confirmation/status email workflow and unsubscribe handling.
- [ ] Add privacy/terms pages to the rendered site.
- [ ] Connect first-party analytics for Atlas impressions and conversion funnel.

## P0 — ingestion spine
- [ ] Define RepoGraph + GraphDelta schemas in code.
- [ ] Clone/fetch repository and pin immutable commit snapshot.
- [ ] Inventory files/languages/packages.
- [ ] Add initial symbol/import/dependency extraction.
- [ ] Attach source locations and evidence hashes.
- [ ] Implement graph ranking/clustering.

## P1 — first Atlas
- [ ] Architecture synthesis agent.
- [ ] Docs planner and section-agent contracts.
- [ ] Evidence-backed DocUnit generation.
- [ ] Mermaid architecture/dependency views.
- [ ] Docusaurus Atlas template.
- [ ] Initial themes: minimal, blueprint, terminal, paper, midnight, signal.
- [ ] Machine outputs: sitemap, robots, llms, graph, docs index, provenance.
- [ ] Publish Atlas metrics: freshness, source commit, coverage, confidence, stars, views.

## P2 — factory
- [ ] FAQ materialized answer cache.
- [ ] Verifier + auditor gates.
- [ ] Research agent for external/contextual claims.
- [ ] Style agent constrained by ThemePreset.
- [ ] Incremental invalidation.
- [ ] Atlas registry + hosting automation.
- [ ] Transparent Foundry Score with component scores and confidence.

## P3 — richer visualization
- [ ] interactive dependency/call graph
- [ ] complexity/maintainability heatmap
- [ ] churn/change coupling
- [ ] code timeline
- [ ] code-city/treemap
- [ ] reading-path/onboarding maps
