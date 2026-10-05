import { useEffect, useState } from "react";
import { IdentityResourceForm } from "./identity.form";
import { IdentityPassword } from "./identity.password";
import { identityRequest } from "./identity.services";
import type { IdentityRecord, ResourceField } from "./identity.resources";
import type { Portal } from "./identity.types";

export function IdentityAccount({
  portal,
  page,
  base,
  onPasswordChanged,
  canChangePassword,
}: {
  portal: Portal;
  page: "profile" | "settings" | "application-settings" | "security-settings";
  base: string;
  onPasswordChanged(): void;
  canChangePassword: boolean;
}) {
  const [loaded, setLoaded] = useState<{
    portal: Portal;
    path: string;
    record: IdentityRecord;
  } | null>(null);
  const [error, setError] = useState("");
  const path = page;
  const record = loaded?.path === path && loaded.portal === portal ? loaded.record : null;
  const settings = page !== "profile";
  useEffect(() => {
    const controller = new AbortController();
    setLoaded(null);
    setError("");
    void identityRequest<{ data: IdentityRecord }>(
      portal,
      path,
      "GET",
      undefined,
      controller.signal,
    )
      .then((value) => {
        if (!controller.signal.aborted) setLoaded({ portal, path, record: value.data });
      })
      .catch((failure) => {
        if (!controller.signal.aborted)
          setError(failure instanceof Error ? failure.message : "Could not load account.");
      });
    return () => controller.abort();
  }, [portal, path]);
  const fields: ResourceField[] =
    page === "security-settings"
      ? [
          {
            name: "sessionSeconds",
            label: "Session duration in seconds",
            type: "number",
            required: true,
          },
        ]
      : settings
        ? [
            { name: "displayName", label: "Display name", required: true },
            { name: "locale", label: "Locale", required: true },
            { name: "timeZone", label: "Time zone", required: true },
          ]
        : [{ name: "name", label: "Name", required: true }];
  return (
    <section className="grid gap-6">
      <h1 className="text-2xl font-semibold">
        {page === "application-settings"
          ? "Application settings"
          : page === "security-settings"
            ? "Security settings"
            : settings
              ? "Organization settings"
              : "Your account"}
      </h1>
      {error && <p role="alert">{error}</p>}
      {page === "security-settings" && <p>Changing session duration signs out all users.</p>}
      {record ? (
        settings && portal === "user" ? (
          <dl>
            {fields.map((field) => (
              <div className="py-2" key={field.name}>
                <dt>{field.label}</dt>
                <dd>{String(record[field.name] ?? "")}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <IdentityResourceForm
            key={`${portal}:${path}`}
            portal={portal}
            path={path}
            fields={fields}
            record={record}
            creating={false}
            returnTo={`${base}${settings ? `/${page}` : ""}`}
          />
        )
      ) : (
        !error && <p role="status">Loading…</p>
      )}
      {!settings && canChangePassword && (
        <IdentityPassword portal={portal} onChanged={onPasswordChanged} />
      )}
    </section>
  );
}
