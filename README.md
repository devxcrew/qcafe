# QCafe

An isolated application foundation based on Cxsun.

## Flow

Home (`/`) → preview login (`/login`) → desk (`/desk`).
Preview sessions are frontend-only. Real authentication, tenancy, persistence, and business APIs are pending.
The target foundation has user, admin, and super-admin portals owned by Platform Core.

## Run

Use the Node and npm versions declared in package.json.
The app runs at http://127.0.0.1:5176.

```powershell
npm ci
npm run mcp:verify
npm run verify
npm run dev
```

Framework and UI are installed from npm. Maintenance commands use sibling Tools and MCP Governance source.
Development retrieves authenticated guidance before starting the server. Production starts independently.

## Environment

Copy .env.example to .env on a new machine. Set MCP_SERVER_SECRET in the ignored file.
APP_ID is qcafe. APP_NAME, APP_PORT, APP_URL, and APP_MODE configure this application.
Shared guidance comes from https://mcp.codexsun.com/mcp. Do not use cached guidance as a fallback.

## Package development

- `npm run packages:local`: install sibling package snapshots without changing release manifests.
- `npm run packages:npm`: restore packages using npm version ranges.
- `npm ci`: restore exact locked npm packages.

Re-run the snapshot command after shared package edits. UIUX remains the separate UI source gallery.

## Repository records

Read AGENTS.md and agent/SKILLS.md, PLAN.md, TASK.md, AUDIT.md, and CHANGELOG.md before work.
Use version-bump, fix:line-endings, lines:check, and check:versions for maintenance.
Use github:now only for an authorized commit and push. GitHub: https://github.com/devxcrew/qcafe.
