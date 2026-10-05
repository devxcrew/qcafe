import { z } from "zod";
import {
  userCreateSchema,
  userUpdateSchema,
  organizationCreateSchema,
  organizationUpdateSchema,
  membershipSchema,
  roleUpdateSchema,
  profileSchema,
  settingsSchema,
  securitySettingsSchema,
  invitationSchema,
  customRoleCreateSchema,
  customRoleUpdateSchema,
  membershipUpdateSchema,
} from "@devxcrew/platform/identity/schemas";
export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(256),
  tenantId: z.string().max(100),
});
export const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  password: z.string().min(12).max(256),
});
export const identityListSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).catch(1),
  per_page: z.coerce.number().int().min(1).max(100).catch(20),
  search: z.string().max(100).catch(""),
  sort: z.enum(["id", "name", "email"]).catch("id"),
  direction: z.enum(["asc", "desc"]).catch("asc"),
});
export const recoveryFormSchema = z.object({
  email: z.email().max(254),
  tenantId: z.string().max(100),
  token: z.string(),
  password: z.string(),
});
export const tokenFormSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  password: z.string().min(12).max(256),
  email: z.string(),
  tenantId: z.string(),
});

import type { ResourceField } from "./identity.resources";
import type { IdentityRecord } from "./identity.resources";

export function identityResourcePayload(
  path: string,
  creating: boolean,
  values: Record<string, string | boolean>,
  record: IdentityRecord,
) {
  const resource = path.split("/")[0];
  const payload: Record<string, unknown> = { ...values };
  if (!creating) payload.expectedVersion = record.version;
  if ("sessionSeconds" in payload) payload.sessionSeconds = Number(payload.sessionSeconds);
  if ("permissionIds" in payload)
    payload.permissionIds = String(payload.permissionIds)
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  const contracts: Record<string, z.ZodType> = {
    users: creating ? userCreateSchema : userUpdateSchema,
    organizations: creating ? organizationCreateSchema : organizationUpdateSchema,
    memberships: creating ? membershipSchema : membershipUpdateSchema,
    roles: creating
      ? customRoleCreateSchema
      : record.system
        ? roleUpdateSchema
        : customRoleUpdateSchema,
    profile: profileSchema,
    settings: settingsSchema,
    "application-settings": settingsSchema,
    "security-settings": securitySettingsSchema,
    invitations: invitationSchema,
  };
  const contract = contracts[resource];
  if (!contract) throw new Error("This resource does not support a form.");
  return contract.safeParse(payload);
}
export function resourceSchema(fields: ResourceField[]) {
  return z.object(
    Object.fromEntries(
      fields.map((field) => [
        field.name,
        field.type === "checkbox"
          ? z.boolean()
          : field.type === "email"
            ? z.email().max(254)
            : field.type === "password"
              ? z.string().min(12).max(256)
              : field.required
                ? z.string().trim().min(1, `${field.label} is required.`).max(200)
                : z.string().max(2000),
      ]),
    ),
  );
}

export function identityDeletePath(resource: string, record: IdentityRecord): string {
  const path = `${resource}/${encodeURIComponent(String(record.id))}`;
  if (resource !== "memberships") return path;
  const version = z.number().int().nonnegative().safeParse(record.version);
  if (!version.success) throw new Error("Reload this membership before removing it.");
  return `${path}?expectedVersion=${version.data}`;
}
