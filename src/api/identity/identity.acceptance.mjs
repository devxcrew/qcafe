import assert from "node:assert/strict";

export async function verifyIdentityResources(request, cookies, password) {
  const api = (portal, path, method = "GET", body) =>
    request(`/api/v1/identity/${portal}/${path}`, method, body, cookies[portal]);
  const data = async (portal, path, method = "GET", body, status = 200) => {
    const response = await api(portal, path, method, body);
    assert.equal(response.status, status, `${portal} ${method} ${path}`);
    return (await response.json()).data;
  };
  for (const portal of ["admin", "super-admin"]) {
    for (const resource of [
      "users",
      "organizations",
      "memberships",
      "roles",
      "permissions",
      "sessions",
      "invitations",
      "audit-events",
    ]) {
      const response = await api(portal, `${resource}?page=1&per_page=2&sort=id&direction=asc`);
      assert.equal(response.status, 200, `${portal} ${resource} list`);
      const collection = await response.json();
      assert.ok(Array.isArray(collection.data));
      assert.equal(collection.meta.per_page, 2);
    }
  }
  assert.equal((await api("user", "users")).status, 403);
  assert.equal(
    (await api("admin", "organizations", "POST", { id: "denied", name: "Denied" })).status,
    403,
  );
  assert.equal((await api("super-admin", "users?per_page=101")).status, 422);
  assert.equal((await api("super-admin", "users?sort=password_hash")).status, 422);
  const invalid = await api("super-admin", "users", "POST", {
    name: "",
    email: "bad",
    password: "short",
  });
  assert.equal(invalid.status, 422);
  const invalidBody = await invalid.json();
  assert.ok(invalidBody.errors.email.length > 0);
  assert.equal(
    (
      await api("super-admin", "users", "POST", {
        name: "Unsafe",
        email: "unsafe@example.test",
        password,
        permissions: ["*"],
      })
    ).status,
    422,
  );
  const account = await data(
    "super-admin",
    "users",
    "POST",
    {
      name: "Acceptance Account",
      email: "acceptance@example.test",
      password,
    },
    201,
  );
  assert.equal((await data("super-admin", `users/${account.id}`)).email, "acceptance@example.test");
  const changedAccount = await data("super-admin", `users/${account.id}`, "PATCH", {
    name: "Updated Acceptance Account",
    expectedVersion: account.version,
  });
  assert.equal(changedAccount.name, "Updated Acceptance Account");
  assert.equal(
    (
      await api("super-admin", `users/${account.id}`, "PATCH", {
        name: "Stale",
        expectedVersion: account.version,
      })
    ).status,
    409,
  );
  const filtered = await api(
    "super-admin",
    "users?search=acceptance%40example.test&sort=email&direction=desc",
  );
  assert.equal(filtered.status, 200);
  assert.equal((await filtered.json()).meta.total, 1);
  const organization = await data(
    "super-admin",
    "organizations",
    "POST",
    {
      id: "acceptance-org",
      name: "Acceptance Organization",
    },
    201,
  );
  const changedOrganization = await data("super-admin", "organizations/acceptance-org", "PATCH", {
    name: "Updated Organization",
    expectedVersion: organization.version,
  });
  assert.equal(changedOrganization.name, "Updated Organization");
  assert.equal((await api("admin", "organizations/acceptance-org")).status, 404);
  const role = await data(
    "admin",
    "roles",
    "POST",
    {
      name: "Acceptance Reader",
      permissionIds: ["desk.user"],
    },
    201,
  );
  const changedRole = await data("admin", `roles/${role.id}`, "PATCH", {
    name: "Updated Reader",
    permissionIds: ["desk.user"],
    expectedVersion: role.version,
  });
  assert.equal(changedRole.name, "Updated Reader");
  assert.equal(
    (
      await api("admin", `roles/${role.id}`, "PATCH", {
        name: "Stale Role",
        expectedVersion: role.version,
      })
    ).status,
    409,
  );
  const membership = await data(
    "super-admin",
    "memberships",
    "POST",
    {
      userId: account.id,
      tenantId: "acceptance-org",
      roleId: "user",
    },
    201,
  );
  const changedMembership = await data("super-admin", `memberships/${membership.id}`, "PATCH", {
    roleId: "user",
    active: false,
    expectedVersion: membership.version,
  });
  assert.equal(changedMembership.active, false);
  assert.equal(
    (
      await api(
        "super-admin",
        `memberships/${membership.id}?expectedVersion=${membership.version}`,
        "DELETE",
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await api(
        "super-admin",
        `memberships/${membership.id}?expectedVersion=${changedMembership.version}`,
        "DELETE",
      )
    ).status,
    204,
  );
  const profile = await data("user", "profile");
  const changedProfile = await data("user", "profile", "PATCH", {
    name: "Acceptance User",
    expectedVersion: profile.version,
  });
  assert.equal(changedProfile.name, "Acceptance User");
  const settings = await data("admin", "settings");
  const changedSettings = await data("admin", "settings", "PATCH", {
    displayName: "Acceptance Workspace",
    locale: "en-GB",
    timeZone: "Asia/Kolkata",
    expectedVersion: settings.version,
  });
  assert.equal(changedSettings.displayName, "Acceptance Workspace");
  assert.equal(
    (
      await api("admin", "settings", "PATCH", {
        displayName: "Stale Workspace",
        locale: "en-GB",
        timeZone: "UTC",
        expectedVersion: settings.version,
      })
    ).status,
    409,
  );
  assert.equal((await api("user", "settings")).status, 200);
  assert.equal(
    (
      await api("user", "settings", "PATCH", {
        displayName: "Denied",
        locale: "en",
        timeZone: "UTC",
        expectedVersion: changedSettings.version,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api("admin", "application-settings", "PATCH", {
        displayName: "Denied",
        locale: "en",
        timeZone: "UTC",
        expectedVersion: 0,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api("admin", "invitations", "POST", {
        name: "No Delivery",
        email: "invited@example.test",
        roleId: "user",
      })
    ).status,
    503,
  );
  assert.equal(
    (await api("super-admin", "audit-events", "POST", { action: "forged" })).status,
    405,
  );
  const audit = await api("super-admin", "audit-events?per_page=100");
  assert.equal(audit.status, 200);
  assert.ok((await audit.json()).data.length > 0);
  console.info(
    "Compiled identity resources passed: list/query, masters, scoped roles, membership revisions, profile, settings, denial, field errors and disabled delivery.",
  );
}
