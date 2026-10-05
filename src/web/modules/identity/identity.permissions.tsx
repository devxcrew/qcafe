import type { IdentityRecord } from "./identity.resources";
import type { IdentityPermissionCatalogEntry } from "@devxcrew/platform/identity/schemas";

export function IdentityPermissionChoices({
  id,
  records,
  value,
  system,
  portal,
  onChange,
  invalid,
  describedBy,
}: {
  id: string;
  records?: IdentityRecord[];
  value: string;
  system: boolean;
  portal: string;
  onChange(value: string): void;
  invalid?: boolean;
  describedBy?: string;
}) {
  if (!records) return <p role="status">Loading permissions…</p>;
  const selected = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const rolePortal = system ? portal : "user";
  const available = rolePermissionChoices(records, rolePortal);
  const required = system
    ? [`desk.${portal}`, "identity.password", ...(portal === "user" ? [] : ["identity.manage"])]
    : ["desk.user"];
  return (
    <fieldset id={id} className="grid gap-3" aria-invalid={invalid} aria-describedby={describedBy}>
      <legend className="sr-only">Permissions</legend>
      {available.map((permission) => {
        const key = String(permission.id);
        return (
          <label className="flex items-center gap-3" key={key}>
            <input
              type="checkbox"
              checked={selected.includes(key)}
              disabled={required.includes(key)}
              onChange={(event) =>
                onChange(
                  (event.target.checked
                    ? [...new Set([...selected, key])]
                    : selected.filter((item) => item !== key)
                  ).join(", "),
                )
              }
            />
            {permission.label || key}
          </label>
        );
      })}
    </fieldset>
  );
}

export function rolePermissionChoices(
  records: readonly IdentityRecord[],
  portal: string,
): IdentityPermissionCatalogEntry[] {
  return records
    .filter(
      (record) =>
        typeof record.id === "string" &&
        Array.isArray(record.portals) &&
        record.portals.includes(portal),
    )
    .map((record) => ({
      id: String(record.id),
      label:
        typeof record.label === "string" && record.label.trim() ? record.label : String(record.id),
      owner: typeof record.owner === "string" ? record.owner : "",
      appId: typeof record.appId === "string" ? record.appId : null,
      portals: record.portals as IdentityPermissionCatalogEntry["portals"],
    }));
}
