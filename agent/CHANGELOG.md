# Changelog

## Version State

Current version: 0.1.4

Release tag: v-0.1.4

Changelog label: v 0.1.4

## v-0.1.4

### [v 0.1.4] 2026-10-05 8:37 am - Align workspace packages

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Align maintenance tooling with @devxcrew/tools@0.1.8 and record the verified workspace package set.

## v-0.1.3

### [v 0.1.3] 2026-10-05 7:58 am - Adopt Framework and UI package names

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Use the public @devxcrew/framework and @devxcrew/ui packages. Preserve module ownership and existing behavior.

## v-0.1.2

### [v 0.1.2] 2026-10-04 5:00 pm - Align Qcafe foundation delivery

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Align standalone maintenance, CI and public shared package boundaries. Preview sessions remain unauthenticated.

## v-0.1.1

### [v 0.1.1] 2026-10-03 10:14 am - Publish verified application foundation

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Release isolated foundation, published npm packages, live MCP audit, local configuration, and working GitHub CI.

## v-0.1.0

### [v 0.1.0] 2026-10-03 9:45 am - Create QCafe foundation

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Create an isolated Cxsun-compatible foundation with published shared packages and live MCP guidance.

#### Verification

- Passed full verification, production smoke, live MCP metadata, development startup, and browser preview flows.
- Record the npm installation workaround and pending Platform Core capabilities in AUDIT.md.

## Release verification 0.1.1 — 2026-10-03

- Passed maintenance checks, lint, typechecks, three tests, production build, smoke checks, and direct package verification.
- Tools passed all 21 tests. Version-bump and line-fixing commands completed successfully.
- Prepared GitHub repository and CI checkout paths for sibling maintenance tools.
- Commit subject: #1 - Publish verified application foundation.

## Standalone development review — 2026-10-03

- Documented environment setup, intentional cloud requirements, and optional local package development.
- Recorded passing workspace checks and failing isolated maintenance checks in AUDIT.md.
- Recorded incomplete clean installs and unsupported desktop/Docker workflows.
- Preserved release version and history. No release was requested.

## Standalone implementation — 2026-10-03

- Consume published Tools 0.1.7 through installed commands and remove sibling maintenance script paths.
- Use a single-repository CI checkout and add environment/MCP setup.
- Remove unsupported desktop and Docker scripts while preserving dependencies.
- Add clear optional source errors and CODEXSUN_SHARED_ROOT support.
- Passed full workspace and isolated verification, browser preview flows, port handling, and restart checks.
- Document one clean install of the identical shared dependency graph, then sequential per-app ownership.
- Preserve this app's release version. No commit or push was performed.

### Package migration verification - 2026-10-05

- Passed 3 tests, owner verification and applicable package checks.
- All six application lockfiles use exact Framework 0.1.8 and UI 0.2.0 registry artifacts.
- Two fresh registry apps passed 44 tests each, live SQLite and cross-app session denial.
- The gallery passed source and isolated registry verification with bundle budgets.
- Browser, real SMTP and production deployment acceptance remain separate.

## Dependency alignment - 2026-10-05

- [x] Align consumed shared packages and common direct dependency versions.
- [x] Install dependencies with lifecycle scripts disabled.
- [x] Keep app dependency ownership and public peer ranges.
- [x] Exclude Veyrezio from this change.

Source version: 0.1.4. Published package archives retain their existing versions.
The baseline is recorded in projects/cxsun/agent/DEPENDENCY-BASELINE.json.
