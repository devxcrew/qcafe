import { useEffect, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { Button } from "@devxcrew/ui/components/button";
import { Input } from "@devxcrew/ui/components/input";
import { identityRequest, IdentityApiError } from "./identity.services";
import type { ResourceField, IdentityRecord } from "./identity.resources";
import { assignableRoleOptions } from "./identity.resources";
import { resourceSchema, identityResourcePayload } from "./identity.schema";
import type { Portal } from "./identity.types";
import { useIdentityResourceChoices } from "./identity.hooks";
import { IdentityPermissionChoices } from "./identity.permissions";

export function IdentityResourceForm({
  portal,
  path,
  fields,
  record,
  creating,
  returnTo,
}: {
  portal: Portal;
  path: string;
  fields: ResourceField[];
  record: IdentityRecord;
  creating: boolean;
  returnTo: string;
}) {
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const { choices, choiceSearch, setChoiceSearch, choiceError } = useIdentityResourceChoices(
    portal,
    fields,
  );
  useEffect(() => {
    if (choiceError) setError(choiceError);
  }, [choiceError]);
  const form = useForm({
    defaultValues: Object.fromEntries(
      fields.map((field) => [
        field.name,
        field.type === "checkbox"
          ? ((record[field.name] ?? true) as boolean)
          : Array.isArray(record[field.name])
            ? (record[field.name] as string[]).join(", ")
            : String(record[field.name] ?? field.defaultValue ?? ""),
      ]),
    ) as Record<string, string | boolean>,
    validators: { onSubmit: resourceSchema(fields) },
    onSubmit: async ({ value }) => {
      if (
        !creating &&
        value.active === false &&
        record.active !== false &&
        !window.confirm("Deactivate this record and revoke affected sessions?")
      )
        return;
      if (
        path === "security-settings" &&
        !window.confirm("Apply the session policy and sign out all users?")
      )
        return;
      setError("");
      setConflict(false);
      setServerErrors({});
      const checked = identityResourcePayload(path, creating, value, record);
      if (!checked.success) {
        setServerErrors(checked.error.flatten().fieldErrors);
        setError("Check the highlighted fields.");
        return;
      }
      try {
        await identityRequest(portal, path, creating ? "POST" : "PATCH", checked.data);
        if (path === "application-settings" || path === "settings")
          window.dispatchEvent(new Event("identity:presentation-changed"));
        form.reset(value);
        window.location.assign(returnTo);
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Could not save changes.");
        if (failure instanceof IdentityApiError) {
          setServerErrors(failure.errors);
          setConflict(failure.status === 409 && /version|changed|stale/i.test(failure.message));
        }
      }
    },
  });
  const tenantId = useStore(form.store, (state) =>
    String(state.values.tenantId ?? record.tenantId ?? ""),
  );
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (form.state.isDirty) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [form]);
  return (
    <form
      className="grid max-w-xl gap-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {fields.map((definition) => (
        <form.Field key={definition.name} name={definition.name}>
          {(field) => {
            const errors = [
              ...field.state.meta.errors.map((issue) =>
                typeof issue === "string" ? issue : (issue?.message ?? "Invalid value."),
              ),
              ...(serverErrors[definition.name] ?? []),
            ];
            const id = `identity-${definition.name}`;
            return (
              <div className="grid gap-2">
                <label htmlFor={id}>{definition.label}</label>
                {definition.name in choices && (
                  <Input
                    aria-label={`Search ${definition.label.toLowerCase()}`}
                    placeholder="Search available records"
                    maxLength={100}
                    value={choiceSearch[definition.name] ?? ""}
                    onChange={(event) =>
                      setChoiceSearch((current) => ({
                        ...current,
                        [definition.name]: event.target.value,
                      }))
                    }
                  />
                )}
                {definition.name === "permissionIds" ? (
                  <IdentityPermissionChoices
                    id={id}
                    records={choices.permissionIds}
                    value={String(field.state.value)}
                    system={Boolean(record.system)}
                    portal={String(record.portal ?? "user")}
                    onChange={field.handleChange}
                    invalid={errors.length > 0}
                    describedBy={errors.length ? `${id}-errors` : undefined}
                  />
                ) : definition.name === "locale" ? (
                  <select
                    id={id}
                    className="rounded border p-2"
                    value={String(field.state.value)}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={errors.length > 0}
                    aria-describedby={errors.length ? `${id}-errors` : undefined}
                  >
                    {["en", "en-US", "en-GB"].map((locale) => (
                      <option key={locale}>{locale}</option>
                    ))}
                  </select>
                ) : definition.name in choices ? (
                  <select
                    id={id}
                    className="rounded border p-2"
                    value={String(field.state.value)}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={errors.length > 0}
                    aria-describedby={errors.length ? `${id}-errors` : undefined}
                  >
                    <option value="">Select {definition.label.toLowerCase()}</option>
                    {(definition.name === "roleId"
                      ? assignableRoleOptions(choices.roleId, portal, path.split("/")[0], tenantId)
                      : choices[definition.name]
                    ).map((choice) => (
                      <option key={String(choice.id)} value={String(choice.id)}>
                        {String(choice.name ?? choice.email ?? choice.id)}
                      </option>
                    ))}
                  </select>
                ) : definition.type === "checkbox" ? (
                  <input
                    id={id}
                    type="checkbox"
                    checked={Boolean(field.state.value)}
                    aria-invalid={errors.length > 0}
                    aria-describedby={errors.length ? `${id}-errors` : undefined}
                    onChange={(event) => field.handleChange(event.target.checked)}
                    onBlur={field.handleBlur}
                  />
                ) : (
                  <Input
                    id={id}
                    type={definition.type ?? "text"}
                    value={String(field.state.value)}
                    autoComplete={definition.type === "password" ? "new-password" : "off"}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                      setServerErrors((current) => ({ ...current, [definition.name]: [] }));
                    }}
                    onBlur={field.handleBlur}
                    aria-invalid={errors.length > 0}
                    aria-describedby={errors.length ? `${id}-errors` : undefined}
                  />
                )}
                {errors.length > 0 && (
                  <p id={`${id}-errors`} role="alert" className="text-sm text-destructive">
                    {errors.join(" ")}
                  </p>
                )}
              </div>
            );
          }}
        </form.Field>
      ))}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {conflict && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (window.confirm("Reload the record and discard unsaved changes?"))
              window.location.reload();
          }}
        >
          Reload record
        </Button>
      )}
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(busy) => (
          <div className="flex gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                if (!form.state.isDirty || window.confirm("Discard unsaved changes?"))
                  window.location.assign(returnTo);
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  );
}
