# QCafe

An isolated application foundation with npm Framework and UI packages.

## Current flow

Home (`/`) → preview login (`/login`) → desk (`/desk`).
Preview sessions are frontend-only. Real authentication, RBAC, tenancy, and business APIs are pending.

## Development setup

Use Node 26.10.0 or newer and npm 12.2.0 or newer.

1. Run `npm ci` to install the locked packages.
2. Run `npm run tools:env` to create `.env`. Existing configuration is preserved.
3. Set `MCP_SERVER_SECRET` in the ignored `.env` file.
4. Run `npm run mcp:verify` to check the authenticated live connection.
5. Run `npm run dev` to start this app.

The default URL is http://127.0.0.1:5176.
Set APP_PORT and APP_URL together when the port is occupied.
Port preflight preserves other applications and stops startup on a port conflict.
APP_NAME, APP_HOST, and APP_MODE configure the server. APP_ID is qcafe.

Development requires https://mcp.codexsun.com/mcp and a valid secret.
There is no offline or cached guidance fallback. Production startup does not retrieve MCP guidance.
Never place MCP_SERVER_SECRET in frontend code or Git.

## Verification

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:production`.
Run `npm run packages:check` to check the installed package boundaries.
After a build, `npm run start` serves the production frontend.
Set APP_MODE=production in the server environment before production startup.

## Standalone commands

Runtime and maintenance use installed npm packages. No sibling checkout is required.
Run `npm run setup` after setting the cloud secret to initialize configuration and verify MCP.
Run `npm run verify` for maintenance, lint, types, tests, build, and production smoke checks.
CI checks out only this app.
Desktop and Docker commands are deferred until their scaffolds are implemented.

## Shared package development

Normal installs use public @devxcrew/core-framework and @devxcrew/react-ui npm packages.

- `npm run packages:local`: install optional sibling source snapshots without changing release manifests.
- `npm run packages:npm`: restore registry package ranges.
- `npm ci`: restore exact locked registry packages.

Only packages:local requires Framework and UI source repositories.
Set CODEXSUN_SHARED_ROOT when these repositories are outside the default shared directory.
UIUX is a separate gallery for shared UI source development.

## Repository records and maintenance

Read AGENTS.md and every Markdown record in agent before work.
Retrieve current rules through `npm run mcp:connect`.
Use version-bump, fix:line-endings, lines:check, and check:versions for release maintenance.
Maintain agent/CHANGELOG.md and use commit subjects `#<patch> - <release title>`.
Use github:now only for an authorized commit and push.

GitHub: https://github.com/devxcrew/qcafe.
