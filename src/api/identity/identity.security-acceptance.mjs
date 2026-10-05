import assert from "node:assert/strict";

export async function verifyIdentityResponsePrivacy(response, secrets = []) {
  assert.equal(
    response.headers.get("cache-control"),
    "no-store",
    "Identity responses must not be cached.",
  );
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  const text = await response.clone().text();
  assert.ok(
    !secrets.filter(Boolean).some((secret) => text.includes(secret)),
    "Identity response exposed a private credential.",
  );
  assert.ok(!text.includes("scrypt$"), "Identity response exposed a password hash.");
  if (response.headers.get("content-type")?.includes("application/json"))
    assertSafeFields(JSON.parse(text));
}

export function verifyIdentitySessionCookie(header, portal) {
  assert.ok(typeof header === "string", "Sign-in must set its scoped cookie.");
  const [cookie, ...attributes] = header.split(";").map((part) => part.trim());
  const [name, token] = cookie.split("=");
  assert.equal(name, `qcafe_${portal}_session`);
  assert.ok(/^[A-Za-z0-9_-]{43}$/.test(token), "The session token must be opaque.");
  assert.ok(attributes.includes("HttpOnly"));
  assert.ok(attributes.includes("SameSite=Strict"));
  assert.ok(attributes.includes("Path=/"));
  assert.ok(attributes.some((attribute) => /^Max-Age=[1-9]\d*$/.test(attribute)));
}

export async function verifyIdentityLoginLimit(request, password) {
  const path = "/api/v1/identity/user/sessions";
  const body = { email: "security-limit@example.test", password };
  for (let attempt = 1; attempt <= 11; attempt++) {
    const response = await request(path, "POST", body);
    assert.equal(
      response.status,
      attempt <= 10 ? 401 : 429,
      "Persistent account login limit failed.",
    );
    assert.equal(response.headers.get("set-cookie"), null);
    const result = await response.json();
    assert.equal(
      result.message,
      attempt <= 10
        ? "Invalid credentials or portal access."
        : "Too many sign-in attempts. Try again later.",
    );
  }
  return { path, body };
}

function assertSafeFields(value) {
  if (value === null || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.ok(
      !["password_hash", "passwordHash", "token_hash", "tokenHash", "stack"].includes(key),
      "Identity response exposed an internal field.",
    );
    assertSafeFields(child);
  }
}
