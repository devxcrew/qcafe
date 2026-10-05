import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("the identity frontend follows the canonical module contract", () => {
  const root = new URL("../src/web/modules/identity/", import.meta.url);
  const files = [
    "index.ts",
    "identity.provider.ts",
    "identity.routes.tsx",
    "identity.workspace.tsx",
    "identity.list.tsx",
    "identity.form.tsx",
    "identity.services.ts",
    "identity.hooks.ts",
    "identity.schema.ts",
    "identity.types.ts",
  ];
  for (const file of files) assert.ok(existsSync(new URL(file, root)), file);
  const list = readFileSync(new URL("identity.list.tsx", root), "utf8");
  const form = readFileSync(new URL("identity.form.tsx", root), "utf8");
  assert.match(list, /from "\.\/identity\.form"/);
  assert.match(form, /useIdentityResourceChoices/);
  assert.match(form, /onSubmit: resourceSchema/);
});

test("the identity adapter has canonical files and controller wiring", () => {
  const root = new URL("../src/api/identity/", import.meta.url);
  for (const suffix of [
    "provider",
    "migration",
    "repository",
    "schema",
    "routes",
    "controller",
    "seed",
    "service",
    "types",
  ])
    assert.ok(existsSync(new URL(`identity.${suffix}.ts`, root)), suffix);
  assert.ok(existsSync(new URL("index.ts", root)));
  assert.match(readFileSync(new URL("identity.provider.ts", root), "utf8"), /identityRoutes/);
  assert.match(readFileSync(new URL("identity.routes.ts", root), "utf8"), /identityController/);
  assert.match(readFileSync(new URL("identity.controller.ts", root), "utf8"), /dispatchIdentity/);
});
