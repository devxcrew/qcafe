import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { startDevelopment } from "../tools/dev.mjs";
import { refreshGovernance } from "../tools/governance.mjs";

test("failed cloud guidance prevents the development process from starting", async (t) => {
  const root = mkdtempSync(resolve(tmpdir(), "qcafe-governance-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("cloud unavailable");
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  await assert.rejects(
    startDevelopment({
      root,
      env: { MCP_SERVER_SECRET: "test-secret", APP_ID: "qcafe", APP_USER: "developer" },
      command: process.execPath,
      args: ["-e", "require('node:fs').writeFileSync('started', 'yes')"],
      stdio: "ignore",
    }),
    /connection is required/,
  );
  assert.equal(existsSync(resolve(root, "started")), false);
  assert.equal(existsSync(resolve(root, ".cache/governance/instructions.json")), false);
});

test("missing configuration and local endpoints fail without cached fallback", async (t) => {
  const root = mkdtempSync(resolve(tmpdir(), "qcafe-governance-missing-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  await assert.rejects(refreshGovernance({}, root), /connection is required/);
  await assert.rejects(
    refreshGovernance({ MCP_SERVER_URL: "http://127.0.0.1:7310/mcp" }, root),
    /connection is required/,
  );
  assert.equal(existsSync(resolve(root, ".cache/governance/instructions.json")), false);
});
