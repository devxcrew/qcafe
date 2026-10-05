import type { Portal, Principal } from "./identity.types";

export class IdentityApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

export async function identityRequest<T>(
  portal: Portal,
  path: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1/identity/${portal}/${path}`, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      signal,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (failure) {
    if (signal?.aborted) throw failure;
    throw new IdentityApiError(0, "Connection failed. Check your network and retry.");
  }
  if (response.status === 401 && !(path === "sessions" && method === "POST"))
    window.dispatchEvent(new CustomEvent("identity:session-expired", { detail: portal }));
  if (response.status === 204) return null as T;
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new IdentityApiError(
      response.status,
      response.ok
        ? "The server returned an invalid response."
        : "The server could not complete the request. Try again.",
    );
  }
  if (!response.ok) {
    const envelope = objectValue(payload);
    const nested = objectValue(envelope.error);
    const message =
      typeof envelope.message === "string"
        ? envelope.message
        : typeof nested.message === "string"
          ? nested.message
          : "The request failed. Try again.";
    const errors = Object.fromEntries(
      Object.entries(objectValue(envelope.errors)).filter(
        (entry): entry is [string, string[]] =>
          Array.isArray(entry[1]) && entry[1].every((value) => typeof value === "string"),
      ),
    );
    throw new IdentityApiError(response.status, message, errors);
  }
  return payload as T;
}
function objectValue(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
async function request(portal: Portal, path: string, method = "GET", body?: unknown) {
  const result = await identityRequest<{ data: Principal } | null>(portal, path, method, body);
  return result?.data ?? null;
}
export const identityApi = {
  login: (portal: Portal, value: { email: string; password: string; tenantId: string }) =>
    request(portal, "sessions", "POST", { ...value, tenantId: value.tenantId || undefined }),
  current: (portal: Portal) => request(portal, "sessions/current") as Promise<Principal>,
  logout: (portal: Portal) => request(portal, "sessions/current", "DELETE"),
  password: (portal: Portal, value: { currentPassword: string; password: string }) =>
    request(portal, "password", "PATCH", value),
};
