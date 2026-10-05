import type { FunctionComponent } from "react";
import type { MdiNavigationSection } from "@devxcrew/ui/layouts/main-workspace";

export interface FrontendContext {
  workspace: string;
  base: string;
  pathname: string;
  permissions: readonly string[];
}
export interface FrontendContributor {
  id: string;
  routes: readonly { path: string; component: FunctionComponent }[];
  navigation?: (context: FrontendContext) => readonly MdiNavigationSection[];
}

export function composeFrontend<const Contributors extends readonly FrontendContributor[]>(
  contributors: Contributors,
) {
  const owners = new Set<string>();
  const paths = new Set<string>();
  const routes = contributors.flatMap((contributor) => {
    if (!contributor.id.trim() || owners.has(contributor.id))
      throw new Error(`Duplicate or empty frontend owner: ${contributor.id}`);
    owners.add(contributor.id);
    return contributor.routes.map((route) => {
      if (!route.path.startsWith("/") || paths.has(route.path))
        throw new Error(`Duplicate or invalid frontend route: ${route.path}`);
      paths.add(route.path);
      return { ...route, owner: contributor.id } as Contributors[number]["routes"][number] & {
        owner: string;
      };
    });
  });
  return {
    routes,
    navigation(context: FrontendContext): MdiNavigationSection[] {
      return contributors.flatMap((contributor) => [...(contributor.navigation?.(context) ?? [])]);
    },
  };
}
