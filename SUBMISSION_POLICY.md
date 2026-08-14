# SUBMISSION_POLICY.md — BITwiki Foundry

## Scope

Foundry currently accepts public GitHub repositories.

A submission is a request for review, not a promise of indexing or publication. A Foundry Admission Judge may reject, defer or route repositories for manual review when they are private, inaccessible, unsafe to process, primarily generated spam, clearly malicious, legally restricted, technically unsupported, too large for current capacity, or below the current inclusion threshold.

Accepted repositories enter a capacity-limited queue and are processed when workers are available.

## Public indexing

If accepted, Foundry may analyze the public repository and publish a BITwiki Atlas containing generated documentation, source-linked summaries, code graphs, diagrams, ratings, metadata and machine-readable interfaces. Published Atlases may be cached and re-indexed as the public repository changes.

Do not submit repositories containing credentials, secrets, confidential material, private code or material you are not authorized to submit.

## Safety review

Repository content is treated as untrusted data. Foundry may sanitize or quarantine repository content that attempts to manipulate automated analysis, expose secrets or provide instructions to internal agents. Safety review is separate from the admission decision about technical fit and available capacity.

## Email

Email is collected to send submission, acceptance, rejection, processing, publication, correction or removal status related to the submitted repository.

Marketing consent is separate and optional. When explicitly selected, BITwiki may also send occasional Foundry/BITwiki product news or newsletters. Marketing messages must provide an unsubscribe mechanism.

Do not expose submitter email addresses in the public Atlas or public queue.

## Removal and correction

Repository owners or affected parties may request correction or removal through the Foundry GitHub issue tracker. Requests should be reviewed against provenance and current repository state.

## Data minimization

Store only what the intake and notification workflow requires: normalized repository URL, contact email, consent flags, timestamps, review status, queue state and operational audit metadata. Avoid logging email addresses or form bodies in application logs.
