import type { Portal } from "./identity.types";

export type IdentityRecord = Record<string, string | number | boolean | string[] | null>;
export type ResourceField = {
  name: string;
  label: string;
  type?: "email" | "password" | "checkbox" | "number";
  required?: boolean;
  defaultValue?: string | boolean;
};
export type IdentityResource = {
  id: string;
  title: string;
  columns: string[];
  fields?: ResourceField[];
  create?: boolean;
  edit?: boolean;
  remove?: string;
  detail?: boolean;
  resend?: boolean;
};

export function identityResources(portal: Portal): IdentityResource[] {
  const resources: IdentityResource[] = [
    {
      id: "sessions",
      title: "Sessions",
      columns: ["portal", "expiresAt"],
      remove: "Revoke session",
    },
  ];
  if (portal === "user") return resources;
  return [
    {
      id: "users",
      title: "Users",
      columns: ["name", "email", "active"],
      create: true,
      edit: true,
      fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "active", label: "Active", type: "checkbox" },
      ],
    },
    {
      id: "organizations",
      title: "Organizations",
      columns: ["name", "active"],
      create: portal === "super-admin",
      edit: portal === "super-admin",
      fields: [
        { name: "name", label: "Name", required: true },
        { name: "active", label: "Active", type: "checkbox" },
      ],
    },
    {
      id: "memberships",
      title: "Memberships",
      columns: ["userId", "tenantId", "roleId", "active"],
      create: true,
      edit: true,
      remove: "Revoke membership",
      fields: [
        { name: "userId", label: "User", required: true },
        { name: "tenantId", label: "Organization", required: true },
        { name: "roleId", label: "Role", required: true },
      ],
    },
    {
      id: "roles",
      title: "Roles",
      columns: ["name", "portal", "active", "system"],
      create: true,
      edit: true,
      fields: [
        { name: "name", label: "Name", required: true },
        { name: "active", label: "Active", type: "checkbox" },
        { name: "permissionIds", label: "Permissions", defaultValue: "desk.user" },
      ],
    },
    { id: "permissions", title: "Permissions", columns: ["id"] },
    ...resources,
    {
      id: "invitations",
      title: "Invitations",
      columns: ["name", "email", "roleId", "status", "expiresAt"],
      create: true,
      resend: true,
      remove: "Revoke invitation",
      fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "roleId", label: "Role", required: true },
        ...(portal === "super-admin"
          ? [{ name: "tenantId", label: "Organization", required: true }]
          : []),
      ],
    },
    {
      id: "audit-events",
      title: "Audit history",
      columns: ["action", "actorId", "resourceId", "createdAt"],
    },
  ];
}

export function resourceFields(
  resource: IdentityResource,
  creating: boolean,
  portal: Portal,
  record: IdentityRecord = {},
): ResourceField[] {
  const fields = [...(resource.fields ?? [])].filter(
    (field) => !(creating && resource.id === "users" && field.name === "active"),
  );
  if (resource.id === "memberships" && !creating)
    return [
      { name: "roleId", label: "Role", required: true },
      { name: "active", label: "Active", type: "checkbox" },
    ];
  if (resource.id === "roles") {
    if (!creating && record.system) return [{ name: "permissionIds", label: "Permissions" }];
    if (creating) {
      const selected = fields.filter((field) => field.name !== "active");
      if (portal === "super-admin")
        selected.push({ name: "tenantId", label: "Organization", required: true });
      return selected;
    }
  }
  if (creating && resource.id === "organizations")
    fields.unshift({ name: "id", label: "Organization ID", required: true });
  if (creating && resource.id === "users") {
    fields.push({ name: "password", label: "Password", type: "password", required: true });
    fields.push({ name: "roleId", label: "Role", required: true });
    if (portal === "super-admin")
      fields.push({ name: "tenantId", label: "Organization", required: true });
  }
  return fields;
}

export function resourceCanEdit(
  resource: IdentityResource,
  portal: Portal,
  record: IdentityRecord,
): boolean {
  return (
    Boolean(resource.edit) &&
    !(resource.id === "roles" && record.system && portal !== "super-admin")
  );
}

export function assignableRoleOptions(
  records: IdentityRecord[],
  portal: Portal,
  resource: string,
  tenantId?: string,
): IdentityRecord[] {
  return records.filter(
    (role) =>
      role.active !== false &&
      (portal === "super-admin" || role.portal === "user") &&
      (resource !== "invitations" || role.system === true) &&
      (!role.tenantId || !tenantId || role.tenantId === tenantId),
  );
}

export function displayValue(value: IdentityRecord[string] | undefined): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return value == null ? "—" : String(value);
}
export function identityColumnValue(column: string, record: IdentityRecord): string {
  const labels: Record<string, string> = {
    userId: "userName",
    tenantId: "organizationName",
    roleId: "roleName",
  };
  return displayValue(record[labels[column]] ?? record[column]);
}

export function identityFieldLabel(name: string): string {
  const labels: Record<string, string> = {
    id: "ID",
    userId: "User",
    tenantId: "Organization",
    roleId: "Role",
    resourceId: "Record",
    actorId: "Actor",
    createdAt: "Created",
    expiresAt: "Expires",
    permissionIds: "Permissions",
    active: "Active",
    portal: "Portal",
    email: "Email",
    name: "Name",
    action: "Action",
  };
  return (
    labels[name] ?? name.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase())
  );
}
