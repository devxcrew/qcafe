# Current task

## Q Cafe data-scope refinement - 2026-10-05

- [x] Review POS, takeaway, KOT, booking, client, offline-sync, and settlement coverage.
- [x] Refine the table inventory and add operation deduplication, payment allocation, payout matching, and receipt tender links.
- [x] Separate operational day close from external accounting and general-ledger scope.
- [ ] Confirm legal, tax, payment, identity, desktop runtime, and accounting contracts before schema implementation.

## Package migration - 2026-10-05

- [x] Retrieve authenticated cloud governance before this migration.
- [x] Update active package imports, helpers and manifests to the shorter public names.
- [x] Install and verify the published registry packages.
- [x] Commit and push the reviewed migration.


## Completion wave - 2026-10-04

Source 0.1.2 was committed and pushed. Release verification and GitHub CI passed. Preview sessions are not authentication. Platform migration depends on the accepted coordinated release. Business features require owner requirements.

- [x] Reconcile current status with the GitHub source release and latest owner audit.
- [x] Retrieve fresh authenticated cloud governance before this wave.
- [x] Record current source and foundation dependencies.
- [ ] Migrate this app to the accepted Cxsun foundation after its registry and interaction gates close.

Use projects/cxsun/agent/REMAINING-WORK.md for ordered cross-owner dependencies.
Production deployment and real SMTP acceptance remain deferred. No pending external gate is marked complete.

## Prior records

Complete standalone development for qcafe.

## Completed

Installed @devxcrew/tools@0.1.7 from npm. Maintenance scripts and CI require no sibling checkout.
Workspace and isolated verification, browser flows, port handling, and restart checks passed.
Environment setup and optional source development commands are documented in README.md.

## Verification limits

One clean install validated the identical dependency graph used by all five apps.
Each isolated app owned that installation during its verification. Five separate clean installs are not claimed.
Read AUDIT.md for evidence and prerequisites. Revised CI has not run on GitHub yet.

App release versions are unchanged. These implementation changes are local and uncommitted.
Real identity and business capabilities remain outside this task.
## Workspace GitHub release - 2026-10-04

Release title: Align Qcafe foundation delivery.
Align standalone maintenance, CI and public shared package boundaries. Preview sessions remain unauthenticated.
Update version records, review release checks, then commit and push the current owner branch.
Preserve existing task history and incomplete acceptance gates.

## Dependency alignment - 2026-10-05

- [x] Align consumed shared packages and common direct dependency versions.
- [x] Install dependencies with lifecycle scripts disabled.
- [x] Keep app dependency ownership and public peer ranges.
- [x] Exclude Veyrezio from this change.

Source version: 0.1.4. Published package archives retain their existing versions.
The baseline is recorded in projects/cxsun/agent/DEPENDENCY-BASELINE.json.
