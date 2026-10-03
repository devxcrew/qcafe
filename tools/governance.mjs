import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function refreshGovernance(env, root = process.cwd()) {
  try {
    if (env.MCP_SERVER_URL && env.MCP_SERVER_URL !== "https://mcp.codexsun.com/mcp")
      throw new Error("Only the cloud MCP endpoint is allowed.");
    const { connectGovernance } = await import("../agent/connect.mjs");
    const instructions = await connectGovernance(env, { timeout: 15000 });
    const directory = resolve(root, ".cache/governance");
    await mkdir(directory, { recursive: true });
    await writeFile(
      resolve(directory, "instructions.json"),
      JSON.stringify(instructions, null, 2) + "\n",
    );
    console.info(
      `Governance connected for ${instructions.appId}. Instructions: .cache/governance/instructions.json`,
    );
    return true;
  } catch {
    console.info("Live governance unavailable. Restore the cloud connection before continuing.");
    throw new Error("Live MCP Governance connection is required.");
  }
}
