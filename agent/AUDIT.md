# Verification evidence

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
