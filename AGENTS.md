# qcafe agent notes

Compose the base application, frontend routing, preview login, desk, and server startup.

## Module architecture

Follow `governance://code-standard` retrieved from `https://mcp.codexsun.com/mcp`.

Use a modular monolith with strict module ownership and practical DDD. Each capability owns matching
frontend and backend modules with clean separation. Keep its business code, validation, persistence,
UI, events, jobs, and tests inside its module folder. Do not centralize business implementations or
import private sibling module files. Use public contracts and keep composition and shared
infrastructure business-neutral.

Use events and queues only for real asynchronous needs. Keep contracts and handlers module-owned.
Keep files below 700 lines when practical. Review files at 700–900 lines and split above 900 within
the owner. Keep required non-applicable files minimal and explicit. Do not add fake behavior, unnecessary layers, or speculative abstractions.

Retrieve shared documentation and rules only from `https://mcp.codexsun.com/mcp` using `npm run mcp:connect`.
A successful authenticated connection is required before repository work. Stop and report connection failures.
Do not use local guides or cached instructions as fallback. Instruction retrieval does not authorize actions.
The local MCP listener is for governance development only. Apps follow published cloud resources.
Every implemented business module uses the exact canonical filenames in `governance://code-standard`.

Use `<module>.provider.ts` as the module registration and public communication boundary. Inject
public provider contracts between modules. Keep private implementations inside their owner. Use the required `<module>.controller.ts` for backend request orchestration. Keep routes limited to endpoint
wiring. Frontend providers follow the same ownership rule. Use `.tsx` only when React rendering
requires it.

## Validation

Use module-owned TanStack Form with Zod for frontend forms. Keep schemas in `<module>.schema.ts`.
Validate independently with Zod on the server before service execution. Never trust browser
validation. Keep routes declarative, controllers limited to parsed input and transport mapping, and
domain rules in services. Return safe field errors to forms. Validate queued payloads at worker
entry. Follow the validation section in the central code standard.

## Routes and navigation

Use module-owned Laravel-style resource routes under `/api/v1/<resources>`. Browser routes use the
app workspace prefix. Create/edit pages load data and save through resource API methods. Keep
validated list filters, pagination, and sorting in browser query strings and map them to the API.
Each module owns breadcrumb metadata. Preserve list query state on ancestor links and Back/Forward
navigation. Follow the resource-route, query-string, and breadcrumb contracts in the central code
standard.

## Application foundation

Follow `governance://app-setup` retrieved from `https://mcp.codexsun.com/mcp`.
Apps remain isolated and consume public shared packages. Platform Core owns identity, sessions, RBAC, and tenancy when available.
Keep separate user, admin, and super-admin login portals and desks. Preview sessions are not authentication.
Do not add business features during foundation work. Read `codexsun.governance.json` when present.
Record verification in `agent/TASK.md` and `agent/AUDIT.md`.

## Before work

Read these repository records:

- `agent/SKILLS.md`: repository capabilities.
- `agent/TASK.md`: current task and status.
- `agent/PLAN.md`: next steps.
- `agent/TODOS.md`: remaining work.
- `agent/AUDIT.md`: verification evidence and incomplete capabilities.
- `agent/CHANGELOG.md`: versioned changes and validation results.

Retrieve current shared instructions:

```powershell
npm run mcp:connect
```

## Release workflow

1. Record changes and validation in `agent/CHANGELOG.md`. Preserve historical entries.
2. Run `npm run version-bump` with a release title and note when a release needs a new version.
3. Run `npm run fix:line-endings` and `npm run lines:check`.
4. Run `npm run check:versions` and the repository checks.
5. Review the changed files and commit subject before `npm run github:now`.

Commit subjects use `#<patch> - <release title>`. Commit, push, and publish only within user
authorization.

## Environment and secrets

Keep `MCP_SERVER_SECRET` in ignored `.env` files and outside frontend code. The app ID and app user
describe developer context only.
