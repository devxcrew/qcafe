import assert from "node:assert/strict";
import test from "node:test";
import { identityNavigation } from "./identity.navigation";
import { identityResources } from "./identity.resources";
import type { Portal } from "./identity.types";

test("each portal menu exposes only its owned destinations and activates nested resource routes", () => {
  const portals: { portal: Portal; base: string }[] = [
    { portal: "user", base: "/desk" },
    { portal: "admin", base: "/admin/desk" },
    { portal: "super-admin", base: "/sa/desk" },
  ];
  for (const { portal, base } of portals) {
    const resources = identityResources(portal);
    const context = {
      workspace: portal,
      base,
      pathname: base,
      permissions: ["identity.self", "identity.password"],
    };
    const sections = identityNavigation(context);
    const identity = sections.find((section) => section.label === "Identity")!;
    assert.deepEqual(
      identity.items.map((item) => item.href),
      resources.map((item) => `${base}/${item.id}`),
    );
    assert.deepEqual(
      identity.items.map((item) => item.label),
      resources.map((item) => item.title),
    );
    const account = sections.find((section) => section.label === "Account")!;
    assert.deepEqual(
      account.items.map((item) => item.href),
      [
        base,
        `${base}/settings`,
        `${base}/password`,
        ...(portal === "super-admin"
          ? [`${base}/application-settings`, `${base}/security-settings`]
          : []),
      ],
    );
    const hrefs = sections.flatMap((section) => section.items.map((item) => item.href));
    assert.equal(new Set(hrefs).size, hrefs.length);
    for (const resource of resources) {
      const selected = identityNavigation({
        ...context,
        pathname: `${base}/${resource.id}/record/edit`,
      });
      const active = selected.flatMap((section) => section.items).filter((item) => item.active);
      assert.equal(active.length, 1);
      assert.equal(active[0].href, `${base}/${resource.id}`);
    }
    const restricted = identityNavigation({ ...context, permissions: [] });
    assert.ok(
      !restricted
        .flatMap((section) => section.items)
        .some((item) => [base, `${base}/password`].includes(item.href!)),
    );
  }
});
