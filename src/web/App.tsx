import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";

import { frontend } from "./composition/application.providers";
import { publicProvider } from "./public/public.provider";

const root = createRootRoute({ component: Outlet });

const contributedRoutes = frontend.routes.map((route) =>
  createRoute({
    getParentRoute: () => root,
    path: route.path,
    component: route.component,
  }),
);
export const router = createRouter({
  routeTree: root.addChildren(contributedRoutes),
  defaultNotFoundComponent: publicProvider.routes[0].component,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
