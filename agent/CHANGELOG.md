# Changelog

## Version State

Current version: 0.1.2

Release tag: v-0.1.2

Changelog label: v 0.1.2

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
