# Verification evidence

## Package migration - 2026-10-05

- [x] Retrieve authenticated cloud governance before this migration.
- [x] Update active package imports, helpers and manifests to the shorter public names.
- [x] Install and verify the published registry packages.
- [x] Commit and push the reviewed migration.


## Passed — 2026-10-03

- Live authenticated MCP instructions and deployed repository metadata for qcafe.
- App ID, package identity, registry lock entries, ignored environment files, and configured-secret scan.
- npm run verify: dependency boundaries, release metadata, LF, lint, frontend/backend typechecks, three tests, production build, and route/assets/API smoke checks.
- Development startup on the configured app port through Tools preflight and live MCP retrieval.
- Browser home, preview login, desk rendering, and logout. No captured console errors.
- Billing desk refresh retained its preview session. CRM and QCafe direct desks required their own preview sessions.

## Installation limitation

- npm ci and its cached retry were interrupted after prolonged dependency extraction.
- Each app received an independent copy of Cxsun's verified registry installation. No dependency directory is linked to Cxsun.
- The registry lockfile remains unchanged. Clean npm ci completion in each new app is unverified.
- An early Billing lint attempt failed during copying. The completed installation passed full verification afterward.

## Pending capabilities

- Real authentication, RBAC, persistence, tenancy, and three authenticated identity desks need Platform Core.
- Business features are outside this foundation task.
- GitHub remotes, commits, and pushes were not requested.

## Live MCP access audit — 2026-10-03

- GREEN: authenticated live connection, matching repository metadata, five guidance resources, and all three MCP tools.
- Passed fresh live instruction retrieval through the project development startup hook.
- Central evidence: shared/mcp-governance/docs/mcp-access-audit.md.

## Release 0.1.1 — 2026-10-03

- Passed npm run verify and npm run packages:check.
- Passed Tools tests (21), version alignment, line-ending checks, and repository configuration review.
- GitHub CI now checks out the required sibling repositories and creates an environment file from the example.
- Authorized commit and push use github:now with no additional version bump.

## Standalone development audit — 2026-10-03

### Passed

- Authenticated live MCP connection from this repository.
- Workspace npm run verify: maintenance, lint, typechecks, three tests, build, and production HTTP smoke.
- npm run packages:check: all 45 direct packages resolved.
- Runtime Framework, UI, and Tools references resolve installed npm packages.
- Environment initialization preserves existing .env files by source inspection.

### Failed

- An isolated clone outside D:\codexsun cannot resolve ../../shared/mcp-governance/client/repository.mjs.
- Maintenance and the complete verify script require sibling Tools and MCP Governance repositories.
- Installed npm Tools 0.1.3 hardcodes assist/documentation/CHANGELOG.md. This app uses agent/CHANGELOG.md.
- Current CI checks out sibling repositories, so green CI does not prove standalone maintenance.

### Partial and untested

- Clean npm ci attempts in five independent clones were stopped during slow dependency extraction.
- No linked node_modules or dependency-copy workaround was used. These clean installs did not complete.
- Fresh-clone runtime startup and browser interaction remain untested. Workspace production HTTP smoke passed.
- Desktop and Docker commands have no Tauri scaffold or Compose configuration.
- Valid cloud credentials, live MCP availability, matching APP_PORT/APP_URL, and a free port remain prerequisites.
- UIUX is a separate source gallery with an intentional sibling UI dependency. It is not a standalone project app.

### Next correction

Publish the newer Tools package with agent changelog support. Replace sibling maintenance wrappers with installed package commands.
Change CI to check out only this app, then repeat clean installation, full verification, development startup, and browser checks.
Do not mark standalone development green until those checks pass.

README setup and limitations were corrected locally. No package version, commit, push, or npm publication was performed.

## Standalone implementation completed — 2026-10-03

This section resolves the earlier sibling-maintenance and incomplete runtime findings.

### Passed

- Published @devxcrew/tools@0.1.7 and installed its registry tarball in this app.
- Replaced all sibling maintenance wrappers with installed devxcrew-tools commands.
- Removed unsupported desktop and Docker scripts. Dependencies were preserved.
- CI now checks out only this app. Added setup for environment initialization and live MCP verification.
- Workspace and isolated npm run verify passed, including three tests, lint, types, build, and production HTTP smoke.
- Isolated direct package checks, development MCP retrieval, home/login/desk HTTP routes, and API 404 boundary passed.
- Browser home, preview login, desk, refresh, logout, and desk redirect after logout passed. No captured console errors.
- Occupied-port startup failed safely and preserved the running app. Owned test process shutdown released its port. Subsequent startup passed.
- Version checks, version-bump dry runs, LF checks, version display, and github:now dry runs passed outside the workspace.
- Missing optional source folders produced a clear error. CODEXSUN_SHARED_ROOT supports another source location.

### Installation evidence

- One clean npm ci completed in the isolated Cxsun clone. All five normalized dependency lock graphs were identical.
- That complete installation was moved into each app's own node_modules folder for sequential verification.
- There were no linked dependency directories and no workspace sibling package resolution.
- Five separate clean installs are not claimed. Earlier parallel attempts remain historical incomplete evidence.
- npm blocked optional core-js and msgpackr-extract install scripts. Full checks and development worked under that policy.
- Cxsun frontend hot reload passed after an isolated source edit and restoration. Hot reload was not repeated for the other apps.

### Limits

- Valid live MCP credentials, network access, matching APP_PORT/APP_URL, and an available port remain required.
- Real identity, RBAC, tenancy, and three authenticated desks remain pending Platform Core. Preview sessions are not authentication.
- UIUX retains its intentional sibling UI source dependency.
- The revised GitHub workflow was verified through equivalent isolated local commands. It has not run on GitHub yet.
- No Git commit or push was performed for these implementation changes. App versions remain unchanged.

Evidence: agent/STANDALONE.md in Cxsun and isolated logs at D:\codexsun-standalone-verification\2026-10-03\<app>.
# Workspace GitHub release - 2026-10-04

User authorization: update versions and changelogs, then commit and push all workspace repositories.
Align standalone maintenance, CI and public shared package boundaries. Preview sessions remain unauthenticated.
Authenticated MCP connection passed for this owner before release work.
This delivery covers GitHub source. Npm publication, production deployment and real email acceptance remain separate gates.

## GitHub release verification - 2026-10-04

Version 0.1.2: npm run verify passed. 3 tests, lint, types, build and production smoke. Authenticated cloud governance connection and configured-secret scan passed. GitHub source delivery is authorized; npm publication and deployment are outside this release.
