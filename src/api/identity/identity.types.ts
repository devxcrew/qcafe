import type { IncomingMessage, ServerResponse } from "node:http";

export interface IdentityTransport {
  handle(
    request: IncomingMessage,
    response: ServerResponse,
    signal?: AbortSignal,
  ): Promise<boolean>;
}
