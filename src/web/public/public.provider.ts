import { HomePage } from "./HomePage";
import type { FrontendContributor } from "../composition/frontend.provider";

export const publicProvider = {
  id: "public",
  routes: [{ path: "/", component: HomePage }] as const,
} satisfies FrontendContributor;
