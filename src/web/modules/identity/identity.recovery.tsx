import { useEffect, useState } from "react";
import { useForm } from "@tanstack/react-form";
import type { z } from "zod";
import { Button } from "@devxcrew/ui/components/button";
import { Input } from "@devxcrew/ui/components/input";
import { usePublicIdentityConfiguration } from "./identity.public-configuration";
import { identityRequest } from "./identity.services";
import { identityProvider } from "./identity.provider";
import { recoveryFormSchema, tokenFormSchema } from "./identity.schema";
import type { Portal } from "./identity.types";

export function IdentityRecovery({ portal }: { portal: Portal }) {
  const configuration = usePublicIdentityConfiguration(portal);
  const accepting = window.location.pathname.endsWith("accept-invitation");
  const completing = accepting || window.location.pathname.endsWith("reset-password");
  const [token] = useState(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    return value;
  });
  useEffect(() => {
    if (token)
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }, [token]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  type RecoveryValues = { email: string; tenantId: string; password: string; token: string };
  const schema: z.ZodType<RecoveryValues, RecoveryValues> = completing
    ? tokenFormSchema
    : recoveryFormSchema;
  const form = useForm({
    defaultValues: { email: "", tenantId: "", password: "", token },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setError("");
      if (!configuration.data) return;
      if (!completing && configuration.data.requiresOrganizationId && !value.tenantId.trim()) {
        setError("Enter your organization ID.");
        return;
      }
      try {
        await identityRequest(
          portal,
          accepting ? "invitations/accept" : completing ? "recovery/complete" : "recovery",
          "POST",
          completing
            ? { token: value.token, password: value.password }
            : { email: value.email, ...(value.tenantId ? { tenantId: value.tenantId } : {}) },
        );
        form.reset();
        form.setFieldValue("token", "");
        setMessage(
          completing
            ? "Your password is set. You can sign in."
            : "If the account is eligible, you will receive a recovery email.",
        );
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Could not complete the request.");
      }
    },
  });
  return (
    <main className="mx-auto grid max-w-md gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold">
        {accepting
          ? "Accept invitation"
          : completing
            ? "Set a new password"
            : "Recover your account"}
      </h1>
      {!configuration.data ? (
        <div>
          {configuration.error ? (
            <>
              <p role="alert">{configuration.error}</p>
              <Button onClick={configuration.retry}>Retry</Button>
            </>
          ) : (
            <p role="status">Loading account settingsï¿½</p>
          )}
        </div>
      ) : message ? (
        <p role="status">{message}</p>
      ) : (
        <form
          noValidate
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          {(completing
            ? ["password"]
            : configuration.data.requiresOrganizationId
              ? ["email", "tenantId"]
              : ["email"]
          ).map((name) => (
            <form.Field name={name as "email" | "tenantId" | "password"} key={name}>
              {(field) => (
                <label className="grid gap-2">
                  {name === "password"
                    ? "New password"
                    : name === "tenantId"
                      ? "Organization ID"
                      : "Email"}
                  <Input
                    required
                    type={name === "password" ? "password" : name === "email" ? "email" : "text"}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    autoComplete={name === "password" ? "new-password" : "off"}
                  />
                  {field.state.meta.errors.map((issue, index) => (
                    <span role="alert" className="text-destructive" key={index}>
                      {typeof issue === "string" ? issue : issue?.message}
                    </span>
                  ))}
                </label>
              )}
            </form.Field>
          ))}
          {error && <p role="alert">{error}</p>}
          <form.Subscribe
            selector={(state) => ({ busy: state.isSubmitting, invalid: state.errors.length > 0 })}
          >
            {({ busy, invalid }) => (
              <>
                {invalid && (
                  <p role="alert">
                    {completing
                      ? "Use a valid email link and a password of at least 12 characters."
                      : "Enter a valid email."}
                  </p>
                )}
                <Button disabled={busy} type="submit">
                  {busy ? "Submittingâ€¦" : completing ? "Set password" : "Send recovery email"}
                </Button>
              </>
            )}
          </form.Subscribe>
        </form>
      )}
      <a className="underline" href={identityProvider.portals[portal].login}>
        Return to sign in
      </a>
    </main>
  );
}
