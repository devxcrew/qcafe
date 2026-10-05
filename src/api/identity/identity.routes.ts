import type { IncomingMessage, ServerResponse } from "node:http";
import { identityController } from "./identity.controller.js";
import type { IdentityTransport } from "./identity.types.js";

export function identityRoutes(
  provider: IdentityTransport,
  request: IncomingMessage,
  response: ServerResponse,
  signal?: AbortSignal,
) {
  return identityController(provider, request, response, signal);
}
