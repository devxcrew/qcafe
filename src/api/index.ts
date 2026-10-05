import { resolve } from "node:path";
import { createApplicationServer, readApplicationConfig } from "@devxcrew/framework";
import { createDatabaseProvider } from "./database/database.provider.js";
import { identityModule } from "./identity/index.js";
import {
  contributeModule,
  createApplicationComposition,
  dispatchApplicationRequest,
} from "./application/application.provider.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createEmailProvider } from "@devxcrew/email";

const config = readApplicationConfig(process.env);
const database = createDatabaseProvider();
let startupStep = "database connection";
const modules = createApplicationComposition(
  [
    contributeModule({
      name: "database",
      create: () => database,
      start: async (provider) => {
        startupStep = "database connection";
        await provider.verify();
      },
      stop: (provider) => provider.close(),
    }),
    contributeModule({
      name: "email",
      dependencies: ["database"],
      create: () => ({ delivery: undefined as ReturnType<typeof createEmailProvider> | undefined }),
      start(provider) {
        startupStep = "email configuration";
        provider.delivery =
          process.env.EMAIL_ENABLED === "1" ? createEmailProvider(process.env) : undefined;
      },
      stop: (provider) => provider.delivery?.close(),
    }),
    identityModule(process.env, (step) => {
      startupStep = step;
    }),
  ],
  { startupTimeoutMs: 30_000, shutdownTimeoutMs: 2_000 },
);
try {
  await modules.start();
} catch {
  const action =
    startupStep === "identity schema verification"
      ? " Run npm run db:setup before starting QCafe."
      : " Check the configured environment before starting QCafe.";
  throw new Error(`Application startup failed during ${startupStep}.${action}`);
}
const frontendDirectory = resolve("dist/frontend");
let ready = true;
const server = await (async () => {
  try {
    return createApplicationServer({
      config,
      frontendDirectory,
      readiness: () => ready,
      requestTimeoutMs: 15_000,
      headersTimeoutMs: 10_000,
      handlerTimeoutMs: 20_000,
      async apiHandler(request, response, context) {
        const handled = await modules.handle(request, response, context.signal);
        if (!handled) {
          response.writeHead(404, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ error: { code: "not_found", message: "Not found." } }));
        }
      },
    });
  } catch {
    await modules.stop();
    throw new Error("Application startup failed during server setup.");
  }
})();
let closeFrontend: (() => Promise<void>) | undefined;
const staticHandlers = server.listeners("request");
let serveFrontend = (request: IncomingMessage, response: ServerResponse) => {
  for (const handler of staticHandlers) handler.call(server, request, response);
};

try {
  if (config.mode === "development") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true, ws: { server } },
      appType: "spa",
    });
    serveFrontend = (request, response) => {
      if (request.url?.split("?")[0] === "/api" || request.url?.startsWith("/api/")) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      vite.middlewares(request, response, () => {
        response.writeHead(404);
        response.end("Not found");
      });
    };
    closeFrontend = () => vite.close();
  }
} catch {
  await modules.stop();
  throw new Error("Application startup failed during frontend setup.");
}
server.removeAllListeners("request");
server.on("request", (request, response) => {
  if (/^\/api(?:\/|\?|$)/.test(request.url ?? "") || request.url === "/health/ready") {
    for (const handler of staticHandlers) handler.call(server, request, response);
    return;
  }
  void dispatchApplicationRequest(modules.handle, request, response)
    .then((handled) => {
      if (!handled) serveFrontend(request, response);
    })
    .catch(() => {
      if (!response.headersSent) response.writeHead(500);
      response.end("Unable to complete the request.");
    });
});

server.on("error", (error) => {
  void error;
  ready = false;
  console.error("Application server failed.");
  process.exitCode = 1;
  void modules.stop().catch(() => console.error("Application shutdown failed."));
});
server.listen(config.port, config.host, () =>
  console.info(`${config.name} Â· ${config.mode} Â· ${config.url}`),
);
let shutdownPromise: Promise<void> | undefined;
async function shutdown() {
  shutdownPromise ??= closeApplication();
  return shutdownPromise;
}
async function closeApplication() {
  ready = false;
  const timeout = setTimeout(() => process.exit(1), 10_000).unref();
  const forceConnections = setTimeout(() => server.closeAllConnections(), 8_000).unref();
  try {
    const closed = new Promise<void>((resolveClose) => server.close(() => resolveClose()));
    await closeFrontend?.();
    await closed;
    await modules.stop();
  } finally {
    clearTimeout(forceConnections);
    clearTimeout(timeout);
  }
}
const onShutdown = () => {
  void shutdown().catch(() => {
    console.error("Application shutdown failed.");
    process.exitCode = 1;
  });
};
process.once("SIGINT", onShutdown);
process.once("SIGTERM", onShutdown);
