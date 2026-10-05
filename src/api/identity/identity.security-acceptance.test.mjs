import assert from "node:assert/strict";
import test from "node:test";
import {
  verifyIdentityResponsePrivacy,
  verifyIdentitySessionCookie,
} from "./identity.security-acceptance.mjs";

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

test("privacy verification preserves the response and safe field errors", async () => {
  const body = { errors: { password: ["Use at least 12 characters."] }, data: { id: "record" } };
  const response = Response.json(body, { headers });
  await verifyIdentityResponsePrivacy(response, ["private-credential"]);
  assert.deepEqual(await response.json(), body);
});

test("privacy verification rejects cached or sniffable identity responses", async () => {
  for (const changed of [{ "Cache-Control": "public" }, { "X-Content-Type-Options": "" }])
    await assert.rejects(
      verifyIdentityResponsePrivacy(Response.json({}, { headers: { ...headers, ...changed } })),
    );
});

test("privacy verification rejects nested internal fields and credential values", async () => {
  for (const body of [
    { data: [{ password_hash: "hidden" }] },
    { errors: { detail: { tokenHash: "hidden" } } },
    { message: "scrypt$private-hash" },
    { data: { value: "private-credential" } },
    { error: { stack: "private-stack" } },
  ])
    await assert.rejects(
      verifyIdentityResponsePrivacy(Response.json(body, { headers }), ["private-credential"]),
    );
  await assert.rejects(
    verifyIdentityResponsePrivacy(
      new Response("scrypt$private-hash", {
        headers: { ...headers, "Content-Type": "text/plain" },
      }),
    ),
  );
});

test("loopback session cookie verification requires portal ownership and browser safeguards", () => {
  const token = "a".repeat(43);
  for (const portal of ["user", "admin", "super-admin"]) {
    const cookie = `qcafe_${portal}_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800`;
    verifyIdentitySessionCookie(cookie, portal);
    assert.throws(() => verifyIdentitySessionCookie(cookie.replace("HttpOnly", ""), portal));
    assert.throws(() =>
      verifyIdentitySessionCookie(cookie.replace("SameSite=Strict", "SameSite=Lax"), portal),
    );
    assert.throws(() =>
      verifyIdentitySessionCookie(cookie.replace(`qcafe_${portal}`, "foreign"), portal),
    );
  }
});
