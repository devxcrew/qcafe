import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:net";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplicationServer } from "@devxcrew/framework";
import type { createIdentityProvider } from "@devxcrew/platform";
import { createDatabaseProvider } from "../src/api/database/database.provider.js";
import { identityModule } from "../src/api/identity/identity.provider.js";
import {
  contributeModule,
  createApplicationComposition,
} from "../src/api/application/application.provider.js";

test("diagnostic module registers and enforces real permissions through public composition", async () => {
  const directory = await mkdtemp(join(tmpdir(), "foundation-extension-"));
  assert.ok(directory.startsWith(join(tmpdir(), "foundation-extension-")));
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const address = probe.address();
  assert.ok(address && typeof address !== "string");
  const port = address.port;
  await new Promise<void>((done) => probe.close(() => done()));
  const origin = `http://127.0.0.1:${port}`;
  const password = "DiagnosticFixture!2026Strong";
  const environment = {
    APP_ID: "extension-proof",
    APP_NAME: "Extension proof",
    APP_URL: origin,
    DB_SQLITE_PATH: join(directory, "identity.sqlite"),
    IDENTITY_SEED_USER_EMAIL: "user@example.test",
    IDENTITY_SEED_USER_NAME: "Diagnostic user",
    IDENTITY_SEED_USER_PASSWORD: password,
    IDENTITY_SEED_ADMIN_EMAIL: "admin@example.test",
    IDENTITY_SEED_ADMIN_NAME: "Diagnostic admin",
    IDENTITY_SEED_ADMIN_PASSWORD: password,
  };
  const database = createDatabaseProvider(environment);
  const permission = "extension-proof.diagnostic.read";
  type PublicIdentity = Pick<
    ReturnType<typeof createIdentityProvider>,
    "registerPermissions" | "authenticateRequest" | "requirePermission"
  >;
  const diagnostic = contributeModule(
    {
      name: "diagnostic",
      dependencies: ["identity"],
      create: (dependencies) => ({ identity: dependencies.get("identity") as PublicIdentity }),
      start: (provider) =>
        provider.identity.registerPermissions({
          owner: "diagnostic",
          permissions: [{ id: permission, label: "Read diagnostic status", portals: ["user"] }],
        }),
    },
    async (provider, request, response, signal) => {
      if (request.url !== "/api/v1/diagnostics") return false;
      const principal = await provider.identity.authenticateRequest(request, "user", signal);
      provider.identity.requirePermission(principal, permission);
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ owner: "diagnostic", name: principal.user.name }));
      return true;
    },
  );
  const app = createApplicationComposition([
    contributeModule({
      name: "database",
      create: () => database,
      start: async (provider) => {
        await provider.migrate();
        await provider.seed();
      },
      stop: (provider) => provider.close(),
    }),
    contributeModule({ name: "email", create: () => ({ delivery: undefined }) }),
    identityModule(environment, () => {}),
    diagnostic,
  ]);
  const server = createApplicationServer({
    config: { name: "Extension proof", mode: "production", host: "127.0.0.1", port, url: origin },
    apiHandler: async (request, response, context) => {
      if (!(await app.handle(request, response, context.signal))) {
        response.writeHead(404);
        response.end();
      }
    },
  });
  let listening = false;
  try {
    await app.start();
    server.listen(port, "127.0.0.1");
    await once(server, "listening");
    listening = true;
    const userLogin = await request("/api/v1/identity/user/sessions", "POST", {
      email: environment.IDENTITY_SEED_USER_EMAIL,
      password,
    });
    assert.equal(userLogin.status, 201);
    const userCookie = userLogin.headers.get("set-cookie")!.split(";")[0];
    assert.equal((await request("/api/v1/diagnostics", "GET", undefined, userCookie)).status, 403);
    const adminLogin = await request("/api/v1/identity/admin/sessions", "POST", {
      email: environment.IDENTITY_SEED_ADMIN_EMAIL,
      password,
    });
    assert.equal(adminLogin.status, 201);
    const adminCookie = adminLogin.headers.get("set-cookie")!.split(";")[0];
    const catalog = await request(
      "/api/v1/identity/admin/permissions",
      "GET",
      undefined,
      adminCookie,
    );
    assert.ok(
      (await catalog.json()).data.some(
        (item: { id: string; label: string }) =>
          item.id === permission && item.label === "Read diagnostic status",
      ),
    );
    const role = await request(
      "/api/v1/identity/admin/roles",
      "POST",
      {
        name: "Diagnostic reader",
        permissionIds: ["desk.user", "identity.self", "identity.password", permission],
      },
      adminCookie,
    );
    assert.equal(role.status, 201);
    const roleId = (await role.json()).data.id;
    const users = await request(
      "/api/v1/identity/admin/users?search=user%40example.test",
      "GET",
      undefined,
      adminCookie,
    );
    const userId = (await users.json()).data[0].id;
    const membershipPath = `/api/v1/identity/admin/memberships/${userId}~default~user`;
    const membership = await request(membershipPath, "GET", undefined, adminCookie);
    const expectedVersion = (await membership.json()).data.version;
    const grant = await request(
      membershipPath,
      "PATCH",
      { roleId, active: true, expectedVersion },
      adminCookie,
    );
    assert.equal(grant.status, 200);
    const refreshed = await request("/api/v1/identity/user/sessions", "POST", {
      email: environment.IDENTITY_SEED_USER_EMAIL,
      password,
    });
    assert.equal(refreshed.status, 201);
    const allowed = await request(
      "/api/v1/diagnostics",
      "GET",
      undefined,
      refreshed.headers.get("set-cookie")!.split(";")[0],
    );
    assert.equal(allowed.status, 200);
    assert.deepEqual(await allowed.json(), { owner: "diagnostic", name: "Diagnostic user" });
    assert.equal((await request("/api/v1/diagnostics")).status, 401);
  } finally {
    if (listening) await new Promise<void>((done) => server.close(() => done()));
    await app.stop();
    await rm(directory, { recursive: true, force: true });
  }

  function request(path: string, method = "GET", body?: unknown, cookie?: string) {
    return fetch(`${origin}${path}`, {
      method,
      headers: {
        origin,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
});
