import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Home, PanelsTopLeft, LogOut } from "lucide-react";
import { MainWorkspace } from "@devxcrew/react-ui/layouts/main-workspace";
import { Button } from "@devxcrew/react-ui/components/button";
import { application } from "../config";
import { hasPreviewDesk, leavePreviewDesk } from "../auth/preview-session";

export function Desk() {
  const navigate = useNavigate();
  const canOpen = hasPreviewDesk();
  useEffect(() => {
    if (!canOpen) void navigate({ to: "/login", replace: true });
  }, [canOpen, navigate]);
  function signOut() {
    leavePreviewDesk();
    void navigate({ to: "/login" });
  }
  if (!canOpen) return null;
  return (
    <MainWorkspace
      applicationId="qcafe"
      applicationName={application.name}
      workspaceTitle="Desk"
      showTopologyTools={false}
      apps={[{ label: application.name, icon: PanelsTopLeft, active: true }]}
      navigation={[{ label: "Workspace", items: [{ label: "Desk", icon: Home, active: true }] }]}
      user={{ initials: "P", name: "Preview user", onSignOut: signOut }}
      notificationCount={0}
      requiredFeatures={{
        appSwitcher: false,
        notifications: false,
        ito: false,
        profileMenu: true,
        topMenu: true,
        statusBar: true,
      }}
      statusLabel="Frontend preview"
      sidebarFooter={
        <Button className="w-full" variant="ghost" onClick={signOut}>
          <LogOut />
          Sign out
        </Button>
      }
    >
      <div className="desk-content">
        <span className="public-eyebrow">{application.name} / DESK</span>
        <h1>Your workspace is ready.</h1>
        <p>
          The shared main workspace hosts this desk. Your business apps will connect here as they
          are built.
        </p>
        <section className="desk-section">
          <PanelsTopLeft size={28} />
          <div>
            <h2>Start with a clear foundation</h2>
            <p>Shared UI, reusable framework, and one platform entry point.</p>
          </div>
        </section>
        <p className="desk-preview">
          This is a frontend preview. No backend authentication or business data connections are
          enabled.
        </p>
      </div>
    </MainWorkspace>
  );
}
