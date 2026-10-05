import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Run this command through npm run packages:local or packages:npm.");
const mode = process.argv[2];
const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

function npm(args, cwd = root, capture = false) {
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    cwd,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error("Shared package command failed.");
  return result.stdout;
}

if (mode === "local") {
  const sharedRoot = resolve(process.env.CODEXSUN_SHARED_ROOT ?? resolve(root, "../../shared"));
  for (const owner of ["framework", "ui"]) {
    if (!existsSync(resolve(sharedRoot, owner, "package.json")))
      throw new Error(
        `Missing optional ${owner} source at ${sharedRoot}. Set CODEXSUN_SHARED_ROOT to your shared source directory, or use packages:npm.`,
      );
  }
  const destination = resolve(root, ".cache/shared-packages");
  mkdirSync(destination, { recursive: true });
  const tarballs = [];
  for (const owner of ["framework", "ui"]) {
    const directory = resolve(sharedRoot, owner);
    if (owner === "framework") npm(["run", "build"], directory);
    const packed = JSON.parse(
      npm(
        ["pack", "--ignore-scripts", "--json", "--pack-destination", destination],
        directory,
        true,
      ),
    );
    const artifact = Array.isArray(packed) ? packed[0] : Object.values(packed)[0];
    if (!artifact?.filename) throw new Error("npm pack returned no artifact.");
    tarballs.push(resolve(destination, artifact.filename));
  }
  npm(["install", "--no-save", "--package-lock=false", ...tarballs]);
  console.info(
    "Installed local package snapshots. Re-run after shared source changes. Release manifests and lockfiles are unchanged.",
  );
} else if (mode === "npm") {
  const packages = ["@devxcrew/framework", "@devxcrew/ui"].map(
    (name) => `${name}@${manifest.dependencies[name]}`,
  );
  npm(["install", "--no-save", "--package-lock=false", ...packages]);
  console.info("Restored registry packages. npm ci also restores the locked release versions.");
} else {
  throw new Error("Choose local or npm.");
}
