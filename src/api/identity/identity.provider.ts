import { identityRoutes } from "./identity.routes.js";
import { createIdentityProvider, IdentityError } from "@devxcrew/platform";
import { HttpError } from "@devxcrew/framework";
import type { createDatabaseProvider } from "../database/database.provider.js";
import type { EmailDelivery } from "@devxcrew/email";
import { contributeModule } from "../application/application.provider.js";

type IdentityProvider = ReturnType<typeof createIdentityProvider>;
function transportError(error: unknown): never {
  if (error instanceof IdentityError) {
    const fields = error.fields
      ? Object.fromEntries(
          Object.entries(error.fields).map(([key, messages]) => [key, [...messages]]),
        )
      : undefined;
    throw new HttpError(error.status, error.code, error.message, fields);
  }
  throw error;
}
export function identityModule(environment: NodeJS.ProcessEnv, stage: (name: string) => void) {
  return contributeModule(
    {
      name: "identity",
      dependencies: ["database", "email"],
      create(dependencies) {
        const database = dependencies.get("database") as ReturnType<typeof createDatabaseProvider>;
        const email = dependencies.get("email") as { delivery?: EmailDelivery };
        let current: IdentityProvider | undefined;
        function readyProvider() {
          if (!current) throw new Error("Identity provider is not initialized.");
          return current;
        }
        return {
          initialize() {
            current = createIdentityProvider(database.database, environment, {
              delivery: email.delivery,
            });
          },
          verify: () => readyProvider().verify(),
          handle: (...args: Parameters<IdentityProvider["handle"]>) =>
            readyProvider().handle(...args),
          authenticate: (...args: Parameters<IdentityProvider["authenticate"]>) =>
            readyProvider()
              .authenticate(...args)
              .catch(transportError),
          authenticateRequest: (...args: Parameters<IdentityProvider["authenticateRequest"]>) =>
            readyProvider()
              .authenticateRequest(...args)
              .catch(transportError),
          requirePermission: (...args: Parameters<IdentityProvider["requirePermission"]>) => {
            try {
              return readyProvider().requirePermission(...args);
            } catch (error) {
              return transportError(error);
            }
          },
          registerPermissions: (...args: Parameters<IdentityProvider["registerPermissions"]>) =>
            readyProvider().registerPermissions(...args),
        };
      },
      async start(provider) {
        stage("identity configuration");
        provider.initialize();
        stage("identity schema verification");
        await provider.verify();
      },
    },
    identityRoutes,
  );
}
