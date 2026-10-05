import {
  composeModules,
  createRequestContext,
  HttpError,
  writeJsonError,
  type ModuleProvider,
} from "@devxcrew/framework";
import type { IncomingMessage, ServerResponse } from "node:http";

export type ApplicationHandler = (
  request: IncomingMessage,
  response: ServerResponse,
  signal?: AbortSignal,
) => boolean | Promise<boolean>;
export interface ApplicationModule {
  registration: ModuleProvider<unknown>;
  handle?: ApplicationHandler;
}

export function contributeModule<T>(
  registration: ModuleProvider<T>,
  handle?: (
    provider: T,
    request: IncomingMessage,
    response: ServerResponse,
    signal?: AbortSignal,
  ) => boolean | Promise<boolean>,
): ApplicationModule {
  let publicProvider: T;
  return {
    registration: {
      name: registration.name,
      dependencies: registration.dependencies,
      create(dependencies) {
        publicProvider = registration.create(dependencies);
        return publicProvider;
      },
      start: (provider, signal) => registration.start?.(provider as T, signal),
      stop: (provider) => registration.stop?.(provider as T),
    },
    handle: handle
      ? (request, response, signal) => handle(publicProvider, request, response, signal)
      : undefined,
  };
}

export function createApplicationComposition(
  modules: readonly ApplicationModule[],
  options: { startupTimeoutMs?: number; shutdownTimeoutMs?: number } = {},
) {
  const runtime = composeModules(
    modules.map((module) => module.registration),
    options,
  );
  return {
    ...runtime,
    get state() {
      return runtime.state;
    },
    async handle(request: IncomingMessage, response: ServerResponse, signal?: AbortSignal) {
      if (runtime.state !== "ready") throw new Error("Application modules are not ready.");
      for (const module of modules) {
        if (signal?.aborted) throw signal.reason;
        if (await module.handle?.(request, response, signal)) return true;
      }
      return false;
    },
  };
}

export async function dispatchApplicationRequest(
  handle: ApplicationHandler,
  request: IncomingMessage,
  response: ServerResponse,
  timeoutMs = 20_000,
) {
  const context = createRequestContext(request, Date.now() + timeoutMs);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const disconnect = () => context.abort(new Error("Client disconnected."));
  response.once("close", disconnect);
  try {
    return await Promise.race([
      Promise.resolve(handle(request, response, context.signal)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          const error = new HttpError(504, "request_timeout", "The request timed out.");
          context.abort(error);
          reject(error);
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    if (!response.headersSent) writeJsonError(response, error, context.requestId);
    else if (!response.writableEnded) response.destroy();
    return true;
  } finally {
    clearTimeout(timer);
    response.removeListener("close", disconnect);
  }
}
