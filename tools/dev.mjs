import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseEnv } from "node:util";
import { refreshGovernance } from "./governance.mjs";

export async function startDevelopment({
  root = process.cwd(),
  env = process.env,
  command,
  args,
  stdio = "inherit",
} = {}) {
  if (!command) {
    const require = createRequire(resolve(root, "package.json"));
    const version = pathToFileURL(require.resolve("@devxcrew/tools/version"));
    command = process.execPath;
    args = [fileURLToPath(new URL("../bin/tools.mjs", version)), "app:dev"];
  }
  const governance = await refreshGovernance(env, root);
  const child = spawn(command, args, { cwd: root, env, stdio, windowsHide: true });
  return { child, governance };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let local = {};
  try {
    local = parseEnv(readFileSync(resolve(".env"), "utf8"));
  } catch {
    /* The app owns required environment validation. */
  }
  const { child } = await startDevelopment({ env: { ...local, ...process.env } });
  child.once("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  child.once("exit", (code) => {
    process.exitCode = code ?? 1;
  });
  async function stop() {
    if (child.exitCode !== null || !child.pid) return;
    const require = createRequire(resolve("package.json"));
    const version = pathToFileURL(require.resolve("@devxcrew/tools/version"));
    const { stopProcessTree } = await import(new URL("./preflight.mjs", version));
    stopProcessTree(child.pid);
  }
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
}
