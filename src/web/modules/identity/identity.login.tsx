import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { LoginPage } from "@devxcrew/ui/blocks/auth";
import { Input } from "@devxcrew/ui/components/input";
import { usePublicIdentityConfiguration } from "./identity.public-configuration";
import { identityProvider } from "./identity.provider";
import { loginSchema } from "./identity.schema";
import { IdentityApiError } from "./identity.services";
import type { Portal } from "./identity.types";

export function IdentityLogin({ portal }: { portal: Portal }) {
  const navigate = useNavigate();
  const configuration = usePublicIdentityConfiguration(portal);
  const signInConfig = configuration.data;
  const [error, setError] = useState("");
  const form = useForm({
    defaultValues: { email: "", password: "", tenantId: "" },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      setError("");
      if (!signInConfig) return;
      if (signInConfig.requiresOrganizationId && !value.tenantId.trim()) {
        setError("Enter your organization ID.");
        return;
      }
      try {
        await identityProvider.api.login(portal, value);
        form.setFieldValue("password", "");
        await navigate({ to: identityProvider.portals[portal].desk });
      } catch (failure) {
        if (failure instanceof IdentityApiError) {
          setError([failure.message, ...Object.values(failure.errors).flat()].join(" "));
        } else setError("Unable to sign in. Check the connection.");
      }
    },
  });
  return (
    <>
      <nav className="public-back flex gap-4" aria-label="Login portals">
        <Link to="/">Home</Link>
        <Link to="/login">User</Link>
        <a href="/admin/login">Administrator</a>
        <a href="/sa/login">Super administrator</a>
      </nav>
      {!signInConfig ? (
        <main className="mx-auto max-w-sm px-4 py-16">
          {configuration.error ? (
            <>
              <p role="alert">{configuration.error}</p>
              <button type="button" onClick={configuration.retry}>
                Retry
              </button>
            </>
          ) : (
            <p role="status">Loading sign-in settings...</p>
          )}
        </main>
      ) : (
        <>
          <form.Subscribe
            selector={(state) => ({ busy: state.isSubmitting, errors: state.errors })}
          >
            {(state) => (
              <LoginPage
                identifierLabel="Email"
                identifierType="email"
                brandName={signInConfig.displayName}
                additionalFields={
                  signInConfig.requiresOrganizationId ? (
                    <form.Field name="tenantId">
                      {(field) => (
                        <label className="grid gap-2 text-sm">
                          Organization ID
                          <Input
                            required
                            value={field.state.value}
                            onChange={(event) => field.handleChange(event.target.value)}
                            onBlur={field.handleBlur}
                            autoComplete="organization"
                          />
                        </label>
                      )}
                    </form.Field>
                  ) : undefined
                }
                busy={state.busy}
                error={
                  error || (state.errors.length ? "Enter a valid email and password." : undefined)
                }
                title={`${identityProvider.portals[portal].title} sign in`}
                description="Sign in to your account."
                forgotHref={identityProvider.portals[portal].login.replace(
                  "/login",
                  "/forgot-password",
                )}
                registerHref={null}
                devLoginEnabled={false}
                onSubmit={(email, password) => {
                  form.setFieldValue("email", email.trim());
                  form.setFieldValue("password", password);
                  void form.handleSubmit();
                }}
              />
            )}
          </form.Subscribe>
        </>
      )}
    </>
  );
}
