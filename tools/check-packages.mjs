import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const packages = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies });
const missing = packages.filter(
  (name) =>
    !lock.packages[`node_modules/${name}`] ||
    !existsSync(new URL(`../node_modules/${name}/package.json`, import.meta.url)),
);
if (missing.length) throw new Error(`Missing installed packages: ${missing.join(", ")}`);
if (lock.packages["node_modules/express"]) throw new Error("Express remains installed.");
for (const name of ["kysely", "react", "@devxcrew/email", "@devxcrew/platform"])
  require.resolve(name);
for (const [name, version] of Object.entries({
  ...manifest.dependencies,
  ...manifest.devDependencies,
})) {
  if (/^(?:file:|link:|workspace:)/.test(version))
    throw new Error(`Release dependencies must use the registry: ${name}`);
}
require.resolve("@devxcrew/platform");
const snapshots = packages.flatMap((name) => {
  if (!name.startsWith("@devxcrew/")) return [];
  const installed = JSON.parse(
    readFileSync(new URL(`../node_modules/${name}/package.json`, import.meta.url), "utf8"),
  );
  const locked = lock.packages[`node_modules/${name}`].version;
  return installed.version === locked
    ? []
    : [`${name}: installed ${installed.version}, locked ${locked}`];
});
console.info(`${packages.length} direct package installations and lock entries verified.`);
if (snapshots.length) {
  console.warn(`Development snapshots differ from the lockfile:\n${snapshots.join("\n")}`);
  console.warn(
    "This result does not verify a clean registry installation. Run npm ci and verify in an isolated release consumer.",
  );
}
