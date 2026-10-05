import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { composeFrontend, type FrontendContributor } from "../../composition/frontend.provider";
import { identityProvider } from "./identity.provider";

// Disposable test contributor. It is never registered in the production application.
const diagnosticProvider: FrontendContributor = {
  id: "diagnostic",
  routes: [{ path: "/diagnostic", component: () => null }],
  navigation: (context) =>
    context.permissions.includes("diagnostic.read")
      ? [
          {
            label: "Diagnostics",
            items: [
              { label: "Runtime", href: "/diagnostic", active: context.pathname === "/diagnostic" },
            ],
          },
        ]
      : [],
};
const context = {
  workspace: "user",
  base: "/desk",
  pathname: "/desk/sessions",
  permissions: ["identity.self", "identity.password"],
};

test("public contributors compose routes and permission-aware navigation without identity changes", () => {
  const composed = composeFrontend([identityProvider, diagnosticProvider]);
  assert.equal(composed.routes.length, 19);
  assert.equal(composed.routes.find((route) => route.path === "/diagnostic")?.owner, "diagnostic");
  assert.equal(
    composed.navigation(context).some((section) => section.label === "Diagnostics"),
    false,
  );
  const granted = composed.navigation({
    ...context,
    pathname: "/diagnostic",
    permissions: [...context.permissions, "diagnostic.read"],
  });
  assert.equal(granted.find((section) => section.label === "Diagnostics")?.items[0].active, true);
  assert.equal(
    granted.some((section) => section.label === "Identity"),
    true,
  );
});

test("identity public provider preserves all portal routes and owner navigation", () => {
  const composed = composeFrontend([identityProvider]);
  for (const base of ["", "/admin", "/sa"]) {
    for (const suffix of [
      "/login",
      "/desk",
      "/desk/$",
      "/forgot-password",
      "/reset-password",
      "/accept-invitation",
    ]) {
      assert.ok(composed.routes.some((route) => route.path === base + suffix));
    }
  }
  const sections = composed.navigation(context);
  assert.equal(
    sections
      .find((section) => section.label === "Identity")
      ?.items.find((item) => item.href === "/desk/sessions")?.active,
    true,
  );
  assert.equal(
    sections
      .find((section) => section.label === "Account")
      ?.items.some((item) => item.label === "Profile"),
    true,
  );
  const restricted = composed.navigation({ ...context, permissions: [] });
  assert.equal(
    restricted
      .find((section) => section.label === "Account")
      ?.items.some((item) => item.label === "Profile"),
    false,
  );
  assert.deepEqual(composed.navigation({ ...context, workspace: "diagnostic" }), []);
});

test("composition rejects owner and route collisions", () => {
  assert.throws(() => composeFrontend([diagnosticProvider, diagnosticProvider]), /frontend owner/);
  assert.throws(
    () => composeFrontend([diagnosticProvider, { ...diagnosticProvider, id: "other" }]),
    /frontend route/,
  );
  assert.throws(
    () => composeFrontend([{ id: "bad", routes: [{ path: "relative", component: () => null }] }]),
    /frontend route/,
  );
});

test("application composition imports only module public provider boundaries", () => {
  const source = readFileSync(
    new URL("../../composition/application.providers.ts", import.meta.url),
    "utf8",
  );
  const imports = [...source.matchAll(/from "([^"]*modules\/[^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(imports, ["../modules/identity/identity.provider"]);
  assert.ok(imports.every((path) => /\/[^/]+\.provider$/.test(path)));
});
