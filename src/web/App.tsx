import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
} from "@tanstack/react-router";
import { HomePage } from "./public/HomePage";

const root = createRootRoute({ component: Outlet });
const home = createRoute({ getParentRoute: () => root, path: "/", component: HomePage });
const login = createRoute({
  getParentRoute: () => root,
  path: "/login",
  component: lazyRouteComponent(() => import("./auth/Login"), "Login"),
});
const desk = createRoute({
  getParentRoute: () => root,
  path: "/desk",
  component: lazyRouteComponent(() => import("./desk/Desk"), "Desk"),
});
export const router = createRouter({
  routeTree: root.addChildren([home, login, desk]),
  defaultNotFoundComponent: () => <HomePage />,
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
