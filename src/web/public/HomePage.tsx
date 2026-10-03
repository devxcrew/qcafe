import { Link } from "@tanstack/react-router";
import { ArrowRight, PanelsTopLeft } from "lucide-react";
import { Button } from "@devxcrew/react-ui/components/button";
import { application } from "../config";

export function HomePage() {
  return (
    <div className="public-page">
      <header className="public-header">
        <Link to="/" className="public-brand">
          <PanelsTopLeft size={24} />
          {application.name}
        </Link>
        <Link to="/login" className="public-login">
          Sign in <ArrowRight size={16} />
        </Link>
      </header>
      <main className="public-content">
        <span className="public-eyebrow">YOUR BUSINESS WORKSPACE</span>
        <h1>
          A common home.
          <br />
          For everything you build.
        </h1>
        <p>Bring your applications together in one clear, connected workspace.</p>
        <Button nativeButton={false} render={<Link to="/login" />} size="lg">
          Open your workspace <ArrowRight size={18} />
        </Button>
        <div className="public-note">
          <span />
          Ready for your next application.
        </div>
      </main>
      <footer className="public-footer">
        <span>{application.name}</span>
        <span>Development workspace</span>
      </footer>
    </div>
  );
}
