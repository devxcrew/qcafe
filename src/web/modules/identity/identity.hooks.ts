import { useEffect, useState } from "react";
import { identityRequest } from "./identity.services";
import type { ResourceField, IdentityRecord } from "./identity.resources";
import type { Portal } from "./identity.types";

export function useIdentityResourceChoices(portal: Portal, fields: ResourceField[]) {
  const [choiceError, setChoiceError] = useState("");
  const [choices, setChoices] = useState<Record<string, IdentityRecord[]>>({});
  const [choiceSearch, setChoiceSearch] = useState<Record<string, string>>({});
  useEffect(() => {
    const controller = new AbortController();
    const sources: Record<string, string> = {
      userId: "users",
      tenantId: "organizations",
      roleId: "roles",
      permissionIds: "permissions",
    };
    const selected = fields.filter((field) => sources[field.name]);
    void Promise.all(
      selected.map(async (field) => {
        const value = await identityRequest<{
          data: IdentityRecord[];
          meta: { last_page: number };
        }>(
          portal,
          `${sources[field.name]}?per_page=100&page=1&search=${encodeURIComponent(choiceSearch[field.name] ?? "")}`,
          "GET",
          undefined,
          controller.signal,
        );
        const records = [...value.data];
        if (field.name === "permissionIds") {
          for (let page = 2; page <= value.meta.last_page; page++) {
            const next = await identityRequest<{ data: IdentityRecord[] }>(
              portal,
              `permissions?per_page=100&page=${page}`,
              "GET",
              undefined,
              controller.signal,
            );
            records.push(...next.data);
          }
        }
        return [field.name, records] as const;
      }),
    )
      .then((results) => setChoices(Object.fromEntries(results)))
      .catch((failure) => {
        if (!controller.signal.aborted)
          setChoiceError(
            failure instanceof Error ? failure.message : "Could not load available choices.",
          );
      });
    return () => controller.abort();
  }, [fields, portal, choiceSearch]);
  return { choices, choiceSearch, setChoiceSearch, choiceError };
}
