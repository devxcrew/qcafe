import { useEffect, useState } from "react";
import { identityRequest } from "./identity.services";
import type { Portal } from "./identity.types";

export type IdentityPresentation = {
  displayName: string;
  organizationDisplayName: string;
  locale: string;
  timeZone: string;
};

export function useIdentityPresentation(portal: Portal, authenticated: boolean) {
  const [data, setData] = useState<IdentityPresentation | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!authenticated) {
      setData(null);
      return;
    }
    let controller: AbortController;
    function refresh() {
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      void identityRequest<{ data: IdentityPresentation }>(
        portal,
        "presentation",
        "GET",
        undefined,
        signal,
      )
        .then((response) => {
          if (!signal.aborted) {
            setData(response.data);
            setError("");
          }
        })
        .catch((failure) => {
          if (!signal.aborted)
            setError(
              failure instanceof Error ? failure.message : "Could not load workspace settings.",
            );
        });
    }
    refresh();
    window.addEventListener("identity:presentation-changed", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("identity:presentation-changed", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [portal, authenticated]);
  return { data, error };
}

export function formatIdentityDate(value: string, presentation: IdentityPresentation): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(presentation.locale, {
    timeZone: presentation.timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
