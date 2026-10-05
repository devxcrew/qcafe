import type { FunctionComponent, ReactNode } from "react";
import { PanelsTopLeft, LogOut } from "lucide-react";
import {
  MainWorkspace,
  type MdiNavigationSection,
} from "@devxcrew/ui/layouts/main-workspace";
import { Button } from "@devxcrew/ui/components/button";
import type { Portal, Principal } from "./identity.types";
import type { IdentityPresentation } from "./identity.presentation";

export interface IdentityWorkspacePage {
  title: string;
  component: FunctionComponent<{ principal: Principal }>;
  permission?: string;
}

export function IdentityWorkspaceView({
  principal,
  presentation,
  portal,
  title,
  navigation,
  onSignOut,
  error,
  presentationError,
  children,
  page,
}: {
  principal: Principal | null;
  presentation: IdentityPresentation | null;
  portal: Portal;
  title: string;
  navigation: MdiNavigationSection[];
  onSignOut(): void;
  error?: string;
  presentationError?: string;
  children?: ReactNode;
  page?: IdentityWorkspacePage;
}) {
  if (!principal) return <p role="status">{error || "Verifying your session…"}</p>;
  if (!presentation)
    return (
      <div role={presentationError ? "alert" : "status"}>
        <p>{presentationError || "Loading your workspace…"}</p>
        {presentationError && <Button onClick={() => window.location.reload()}>Retry</Button>}
      </div>
    );
  const Page = page?.component;
  const allowed = !page?.permission || principal.permissions.includes(page.permission);
  return (
    <MainWorkspace
      applicationId="qcafe"
      applicationName={presentation.displayName}
      workspaceTitle={title}
      showTopologyTools={false}
      apps={[{ label: presentation.displayName, icon: PanelsTopLeft, active: true }]}
      navigation={navigation}
      user={{
        initials: principal.user.name.slice(0, 1).toUpperCase(),
        name: principal.user.name,
        onSignOut,
      }}
      notificationCount={0}
      requiredFeatures={{
        appSwitcher: false,
        notifications: false,
        ito: false,
        profileMenu: true,
        topMenu: true,
        statusBar: true,
      }}
      statusLabel={`${presentation.organizationDisplayName} · ${portal}`}
      sidebarFooter={
        <Button className="w-full" variant="ghost" onClick={onSignOut}>
          <LogOut />
          Sign out
        </Button>
      }
    >
      <div className="desk-content">
        {error && <p role="alert">{error}</p>}
        {presentationError && <p role="alert">{presentationError}</p>}
        {Page ? (
          allowed ? (
            <Page principal={principal} />
          ) : (
            <p role="alert">You do not have access to this page.</p>
          )
        ) : (
          children
        )}
      </div>
    </MainWorkspace>
  );
}
