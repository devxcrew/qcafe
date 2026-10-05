import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { identityProvider } from "./identity.provider";
import { frontend } from "../../composition/application.providers";
import { IdentityApiError } from "./identity.services";
import { IdentityAccount } from "./identity.account";
import { IdentityPassword } from "./identity.password";
import { IdentityResourcePage } from "./identity.list";
import { identityResources } from "./identity.resources";
import type { Portal, Principal } from "./identity.types";
import { useIdentityPresentation } from "./identity.presentation";

import { IdentityWorkspaceView, type IdentityWorkspacePage } from "./identity.workspace";

export function IdentityDesk({ portal, page }: { portal: Portal; page?: IdentityWorkspacePage }) {
  const navigate = useNavigate();
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [error, setError] = useState("");
  const presentation = useIdentityPresentation(portal, Boolean(principal));
  const login = identityProvider.portals[portal].login;
  const base = identityProvider.portals[portal].desk;
  const resources = identityResources(portal);
  const canEditProfile = principal?.permissions.includes("identity.self") === true;
  const resource =
    resources.find(
      (item) =>
        window.location.pathname === `${base}/${item.id}` ||
        window.location.pathname.startsWith(`${base}/${item.id}/`),
    ) ??
    (window.location.pathname === base && !canEditProfile
      ? resources.find((item) => item.id === "sessions")
      : undefined);
  const settings = window.location.pathname === `${base}/settings`;
  const password =
    principal?.permissions.includes("identity.password") === true &&
    window.location.pathname === `${base}/password`;
  const applicationSettings =
    portal === "super-admin" && window.location.pathname === `${base}/application-settings`;
  const securitySettings =
    portal === "super-admin" && window.location.pathname === `${base}/security-settings`;
  const missing =
    !resource &&
    !settings &&
    !applicationSettings &&
    !securitySettings &&
    !password &&
    window.location.pathname !== base;
  const heading =
    page?.title ??
    resource?.title ??
    (password
      ? "Password"
      : applicationSettings
        ? "Application settings"
        : securitySettings
          ? "Security settings"
          : settings
            ? "Organization settings"
            : "Account");
  useEffect(() => {
    if (!presentation.data) return;
    document.title = `${heading} · ${presentation.data.displayName}`;
    document.documentElement.lang = presentation.data.locale;
  }, [heading, presentation.data]);
  useEffect(() => {
    let active = true;
    function refresh() {
      void identityProvider.api
        .current(portal)
        .then((result) => {
          if (active) {
            setPrincipal(result);
            setError("");
          }
        })
        .catch((failure) => {
          if (!active) return;
          setPrincipal(null);
          if (failure instanceof IdentityApiError && [401, 403].includes(failure.status))
            void navigate({ to: login, replace: true });
          else setError("Unable to verify your session. Refresh to retry.");
        });
    }
    refresh();
    const expired = (event: Event) => {
      if ((event as CustomEvent<Portal>).detail !== portal) return;
      setPrincipal(null);
      void navigate({ to: login, replace: true });
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("identity:session-expired", expired);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("identity:session-expired", expired);
    };
  }, [portal, login, navigate]);
  async function signOut() {
    try {
      await identityProvider.api.logout(portal);
      setPrincipal(null);
      await navigate({ to: login, replace: true });
    } catch {
      setError("Sign out failed. Check the connection and retry.");
    }
  }
  return (
    <IdentityWorkspaceView
      page={page}
      principal={principal}
      presentation={presentation.data}
      portal={portal}
      title={heading}
      navigation={
        principal
          ? frontend.navigation({
              workspace: portal,
              base,
              pathname: window.location.pathname,
              permissions: principal.permissions,
            })
          : []
      }
      error={error}
      presentationError={presentation.error}
      onSignOut={() => {
        void signOut();
      }}
    >
      {!principal || !presentation.data ? null : missing ? (
        <section>
          <h1>Page not found</h1>
          <a href={base}>Return to account</a>
        </section>
      ) : password ? (
        <IdentityPassword
          portal={portal}
          onChanged={() => {
            setPrincipal(null);
            void navigate({ to: login, replace: true });
          }}
        />
      ) : resource ? (
        <IdentityResourcePage
          portal={portal}
          resource={resource}
          base={base}
          presentation={presentation.data}
        />
      ) : (
        <IdentityAccount
          portal={portal}
          canChangePassword={false}
          page={
            applicationSettings
              ? "application-settings"
              : securitySettings
                ? "security-settings"
                : settings
                  ? "settings"
                  : "profile"
          }
          base={base}
          onPasswordChanged={() => {
            setPrincipal(null);
            void navigate({ to: login, replace: true });
          }}
        />
      )}
    </IdentityWorkspaceView>
  );
}
