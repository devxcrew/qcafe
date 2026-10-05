import { resolve } from "node:path";
import { createApplicationServer, readApplicationConfig } from "@devxcrew/framework";

const config = readApplicationConfig(process.env);
const frontendDirectory = resolve("dist/frontend");
const server = createApplicationServer({ config, frontendDirectory });
let closeFrontend: (() => Promise<void>) | undefined;

if (config.mode === "development") {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true, ws: { server } },
    appType: "spa",
  });
  server.removeAllListeners("request");
  server.on("request", (request, response) => {
    if (request.url?.split("?")[0] === "/api" || request.url?.startsWith("/api/")) {
      response.writeHead(404);
      response.end("No backend APIs are configured.");
      return;
    }
    vite.middlewares(request, response, () => {
      response.writeHead(404);
      response.end("Not found");
    });
  });
  closeFrontend = () => vite.close();
}

server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(config.port, config.host, () =>
  console.info(`${config.name} · ${config.mode} · ${config.url}`),
);
async function shutdown() {
  const timeout = setTimeout(() => process.exit(1), 10_000).unref();
  await closeFrontend?.();
  server.closeAllConnections();
  await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
  clearTimeout(timeout);
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
