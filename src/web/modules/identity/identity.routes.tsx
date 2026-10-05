import { lazy, Suspense } from "react";
import type { Portal } from "./identity.types";
import type { IdentityWorkspacePage } from "./identity.workspace";
const IdentityLogin = lazy(() =>
  import("./identity.login").then((module) => ({ default: module.IdentityLogin })),
);
const IdentityDesk = lazy(() =>
  import("./identity.desk").then((module) => ({ default: module.IdentityDesk })),
);
const IdentityRecovery = lazy(() =>
  import("./identity.recovery").then((module) => ({ default: module.IdentityRecovery })),
);
function RecoveryRoute({ portal }: { portal: Portal }) {
  return (
    <Suspense fallback={<p role="status">Loading…</p>}>
      <IdentityRecovery portal={portal} />
    </Suspense>
  );
}

function LoginRoute({ portal }: { portal: Portal }) {
  return (
    <Suspense fallback={<p role="status">Loading login…</p>}>
      <IdentityLogin portal={portal} />
    </Suspense>
  );
}
function DeskRoute({ portal }: { portal: Portal }) {
  return (
    <Suspense fallback={<p role="status">Loading desk…</p>}>
      <IdentityDesk portal={portal} />
    </Suspense>
  );
}
export const UserLogin = () => <LoginRoute portal="user" />;
export const UserDesk = () => <DeskRoute portal="user" />;
export const AdminLogin = () => <LoginRoute portal="admin" />;
export const AdminDesk = () => <DeskRoute portal="admin" />;
export const SuperLogin = () => <LoginRoute portal="super-admin" />;
export const SuperDesk = () => <DeskRoute portal="super-admin" />;
export const UserRecovery = () => <RecoveryRoute portal="user" />;
export const AdminRecovery = () => <RecoveryRoute portal="admin" />;
export const SuperRecovery = () => <RecoveryRoute portal="super-admin" />;

export function createIdentityWorkspace(portal: Portal, page: IdentityWorkspacePage) {
  return function ModuleWorkspace() {
    return (
      <Suspense fallback={<p role="status">Loading desk…</p>}>
        <IdentityDesk portal={portal} page={page} />
      </Suspense>
    );
  };
}
