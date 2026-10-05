import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { verifyIdentityResources } from "../src/api/identity/identity.acceptance.mjs";
import {
  verifyIdentityResponsePrivacy,
  verifyIdentitySessionCookie,
  verifyIdentityLoginLimit,
} from "../src/api/identity/identity.security-acceptance.mjs";

const directory = await mkdtemp(join(tmpdir(), "qcafe-identity-"));
const probe = createServer();
probe.listen(0, "127.0.0.1");
await once(probe, "listening");
const port = probe.address().port;
await new Promise((resolveClose) => probe.close(resolveClose));
const base = `http://127.0.0.1:${port}`;
const password = randomBytes(24).toString("base64url");
const privateCredentials = new Set([password]);
const environment = {
  ...process.env,
  APP_NAME: "QCafe",
  APP_MODE: "production",
  APP_ID: "qcafe",
  APP_HOST: "127.0.0.1",
  APP_PORT: String(port),
  APP_URL: base,
  DB_SQLITE_PATH: join(directory, "identity.sqlite"),
  IDENTITY_MODE: "single-client",
  IDENTITY_TENANT_ID: "default",
  IDENTITY_SEED_USER_EMAIL: "user@example.test",
  IDENTITY_SEED_USER_NAME: "Test User",
  IDENTITY_SEED_USER_PASSWORD: password,
  IDENTITY_SEED_ADMIN_EMAIL: "admin@example.test",
  IDENTITY_SEED_ADMIN_NAME: "Test Admin",
  IDENTITY_SEED_ADMIN_PASSWORD: password,
  IDENTITY_SEED_SUPER_ADMIN_EMAIL: "super@example.test",
  IDENTITY_SEED_SUPER_ADMIN_NAME: "Test Super",
  IDENTITY_SEED_SUPER_ADMIN_PASSWORD: password,
};
let child;
const cookies = {};
try {
  for (const command of ["migrate", "seed", "migrate", "seed"]) {
    const result = spawnSync(process.execPath, ["dist/api/database/database.command.js", command], {
      env: environment,
      encoding: "utf8",
      windowsHide: true,
    });
    assert.equal(result.status, 0, `Compiled database ${command} failed`);
  }
  const invalidEmail = spawnSync(process.execPath, ["dist/api/index.js"], {
    env: { ...environment, EMAIL_ENABLED: "1", SMTP_HOST: "", SMTP_PORT: "invalid" },
    encoding: "utf8",
    windowsHide: true,
    timeout: 10_000,
  });
  assert.notEqual(invalidEmail.status, 0);
  assert.match(invalidEmail.stderr, /startup failed during email configuration/);
  assert.doesNotMatch(invalidEmail.stderr, /Identity database is not ready/);
  await start();
  const endpoint = base + "/api/v1/identity/user/sessions";
  assert.equal(
    (
      await fetch(endpoint, {
        method: "POST",
        headers: { Origin: base, "Content-Type": "application/json" },
        body: "{",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await fetch(endpoint, {
        method: "POST",
        headers: { Origin: base, "Content-Type": "text/plain" },
        body: "{}",
      })
    ).status,
    415,
  );
  assert.equal(
    (
      await request("/api/v1/identity/user/sessions", "POST", {
        email: "user@example.test",
        password: "x".repeat(17000),
      })
    ).status,
    413,
  );
  assert.equal((await request("/desk/")).status, 302);
  for (const route of ["/", "/login", "/admin/login", "/sa/login"]) {
    const response = await request(route);
    assert.equal(response.status, 200);
    assert.ok((await response.text()).includes('id="root"'));
  }
  for (const [portal, email, desk, login] of [
    ["user", "user@example.test", "/desk", "/login"],
    ["admin", "admin@example.test", "/admin/desk", "/admin/login"],
    ["super-admin", "super@example.test", "/sa/desk", "/sa/login"],
  ]) {
    const anonymous = await request(desk);
    assert.equal(anonymous.status, 302);
    assert.equal(anonymous.headers.get("location"), login);
    const response = await request(`/api/v1/identity/${portal}/sessions`, "POST", {
      email,
      password,
    });
    assert.equal(response.status, 201);
    verifyIdentitySessionCookie(response.headers.get("set-cookie"), portal);
    cookies[portal] = response.headers.get("set-cookie").split(";")[0];
    const principal = (await response.json()).data;
    assert.equal(principal.portal, portal);
    assert.equal(principal.appId, "qcafe");
    assert.equal(principal.tenant.id, "default");
    assert.equal((await request(desk, "GET", undefined, cookies[portal])).status, 200);
  }
  await verifyIdentityResources(request, cookies, password);
  const denied = await request("/api/v1/identity/admin/sessions", "POST", {
    email: "user@example.test",
    password,
  });
  assert.equal(denied.status, 401);
  const reused = cookies.user.replace("_user_", "_admin_");
  assert.equal(
    (await request("/api/v1/identity/admin/sessions/current", "GET", undefined, reused)).status,
    401,
  );
  assert.equal(
    (
      await request("/api/v1/identity/user/sessions", "POST", {
        email: "user@example.test",
        password,
        tenantId: "foreign",
      })
    ).status,
    401,
  );
  assert.equal(
    (await request("/api/v1/identity/user/sessions", "POST", { email: "bad", password: "x" }))
      .status,
    422,
  );
  assert.equal(
    (
      await request(
        "/api/v1/identity/user/sessions",
        "POST",
        { email: "user@example.test", password },
        "",
        "https://untrusted.example",
      )
    ).status,
    403,
  );
  await stop();
  await start();
  const persistedSettings = await request(
    "/api/v1/identity/admin/settings",
    "GET",
    undefined,
    cookies.admin,
  );
  assert.equal(persistedSettings.status, 200);
  assert.equal((await persistedSettings.json()).data.displayName, "Acceptance Workspace");
  assert.equal(
    (await request("/api/v1/identity/user/sessions/current", "GET", undefined, cookies.user))
      .status,
    200,
  );
  assert.equal(
    (await request("/api/v1/identity/user/sessions/current", "DELETE", undefined, cookies.user))
      .status,
    204,
  );
  assert.equal(
    (await request("/api/v1/identity/user/sessions/current", "GET", undefined, cookies.user))
      .status,
    401,
  );
  assert.equal((await request("/desk", "GET", undefined, cookies.user)).status, 302);
  assert.equal(
    (await request("/api/v1/identity/admin/sessions/current", "GET", undefined, cookies.admin))
      .status,
    200,
  );
  const changedPassword = randomBytes(24).toString("base64url");
  privateCredentials.add(changedPassword);
  assert.equal(
    (
      await request(
        "/api/v1/identity/admin/password",
        "PATCH",
        { currentPassword: password, password: changedPassword },
        cookies.admin,
      )
    ).status,
    204,
  );
  assert.equal(
    (await request("/api/v1/identity/admin/sessions/current", "GET", undefined, cookies.admin))
      .status,
    401,
  );
  assert.equal(
    (
      await request("/api/v1/identity/admin/sessions", "POST", {
        email: "admin@example.test",
        password,
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request("/api/v1/identity/admin/sessions", "POST", {
        email: "admin@example.test",
        password: changedPassword,
      })
    ).status,
    201,
  );
  assert.equal((await request("/api/v1/identity/unknown/sessions/current")).status, 404);
  const limitedLogin = await verifyIdentityLoginLimit(request, password);
  await stop();
  await start();
  assert.equal((await request(limitedLogin.path, "POST", limitedLogin.body)).status, 429);
  console.info(
    "Compiled identity privacy, scoped cookie flags and restart-persistent login limits passed.",
  );
  await stop();
  const database = new DatabaseSync(environment.DB_SQLITE_PATH, { readOnly: true });
  try {
    assert.equal(database.prepare("SELECT count(*) AS count FROM identity_users").get().count, 4);
    assert.ok(
      database
        .prepare("SELECT password_hash FROM identity_users")
        .all()
        .every(
          (row) => row.password_hash.startsWith("scrypt$") && !row.password_hash.includes(password),
        ),
    );
    assert.ok(
      database
        .prepare("SELECT token_hash FROM identity_sessions")
        .all()
        .every((row) => /^[a-f0-9]{64}$/.test(row.token_hash)),
    );
    assert.equal(database.prepare("PRAGMA integrity_check").get().integrity_check, "ok");
  } finally {
    database.close();
  }
  const manifest = JSON.parse(await readFile(resolve("package.json"), "utf8"));
  assert.match(manifest.dependencies["@devxcrew/platform"], /^\d+\.\d+\.\d+$/);
  console.info(
    "Compiled QCafe identity passed: three portals, role/tenant denial, durable sessions, logout, password change, validation, and database integrity.",
  );
} finally {
  await stop();
  await rm(directory, { recursive: true, force: true });
}

async function start() {
  child = spawn(process.execPath, ["dist/api/index.js"], {
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let timer;
  try {
    await Promise.race([
      once(child.stdout, "data"),
      once(child, "exit").then(() => {
        throw new Error("Identity server exited before startup");
      }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Identity startup timed out")), 10000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
async function stop() {
  const current = child;
  child = undefined;
  if (!current || current.exitCode !== null || current.signalCode !== null) return;
  const closed = once(current, "exit");
  current.kill();
  await closed;
}
async function request(path, method = "GET", body, cookie = "", origin = base) {
  const response = await fetch(base + path, {
    method,
    redirect: "manual",
    headers: { Origin: origin, Cookie: cookie, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (/^\/api\/v1\/identity\/(user|admin|super-admin)\//.test(path))
    await verifyIdentityResponsePrivacy(response, [
      ...privateCredentials,
      ...Object.values(cookies).map((value) => value.split("=")[1]),
      response.headers.get("set-cookie")?.split(";")[0].split("=")[1],
    ]);
  return response;
}
