import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IdentityPermissionChoices, rolePermissionChoices } from "./identity.permissions";

test("permission group exposes its field error to assistive technology", () => {
  const html = renderToStaticMarkup(
    createElement(IdentityPermissionChoices, {
      id: "permissions",
      records: [
        {
          id: "desk.user",
          label: "Access user desk",
          owner: "desk",
          appId: null,
          portals: ["user"],
        },
      ],
      value: "desk.user",
      system: false,
      portal: "user",
      invalid: true,
      describedBy: "permissions-errors",
      onChange() {},
    }),
  );
  assert.match(html, /<fieldset[^>]*aria-invalid="true"/);
  assert.match(html, /aria-describedby="permissions-errors"/);
  assert.match(html, /checked=""/);
  assert.match(html, /disabled=""/);
});

test("role picker includes module-owned permissions only for the matching portal", () => {
  const records = [
    { id: "desk.user", label: "User workspace", owner: "desk", appId: null, portals: ["user"] },
    {
      id: "diagnostic.read",
      label: "Read runtime diagnostics",
      owner: "diagnostic",
      appId: "qcafe",
      portals: ["user", "admin"],
    },
    {
      id: "identity.manage",
      label: "Manage identity",
      owner: "identity",
      appId: null,
      portals: ["admin", "super-admin"],
    },
  ];
  assert.deepEqual(
    rolePermissionChoices(records, "user").map((entry) => entry.id),
    ["desk.user", "diagnostic.read"],
  );
  const html = renderToStaticMarkup(
    createElement(IdentityPermissionChoices, {
      id: "permissions",
      records,
      value: "desk.user",
      system: false,
      portal: "super-admin",
      onChange() {},
    }),
  );
  assert.match(html, /Read runtime diagnostics/);
  assert.doesNotMatch(html, /Manage identity/);
  assert.match(html, /disabled=""/);
  const admin = renderToStaticMarkup(
    createElement(IdentityPermissionChoices, {
      id: "permissions",
      records,
      value: "identity.manage",
      system: true,
      portal: "admin",
      onChange() {},
    }),
  );
  assert.match(admin, /Read runtime diagnostics/);
  assert.match(admin, /Manage identity/);
  assert.doesNotMatch(admin, /User workspace/);
});
test("role picker labels fall back to IDs and missing portal metadata is not assignable", () => {
  assert.equal(
    rolePermissionChoices([{ id: "diagnostic.read", label: "", portals: ["user"] }], "user")[0]
      .label,
    "diagnostic.read",
  );
  assert.deepEqual(rolePermissionChoices([{ id: "diagnostic.read" }], "user"), []);
});
