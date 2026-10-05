import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import {
  contributeModule,
  createApplicationComposition,
} from "../src/api/application/application.provider.js";

test("explicit diagnostic contribution injects public dependencies, routes and closes in reverse order", async () => {
  const events: string[] = [];
  const declarations: unknown[] = [];
  const identity = contributeModule({
    name: "identity",
    create: () => ({
      registerPermissions: async (value: unknown) => {
        declarations.push(value);
      },
    }),
    start: () => {
      events.push("identity:start");
    },
    stop: () => {
      events.push("identity:stop");
    },
  });
  const diagnostic = contributeModule(
    {
      name: "diagnostic",
      dependencies: ["identity"],
      create(dependencies) {
        assert.equal(dependencies.has("private-unrelated"), false);
        return {
          identity: dependencies.get("identity") as {
            registerPermissions(value: unknown): Promise<void>;
          },
          status: "created",
        };
      },
      async start(provider) {
        await provider.identity.registerPermissions({
          owner: "diagnostic",
          permissions: [{ id: "qcafe.diagnostic.read", portals: ["user"] }],
        });
        provider.status = "ready";
        events.push("diagnostic:start");
      },
      stop: () => {
        events.push("diagnostic:stop");
      },
    },
    (provider, request, response, signal) => {
      if (request.url !== "/api/v1/diagnostics") return false;
      assert.equal(signal?.aborted, false);
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify({ status: provider.status }));
      return true;
    },
  );
  const app = createApplicationComposition([diagnostic, identity]);
  await app.start();
  assert.equal(app.state, "ready");
  assert.equal(declarations.length, 1);
  const server = createServer((request, response) => {
    void app.handle(request, response, new AbortController().signal).then((handled) => {
      if (!handled) {
        response.writeHead(404);
        response.end();
      }
    });
  });
  await new Promise<void>((accept) => server.listen(0, "127.0.0.1", accept));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const origin = `http://127.0.0.1:${address.port}`;
    assert.deepEqual(await (await fetch(`${origin}/api/v1/diagnostics`)).json(), {
      status: "ready",
    });
    assert.equal((await fetch(`${origin}/api/v1/unknown`)).status, 404);
  } finally {
    await new Promise<void>((accept) => server.close(() => accept()));
    await Promise.all([app.stop(), app.stop()]);
  }
  assert.deepEqual(events, [
    "identity:start",
    "diagnostic:start",
    "diagnostic:stop",
    "identity:stop",
  ]);
  assert.equal(app.state, "stopped");
});

test("failed contributor startup rolls back public dependencies and rejects request dispatch", async () => {
  const events: string[] = [];
  const app = createApplicationComposition([
    contributeModule({
      name: "storage",
      create: () => ({}),
      start: () => {
        events.push("storage:start");
      },
      stop: () => {
        events.push("storage:stop");
      },
    }),
    contributeModule({
      name: "diagnostic",
      dependencies: ["storage"],
      create: () => ({}),
      start: () => {
        throw new Error("fixture startup failure");
      },
      stop: () => {
        events.push("diagnostic:stop");
      },
    }),
  ]);
  await assert.rejects(app.start(), /fixture startup failure/);
  assert.deepEqual(events, ["storage:start", "diagnostic:stop", "storage:stop"]);
  assert.notEqual(app.state, "ready");
});

test("browser-path contribution times out safely and receives cancellation", async () => {
  const { dispatchApplicationRequest } =
    await import("../src/api/application/application.provider.js");
  let ownerSignal: AbortSignal | undefined;
  const server = createServer((request, response) => {
    void dispatchApplicationRequest(
      async (_request, _response, signal) => {
        ownerSignal = signal;
        return await new Promise<boolean>(() => {});
      },
      request,
      response,
      20,
    );
  });
  await new Promise<void>((accept) => server.listen(0, "127.0.0.1", accept));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const result = await fetch(`http://127.0.0.1:${address.port}/qcafe/user/desk`, {
      signal: AbortSignal.timeout(2000),
    });
    assert.equal(result.status, 504);
    assert.equal(ownerSignal?.aborted, true);
    assert.equal(
      ((await result.json()) as { error: { code: string } }).error.code,
      "request_timeout",
    );
  } finally {
    await new Promise<void>((accept) => server.close(() => accept()));
  }
});
