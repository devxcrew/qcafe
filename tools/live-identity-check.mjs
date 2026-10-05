import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { access } from "node:fs/promises";
import { resolve } from "node:path";

await access(resolve(process.env.DB_SQLITE_PATH ?? "storage/qcafe.sqlite"));
const probe = createServer();
probe.listen(0, "127.0.0.1");
await once(probe, "listening");
const port = probe.address().port;
await new Promise((done) => probe.close(done));
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["dist/api/index.js"], {
  env: {
    ...process.env,
    APP_PORT: String(port),
    APP_HOST: "127.0.0.1",
    APP_URL: base,
    APP_MODE: "production",
  },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});
const sessions = [];
let startupTimer;
try {
  await Promise.race([
    once(child.stdout, "data"),
    once(child, "exit").then(() => {
      throw new Error("Live verification server failed to start.");
    }),
    new Promise((_, reject) => {
      startupTimer = setTimeout(
        () => reject(new Error("Live verification startup timed out.")),
        10_000,
      );
    }),
  ]);
  clearTimeout(startupTimer);
  assert.equal((await request("/health/ready")).status, 200);
  for (const [portal, key, desk] of [
    ["user", "USER", "/desk"],
    ["admin", "ADMIN", "/admin/desk"],
    ["super-admin", "SUPER_ADMIN", "/sa/desk"],
  ]) {
    const email = process.env[`IDENTITY_SEED_${key}_EMAIL`];
    const password = process.env[`IDENTITY_SEED_${key}_PASSWORD`];
    if (!email || !password)
      throw new Error(`Configure verification credentials for the ${portal} portal.`);
    const prefix = `/api/v1/identity/${portal}`;
    const login = await request(`${prefix}/sessions`, "POST", {
      email,
      password,
      tenantId: process.env.IDENTITY_TENANT_ID ?? "default",
    });
    assert.equal(login.status, 201, `${portal} configured account login failed`);
    const cookie = login.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie, "Portal session cookie missing");
    sessions.push({ prefix, cookie });
    assert.equal((await request(desk, "GET", undefined, cookie)).status, 200);
    for (const resource of portal === "user"
      ? ["profile", "sessions"]
      : [
          "users",
          "organizations",
          "memberships",
          "roles",
          "permissions",
          "sessions",
          "audit-events",
          "invitations",
          "profile",
          "settings",
        ]) {
      const response = await request(`${prefix}/${resource}`, "GET", undefined, cookie);
      assert.equal(response.status, 200, `${portal} ${resource} read failed`);
      assert.ok((await response.json()).data != null, `${resource} data missing`);
    }
    if (portal === "super-admin") {
      for (const resource of ["application-settings", "security-settings"]) {
        assert.equal(
          (await request(`${prefix}/${resource}`, "GET", undefined, cookie)).status,
          200,
        );
      }
    }
    console.info(`${portal}: configured SQLite login, desk and permitted resource reads passed.`);
  }
} finally {
  clearTimeout(startupTimer);
  for (const { prefix, cookie } of sessions) {
    await request(`${prefix}/sessions/current`, "DELETE", undefined, cookie).catch(() => {});
  }
  if (child.exitCode === null && child.signalCode === null) {
    const stopped = once(child, "exit");
    child.kill();
    await stopped;
  }
}

function request(path, method = "GET", body, cookie = "") {
  return fetch(base + path, {
    method,
    redirect: "manual",
    signal: AbortSignal.timeout(10_000),
    headers: { Origin: base, Cookie: cookie, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}
