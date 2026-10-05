import { Home, Settings, Users } from "lucide-react";
import type { FrontendContext } from "../../composition/frontend.provider";
import type { MdiNavigationSection } from "@devxcrew/ui/layouts/main-workspace";
import { identityResources } from "./identity.resources";
import type { Portal } from "./identity.types";

export function identityNavigation(context: FrontendContext): MdiNavigationSection[] {
  if (!["user", "admin", "super-admin"].includes(context.workspace)) return [];
  const portal = context.workspace as Portal;
  const { base, pathname, permissions } = context;
  const at = (path: string) => pathname === path;
  const resources = identityResources(portal);
  return [
    {
      label: "Identity",
      defaultOpen: true,
      items: resources.map((resource) => ({
        label: resource.title,
        icon: Users,
        href: `${base}/${resource.id}`,
        active: at(`${base}/${resource.id}`) || pathname.startsWith(`${base}/${resource.id}/`),
      })),
    },
    {
      label: "Account",
      defaultOpen: true,
      items: [
        ...(permissions.includes("identity.self")
          ? [{ label: "Profile", icon: Home, href: base, active: at(base) }]
          : []),
        {
          label: "Settings",
          icon: Settings,
          href: `${base}/settings`,
          active: at(`${base}/settings`),
        },
        ...(permissions.includes("identity.password")
          ? [
              {
                label: "Password",
                icon: Settings,
                href: `${base}/password`,
                active: at(`${base}/password`),
              },
            ]
          : []),
        ...(portal === "super-admin"
          ? [
              {
                label: "Application",
                icon: Settings,
                href: `${base}/application-settings`,
                active: at(`${base}/application-settings`),
              },
              {
                label: "Security",
                icon: Settings,
                href: `${base}/security-settings`,
                active: at(`${base}/security-settings`),
              },
            ]
          : []),
      ],
    },
  ];
}
