import { identityApi } from "./identity.services";
import type { Portal } from "./identity.types";
import type { FrontendContributor } from "../../composition/frontend.provider";
import { identityNavigation } from "./identity.navigation";
import {
  createIdentityWorkspace,
  UserLogin,
  UserDesk,
  AdminLogin,
  AdminDesk,
  SuperLogin,
  SuperDesk,
  UserRecovery,
  AdminRecovery,
  SuperRecovery,
} from "./identity.routes";

export const identityProvider = {
  id: "identity",
  workspace: createIdentityWorkspace,
  routes: [
    { path: "/login", component: UserLogin },
    { path: "/desk", component: UserDesk },
    { path: "/desk/$", component: UserDesk },
    { path: "/admin/login", component: AdminLogin },
    { path: "/admin/desk", component: AdminDesk },
    { path: "/admin/desk/$", component: AdminDesk },
    { path: "/sa/login", component: SuperLogin },
    { path: "/sa/desk", component: SuperDesk },
    { path: "/sa/desk/$", component: SuperDesk },
    ...(["forgot-password", "reset-password", "accept-invitation"] as const).flatMap(
      (action) =>
        [
          { path: `/${action}`, component: UserRecovery },
          { path: `/admin/${action}`, component: AdminRecovery },
          { path: `/sa/${action}`, component: SuperRecovery },
        ] as const,
    ),
  ] as const,
  navigation: identityNavigation,
  api: identityApi,
  portals: {
    user: { login: "/login", desk: "/desk", title: "User" },
    admin: { login: "/admin/login", desk: "/admin/desk", title: "Administrator" },
    "super-admin": { login: "/sa/login", desk: "/sa/desk", title: "Super administrator" },
  },
  breadcrumbs(portal: Portal) {
    return [
      { label: "Home", href: "/" },
      { label: `${this.portals[portal].title} desk`, href: this.portals[portal].desk },
    ];
  },
};
identityProvider satisfies FrontendContributor;

export type { IdentityWorkspacePage } from "./identity.workspace";
export type { Principal as IdentityPrincipal } from "./identity.types";
