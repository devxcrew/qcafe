export type IdentityResourceLocation = {
  creating: boolean;
  editing: boolean;
  id?: string;
};

export function parseIdentityResourceLocation(
  pathname: string,
  base: string,
  resource: string,
): IdentityResourceLocation | null {
  const prefix = `${base}/${resource}`;
  // The desk selects sessions as its default when account access is unavailable.
  if (pathname === base) return { creating: false, editing: false };
  if (pathname === prefix || pathname === `${prefix}/`) return { creating: false, editing: false };
  if (!pathname.startsWith(`${prefix}/`)) return null;
  const segments = pathname
    .slice(prefix.length + 1)
    .replace(/\/$/, "")
    .split("/");
  if (segments.length === 1 && segments[0] === "create") return { creating: true, editing: false };
  if (segments[0] === "create") return null;
  if (segments.length > 2 || (segments.length === 2 && segments[1] !== "edit")) return null;
  try {
    const id = decodeURIComponent(segments[0]);
    if (
      !id ||
      id.length > 100 ||
      id === "." ||
      id === ".." ||
      id.includes("/") ||
      id.includes("\\") ||
      [...id].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
    )
      return null;
    return { creating: false, editing: segments.length === 2, id };
  } catch {
    return null;
  }
}
