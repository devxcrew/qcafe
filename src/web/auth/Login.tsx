import { Link, useNavigate } from "@tanstack/react-router";
import { LoginPage } from "@devxcrew/ui/blocks/auth";
import { application } from "../config";
import { enterPreviewDesk } from "./preview-session";

export function Login() {
  const navigate = useNavigate();
  function openDesk() {
    enterPreviewDesk();
    void navigate({ to: "/desk" });
  }
  return (
    <>
      <Link to="/" className="public-back">
        ← Back to home
      </Link>
      <LoginPage
        brandName={application.name}
        title="Open your workspace"
        description="Frontend preview. Credentials are not sent, saved, or verified."
        forgotHref={null}
        registerHref={null}
        onSubmit={openDesk}
        devLoginEnabled
        onDevLogin={openDesk}
      />
    </>
  );
}
