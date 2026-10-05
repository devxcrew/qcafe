import type { IncomingMessage, ServerResponse } from "node:http";
import { dispatchIdentity } from "./identity.service.js";
import type { IdentityTransport } from "./identity.types.js";

export function identityController(
  provider: IdentityTransport,
  request: IncomingMessage,
  response: ServerResponse,
  signal?: AbortSignal,
) {
  return dispatchIdentity(provider, request, response, signal);
}
