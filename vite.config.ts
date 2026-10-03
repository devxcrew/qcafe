import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import { readApplicationConfig } from "@devxcrew/core-framework";
export default defineConfig(({ mode }) => {
  const config = readApplicationConfig({ ...loadEnv(mode, process.cwd(), ""), ...process.env });
  return {
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      include: ["use-sync-external-store/shim", "use-sync-external-store/shim/with-selector"],
    },
    define: {
      "import.meta.env.VITE_APP_NAME": JSON.stringify(config.name),
      "import.meta.env.VITE_APP_URL": JSON.stringify(config.url),
      "import.meta.env.VITE_APP_MODE": JSON.stringify(config.mode),
    },
    resolve: {
      preserveSymlinks: false,
      alias: { "@": fileURLToPath(new URL("./src/web", import.meta.url)) },
      dedupe: ["react", "react-dom"],
    },
    server: { host: config.host, port: config.port, strictPort: true },
    build: { outDir: "dist/frontend" },
  };
});
