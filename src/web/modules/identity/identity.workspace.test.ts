import test from "node:test";
import assert from "node:assert/strict";
import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IdentityWorkspaceView } from "./identity.workspace";
import { identityProvider, type IdentityPrincipal } from "./identity.provider";
import { composeFrontend, type FrontendContributor } from "../../composition/frontend.provider";

const principal: IdentityPrincipal = {
  user: { id: "example", name: "Example user", email: "example@example.test" },
  appId: "qcafe",
  portal: "user",
  tenant: { id: "example", name: "Example organization" },
  permissions: ["identity.self", "diagnostic.read"],
};
const diagnostic: FrontendContributor = {
  id: "diagnostic",
  routes: [
    {
      path: "/desk/diagnostic",
      component: identityProvider.workspace("user", {
        title: "Diagnostics",
        permission: "diagnostic.read",
        component: () => createElement("h1", null, "Diagnostic content"),
      }),
    },
  ],
  navigation: (context) =>
    context.permissions.includes("diagnostic.read")
      ? [
          {
            label: "Diagnostics",
            items: [
              {
                label: "Runtime",
                href: "/desk/diagnostic",
                active: context.pathname === "/desk/diagnostic",
              },
            ],
          },
        ]
      : [],
};
const composed = composeFrontend([identityProvider, diagnostic]);
const props = {
  portal: "user" as const,
  title: "Diagnostics",
  navigation: composed.navigation({
    workspace: "user",
    base: "/desk",
    pathname: "/desk/diagnostic",
    permissions: principal.permissions,
  }),
  onSignOut: () => {},
  page: {
    title: "Diagnostics",
    permission: "diagnostic.read",
    component: () => createElement("h1", null, "Diagnostic content"),
  },
};

test("common workspace guard never renders module content before identity and presentation load", () => {
  const unauthenticated = renderToStaticMarkup(
    createElement(IdentityWorkspaceView, { ...props, principal: null, presentation: null }),
  );
  assert.match(unauthenticated, /Verifying your session/);
  assert.doesNotMatch(unauthenticated, /Diagnostic content/);
  const awaitingPresentation = renderToStaticMarkup(
    createElement(IdentityWorkspaceView, { ...props, principal, presentation: null }),
  );
  assert.match(awaitingPresentation, /Loading your workspace/);
  assert.doesNotMatch(awaitingPresentation, /Diagnostic content/);
});

test("verified contributed module renders inside the same desk shell, header and composed navigation", () => {
  const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
  Object.defineProperty(globalThis, "React", { value: React, configurable: true });
  const html = renderToStaticMarkup(
    createElement(IdentityWorkspaceView, {
      ...props,
      principal,
      presentation: {
        displayName: "Example app",
        organizationDisplayName: "Example organization",
        locale: "en",
        timeZone: "UTC",
      },
    }),
  );
  if (previousReact) Object.defineProperty(globalThis, "React", previousReact);
  else Reflect.deleteProperty(globalThis, "React");
  assert.match(html, /Diagnostic content/);
  assert.match(html, /Example app/);
  assert.match(html, /Example organization/);
  assert.match(html, /Diagnostics/);
  assert.match(html, /Runtime/);
  assert.match(html, /Identity/);
  assert.match(html, /Sign out/);
});

test("common workspace denies module permission without rendering its page", () => {
  const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
  Object.defineProperty(globalThis, "React", { value: React, configurable: true });
  try {
    const html = renderToStaticMarkup(
      createElement(IdentityWorkspaceView, {
        ...props,
        principal: { ...principal, permissions: ["identity.self"] },
        presentation: {
          displayName: "Example app",
          organizationDisplayName: "Example organization",
          locale: "en",
          timeZone: "UTC",
        },
      }),
    );
    assert.match(html, /You do not have access to this page/);
    assert.doesNotMatch(html, /Diagnostic content/);
  } finally {
    if (previousReact) Object.defineProperty(globalThis, "React", previousReact);
    else Reflect.deleteProperty(globalThis, "React");
  }
});
