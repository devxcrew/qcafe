import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Button } from "@devxcrew/ui/components/button";
import { Input } from "@devxcrew/ui/components/input";
import { identityProvider } from "./identity.provider";
import { passwordSchema } from "./identity.schema";
import type { Portal } from "./identity.types";

export function IdentityPassword({ portal, onChanged }: { portal: Portal; onChanged: () => void }) {
  const [message, setMessage] = useState("");
  const form = useForm({
    defaultValues: { currentPassword: "", password: "" },
    validators: { onSubmit: passwordSchema },
    onSubmit: async ({ value }) => {
      try {
        await identityProvider.api.password(portal, value);
        form.reset();
        onChanged();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to change password.");
      }
    },
  });
  return (
    <form
      className="mt-6 grid max-w-md gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <h1>Change password</h1>
      <form.Field name="currentPassword">
        {(field) => (
          <label className="grid gap-1">
            Current password
            <Input
              type="password"
              autoComplete="current-password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </label>
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <label className="grid gap-1">
            New password (at least 12 characters)
            <Input
              type="password"
              autoComplete="new-password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </label>
        )}
      </form.Field>
      {message && <p role="alert">{message}</p>}
      <form.Subscribe selector={(state) => ({ busy: state.isSubmitting, errors: state.errors })}>
        {(state) => (
          <>
            {state.errors.length > 0 && (
              <p role="alert">
                Enter your current password and a new password of at least 12 characters.
              </p>
            )}
            <Button type="submit" disabled={state.busy}>
              {state.busy ? "Saving…" : "Change password and sign out"}
            </Button>
          </>
        )}
      </form.Subscribe>
    </form>
  );
}
