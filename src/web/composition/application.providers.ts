import { composeFrontend } from "./frontend.provider";
import { publicProvider } from "../public/public.provider";
import { identityProvider } from "../modules/identity/identity.provider";

// Register only module-owned public providers here.
export const frontend = composeFrontend([publicProvider, identityProvider]);
