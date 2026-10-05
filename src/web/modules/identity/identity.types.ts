export type Portal = "user" | "admin" | "super-admin";
export interface Principal {
  user: { id: string; name: string; email: string };
  appId: string;
  portal: Portal;
  tenant: { id: string; name: string };
  permissions: string[];
}
