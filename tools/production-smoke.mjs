import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createApplicationServer, readApplicationConfig } from "@devxcrew/framework";
const config = readApplicationConfig({
  APP_NAME: "QCafe",
  APP_PORT: "5176",
  APP_URL: "http://127.0.0.1:5176",
  APP_MODE: "production",
});
const server = createApplicationServer({
  config,
  frontendDirectory: fileURLToPath(new URL("../dist/frontend", import.meta.url)),
});
try {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const path of ["/", "/login", "/desk"]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes('id="root"'));
    if (path === "/") {
      const asset = html.match(/src="([^"]+\.js)"/)[1];
      const bundle = await fetch(base + asset);
      assert.equal(bundle.status, 200);
      await bundle.arrayBuffer();
    }
  }
  for (const path of ["/api/health", "/assets/missing.js"]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 404);
    await response.text();
  }
  console.info("Production frontend routes, assets, and API boundary passed.");
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
