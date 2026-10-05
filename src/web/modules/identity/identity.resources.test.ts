import assert from "node:assert/strict";
import test from "node:test";
import {
  identityResources,
  resourceFields,
  resourceCanEdit,
  assignableRoleOptions,
} from "./identity.resources";
import type { IdentityRecord } from "./identity.resources";
import {
  identityListSchema,
  resourceSchema,
  identityResourcePayload,
  identityDeletePath,
} from "./identity.schema";

test("list query rejects unsafe pagination and unsupported sorting", () => {
  const result = identityListSchema.parse({
    page: "-1",
    per_page: "100000",
    search: "x".repeat(101),
    sort: "password",
    direction: "sideways",
  });
  assert.deepEqual(result, { page: 1, per_page: 20, search: "", sort: "id", direction: "asc" });
});

test("user portal exposes own sessions without administrative edit forms", () => {
  const resources = identityResources("user");
  assert.deepEqual(
    resources.map((resource) => resource.id),
    ["sessions"],
  );
  assert.equal(resources[0].create, undefined);
});

test("user edit schema excludes password and rejects invalid email", () => {
  const users = identityResources("super-admin").find((resource) => resource.id === "users")!;
  const fields = resourceFields(users, false, "super-admin");
  assert.equal(
    fields.some((field) => field.name === "password"),
    false,
  );
  assert.equal(
    resourceSchema(fields).safeParse({ name: "A", email: "invalid", active: true }).success,
    false,
  );
  assert.equal(
    resourceSchema(resourceFields(users, true, "super-admin")).safeParse({
      name: "A",
      email: "a@example.com",
      active: true,
      password: "short",
      tenantId: "a",
      roleId: "user",
    }).success,
    false,
  );
});
test("creation payload fields agree with strict backend resource contracts", () => {
  const resources = identityResources("super-admin");
  const userFields = resourceFields(
    resources.find((resource) => resource.id === "users")!,
    true,
    "super-admin",
  );
  assert.deepEqual(userFields.map((field) => field.name).sort(), [
    "email",
    "name",
    "password",
    "roleId",
    "tenantId",
  ]);
  const orgFields = resourceFields(
    resources.find((resource) => resource.id === "organizations")!,
    true,
    "super-admin",
  );
  assert.deepEqual(orgFields.map((field) => field.name).sort(), ["active", "id", "name"]);
  assert.deepEqual(
    resourceSchema(userFields).parse({
      name: "Alice",
      email: "alice@example.com",
      password: "Long-password-123!",
      roleId: "user",
      tenantId: "sample",
    }),
    {
      name: "Alice",
      email: "alice@example.com",
      password: "Long-password-123!",
      roleId: "user",
      tenantId: "sample",
    },
  );
  assert.deepEqual(
    resourceSchema(orgFields).parse({ id: "sample", name: "Sample", active: true }),
    { id: "sample", name: "Sample", active: true },
  );
});

test("catalog resources remain read-only except authorized role assignments", () => {
  for (const portal of ["admin", "super-admin"] as const) {
    const permission = identityResources(portal).find((resource) => resource.id === "permissions")!;
    assert.equal(permission.create, undefined);
    assert.equal(permission.edit, undefined);
  }
  const roles = identityResources("admin").find((resource) => resource.id === "roles")!;
  assert.equal(resourceCanEdit(roles, "admin", { system: true }), false);
  assert.equal(resourceCanEdit(roles, "admin", { system: false }), true);
});

test("custom role selectors preserve portal and organization boundaries", () => {
  const roles: IdentityRecord[] = [
    { id: "user", portal: "user", system: true, active: true },
    { id: "reader", portal: "user", system: false, active: true, tenantId: "north" },
    { id: "other", portal: "user", system: false, active: true, tenantId: "south" },
    { id: "inactive", portal: "user", system: false, active: false, tenantId: "north" },
    { id: "admin", portal: "admin", system: true, active: true },
  ];
  assert.deepEqual(
    assignableRoleOptions(roles, "admin", "memberships", "north").map((role) => role.id),
    ["user", "reader"],
  );
  assert.deepEqual(
    assignableRoleOptions(roles, "admin", "invitations", "north").map((role) => role.id),
    ["user"],
  );
});

test("membership edits exclude immutable ownership fields", () => {
  const membership = identityResources("admin").find((resource) => resource.id === "memberships")!;
  assert.deepEqual(
    resourceFields(membership, false, "admin").map((field) => field.name),
    ["roleId", "active"],
  );
  assert.equal(
    identityResourcePayload(
      "memberships/user~north~user",
      false,
      { roleId: "reader", active: true },
      { version: 2 },
    ).success,
    true,
  );
  assert.equal(
    identityResourcePayload(
      "roles",
      true,
      { name: "Readers", permissionIds: "desk.user, identity.self", tenantId: "north" },
      {},
    ).success,
    true,
  );
  assert.equal(
    identityResourcePayload(
      "roles/reader",
      false,
      { name: "Readers", active: true, permissionIds: "desk.user" },
      { version: 2, system: false },
    ).success,
    true,
  );
});
test("submitted resource payloads satisfy strict published Platform schemas", () => {
  const user = identityResourcePayload(
    "users",
    true,
    {
      name: "Alice",
      email: "alice@example.com",
      password: "Long-password-123!",
      roleId: "user",
      tenantId: "sample",
    },
    {},
  );
  assert.equal(user.success, true);
  assert.equal(
    identityResourcePayload(
      "users",
      true,
      {
        name: "Alice",
        email: "alice@example.com",
        password: "Long-password-123!",
        roleId: "user",
        active: true,
      },
      {},
    ).success,
    false,
  );
  assert.equal(
    identityResourcePayload(
      "organizations",
      true,
      { id: "sample", name: "Sample", active: true },
      {},
    ).success,
    true,
  );
  assert.equal(
    identityResourcePayload("organizations", true, { name: "Sample", active: true }, {}).success,
    false,
  );
  const update = identityResourcePayload(
    "users/example",
    false,
    { name: "Alice", email: "alice@example.com", active: true },
    { version: 3 },
  );
  assert.equal(update.success, true);
  if (update.success)
    assert.deepEqual(update.data, {
      name: "Alice",
      email: "alice@example.com",
      active: true,
      expectedVersion: 3,
    });
  assert.equal(identityResourcePayload("profile", false, { name: "Alice" }, {}).success, false);
  assert.equal(
    identityResourcePayload("security-settings", false, { sessionSeconds: "60" }, { version: 1 })
      .success,
    false,
  );
  assert.equal(
    identityResourcePayload(
      "settings",
      false,
      { displayName: "Sample", locale: "unsupported", timeZone: "UTC" },
      { version: 1 },
    ).success,
    false,
  );
});

test("membership removal carries the loaded revision in the query", () => {
  assert.equal(
    identityDeletePath("memberships", { id: "user~tenant~user", version: 0 }),
    "memberships/user~tenant~user?expectedVersion=0",
  );
  assert.equal(
    identityDeletePath("memberships", { id: "member", version: 7 }),
    "memberships/member?expectedVersion=7",
  );
  assert.throws(() => identityDeletePath("memberships", { id: "member" }), /Reload/);
  assert.equal(identityDeletePath("sessions", { id: "opaque" }), "sessions/opaque");
  assert.equal(identityDeletePath("invitations", { id: "invite" }), "invitations/invite");
});
