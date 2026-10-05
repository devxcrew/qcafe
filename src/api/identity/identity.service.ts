import type { IncomingMessage, ServerResponse } from "node:http";
import type { IdentityTransport } from "./identity.types.js";

// Platform owns server validation, domain rules and persistence.
export function dispatchIdentity(
  provider: IdentityTransport,
  request: IncomingMessage,
  response: ServerResponse,
  signal?: AbortSignal,
) {
  return provider.handle(request, response, signal);
}
