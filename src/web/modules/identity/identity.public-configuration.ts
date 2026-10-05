import { useEffect, useState } from "react";
import { identityRequest } from "./identity.services";
import type { Portal } from "./identity.types";
export type PublicIdentityConfiguration = { displayName: string; requiresOrganizationId: boolean };
export function usePublicIdentityConfiguration(portal: Portal) {
  const [data, setData] = useState<PublicIdentityConfiguration | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setData(null);
    void identityRequest<{ data: PublicIdentityConfiguration }>(
      portal,
      "configuration",
      "GET",
      undefined,
      controller.signal,
    )
      .then((response) => {
        if (!controller.signal.aborted) setData(response.data);
      })
      .catch((failure) => {
        if (!controller.signal.aborted)
          setError(failure instanceof Error ? failure.message : "Could not load sign-in settings.");
      });
    return () => controller.abort();
  }, [portal, attempt]);
  return { data, error, retry: () => setAttempt((value) => value + 1) };
}
