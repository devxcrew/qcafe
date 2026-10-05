import assert from "node:assert/strict";
import { test } from "node:test";
import { identityRequest, IdentityApiError } from "./identity.services";

test("identity transport preserves flat field errors", async (context) => {
  context.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        JSON.stringify({
          message: "Validation failed",
          errors: { email: ["Enter a valid email."], invalid: { private: "discard" } },
        }),
        { status: 422 },
      ),
  );
  await assert.rejects(identityRequest("admin", "users"), (error: unknown) => {
    assert.ok(error instanceof IdentityApiError);
    assert.equal(error.status, 422);
    assert.deepEqual(error.errors, { email: ["Enter a valid email."] });
    return true;
  });
});

test("identity transport reads Framework error envelopes", async (context) => {
  context.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(
        JSON.stringify({
          error: { code: "request_timeout", message: "Request deadline exceeded." },
        }),
        { status: 504 },
      ),
  );
  await assert.rejects(identityRequest("admin", "users"), {
    status: 504,
    message: "Request deadline exceeded.",
  });
});

test("non-JSON server failures expose safe retry feedback", async (context) => {
  context.mock.method(
    globalThis,
    "fetch",
    async () => new Response("<html>internal stack trace</html>", { status: 502 }),
  );
  await assert.rejects(identityRequest("admin", "users"), {
    status: 502,
    message: "The server could not complete the request. Try again.",
  });
});

test("network failures remain safe and aborted reads retain abort identity", async (context) => {
  const failure = new TypeError("sensitive backend endpoint unavailable");
  context.mock.method(globalThis, "fetch", async () => {
    throw failure;
  });
  await assert.rejects(identityRequest("admin", "users"), {
    status: 0,
    message: "Connection failed. Check your network and retry.",
  });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    identityRequest("admin", "users", "GET", undefined, controller.signal),
    (error) => error === failure,
  );
});
