import { ResourceTable, ResourceHeader } from "@devxcrew/ui/blocks/resource-view";
import { useEffect, useState } from "react";
import { Button } from "@devxcrew/ui/components/button";
import { Input } from "@devxcrew/ui/components/input";
import { identityRequest } from "./identity.services";
import {
  displayValue,
  identityFieldLabel,
  resourceFields,
  resourceCanEdit,
  identityColumnValue,
  type IdentityRecord,
  type IdentityResource,
} from "./identity.resources";
import { IdentityResourceForm } from "./identity.form";
import type { Portal } from "./identity.types";
import { identityListSchema, identityDeletePath } from "./identity.schema";
import { formatIdentityDate, type IdentityPresentation } from "./identity.presentation";
import {
  parseIdentityResourceLocation,
  type IdentityResourceLocation,
} from "./identity.resource-location";

type Collection = {
  data: IdentityRecord[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
};

type ResourcePageProps = {
  portal: Portal;
  resource: IdentityResource;
  base: string;
  presentation: IdentityPresentation;
};

export function IdentityResourcePage(props: ResourcePageProps) {
  const location = parseIdentityResourceLocation(
    window.location.pathname,
    props.base,
    props.resource.id,
  );
  if (!location)
    return (
      <section className="grid gap-4">
        <p role="alert">This record link is invalid. Return to the list and select a record.</p>
        <a href={`${props.base}/${props.resource.id}${window.location.search}`}>
          Back to {props.resource.title.toLowerCase()}
        </a>
      </section>
    );
  if ((location.creating && !props.resource.create) || (location.editing && !props.resource.edit))
    return (
      <section className="grid gap-4">
        <h1 className="text-2xl font-semibold">{props.resource.title}</h1>
        <p role="alert">This action is not available.</p>
        <a href={`${props.base}/${props.resource.id}${window.location.search}`}>
          Back to {props.resource.title.toLowerCase()}
        </a>
      </section>
    );
  return <IdentityResourceContent {...props} location={location} />;
}

function IdentityResourceContent({
  portal,
  resource,
  base,
  presentation,
  location,
}: ResourcePageProps & { location: IdentityResourceLocation }) {
  const { creating, editing, id } = location;
  const query = new URLSearchParams(
    Object.entries(
      identityListSchema.parse(Object.fromEntries(new URLSearchParams(window.location.search))),
    ).map(([key, value]) => [key, String(value)]),
  );
  const sortable = [
    "id",
    ...resource.columns.filter((column) => ["name", "email"].includes(column)),
  ];
  if (!sortable.includes(query.get("sort") ?? "id")) query.set("sort", "id");
  const listQuery = query.toString();
  const returnTo = `${base}/${resource.id}${listQuery ? `?${listQuery}` : ""}`;
  const [collection, setCollection] = useState<Collection | null>(null);
  const [record, setRecord] = useState<IdentityRecord | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const path = `${resource.id}${id ? `/${encodeURIComponent(id)}` : ""}`;
  function columnValue(column: string, row: IdentityRecord) {
    const value = row[column];
    return ["expiresAt", "createdAt"].includes(column) && typeof value === "string"
      ? formatIdentityDate(value, presentation)
      : identityColumnValue(column, row);
  }
  useEffect(() => {
    if (creating) return;
    const controller = new AbortController();
    setError("");
    setRecord(null);
    setCollection(null);
    void identityRequest<Collection | { data: IdentityRecord }>(
      portal,
      `${path}${!id && listQuery ? `?${listQuery}` : ""}`,
      "GET",
      undefined,
      controller.signal,
    )
      .then((value) => {
        if (id) setRecord(value.data as IdentityRecord);
        else setCollection(value as Collection);
      })
      .catch((failure) => {
        if (!controller.signal.aborted)
          setError(failure instanceof Error ? failure.message : "Could not load records.");
      });
    return () => controller.abort();
  }, [portal, path, id, creating, listQuery, refresh]);
  async function remove(record: IdentityRecord) {
    if (!window.confirm(`${resource.remove}?`)) return;
    setBusy(true);
    try {
      await identityRequest(portal, identityDeletePath(resource.id, record), "DELETE");
      if (id) window.location.assign(returnTo);
      else setRefresh((value) => value + 1);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not complete the action.");
    } finally {
      setBusy(false);
    }
  }
  async function resend(recordId: string) {
    if (!window.confirm("Resend this invitation?")) return;
    setBusy(true);
    try {
      await identityRequest(
        portal,
        `${resource.id}/${encodeURIComponent(recordId)}/resend`,
        "POST",
      );
      window.location.assign(returnTo);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not resend invitation.");
    } finally {
      setBusy(false);
    }
  }
  const title = creating
    ? `New ${resource.title.toLowerCase().replace(/s$/, "")}`
    : editing
      ? `Edit ${resource.title.toLowerCase().replace(/s$/, "")}`
      : resource.title;
  return (
    <section className="grid gap-6">
      <nav aria-label="Breadcrumb" className="flex gap-2 text-sm">
        <a href={base}>Account</a>
        <span>/</span>
        <a href={returnTo}>{resource.title}</a>
        {(id || creating) && (
          <>
            <span>/</span>
            <span>{creating ? "Create" : editing ? "Edit" : "Details"}</span>
          </>
        )}
      </nav>
      <ResourceHeader
        title={title}
        action={
          !id &&
          !creating &&
          resource.create && (
            <a
              className="underline"
              href={`${base}/${resource.id}/create${listQuery ? `?${listQuery}` : ""}`}
            >
              Create
            </a>
          )
        }
      />
      {error && (
        <div role="alert">
          <p>{error}</p>
          <Button variant="outline" onClick={() => setRefresh((value) => value + 1)}>
            Retry
          </Button>
        </div>
      )}
      {(creating && resource.create) ||
      (editing && record && resourceCanEdit(resource, portal, record)) ? (
        <IdentityResourceForm
          key={path}
          portal={portal}
          path={path}
          fields={resourceFields(resource, creating, portal, record ?? {})}
          record={record ?? {}}
          creating={creating}
          returnTo={returnTo}
        />
      ) : id && record ? (
        <>
          <dl className="grid gap-3">
            {Object.entries(record).map(([key, value]) => (
              <div key={key}>
                <dt className="text-sm text-muted-foreground">{identityFieldLabel(key)}</dt>
                <dd>
                  {["expiresAt", "createdAt"].includes(key) && typeof value === "string"
                    ? formatIdentityDate(value, presentation)
                    : displayValue(value)}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex gap-3">
            {resourceCanEdit(resource, portal, record) && (
              <a
                href={`${base}/${resource.id}/${encodeURIComponent(id)}/edit${listQuery ? `?${listQuery}` : ""}`}
              >
                Edit
              </a>
            )}
            {resource.remove && (
              <Button variant="outline" disabled={busy} onClick={() => void remove(record)}>
                {resource.remove}
              </Button>
            )}
            {resource.resend && (
              <Button variant="outline" disabled={busy} onClick={() => void resend(id)}>
                Resend invitation
              </Button>
            )}
          </div>
        </>
      ) : !id && !creating ? (
        <>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1">
              Search
              <Input name="search" defaultValue={query.get("search") ?? ""} maxLength={100} />
            </label>
            <label className="grid gap-1">
              Sort
              <select
                className="rounded border p-2"
                name="sort"
                defaultValue={query.get("sort") ?? "id"}
              >
                {sortable.map((column) => (
                  <option key={column} value={column}>
                    {identityFieldLabel(column)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              Order
              <select
                className="rounded border p-2"
                name="direction"
                defaultValue={query.get("direction") ?? "asc"}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </label>
            <label className="grid gap-1">
              Per page
              <select
                className="rounded border p-2"
                name="per_page"
                defaultValue={query.get("per_page") ?? "20"}
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size}>{size}</option>
                ))}
              </select>
            </label>
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </form>
          {collection ? (
            <>
              <ResourceTable
                title={resource.title}
                records={collection.data}
                getKey={(row) => String(row.id)}
                columns={resource.columns.map((column) => ({
                  id: column,
                  label: identityFieldLabel(column),
                  render: (row: IdentityRecord) => columnValue(column, row),
                }))}
                actions={(row) => (
                  <div className="flex items-center gap-3">
                    {resource.detail !== false && (
                      <a
                        className="underline"
                        href={`${base}/${resource.id}/${encodeURIComponent(String(row.id))}${listQuery ? `?${listQuery}` : ""}`}
                      >
                        Details
                      </a>
                    )}
                    {resource.remove && (
                      <Button variant="ghost" disabled={busy} onClick={() => void remove(row)}>
                        {resource.remove}
                      </Button>
                    )}
                    {resource.resend && (
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() => void resend(String(row.id))}
                      >
                        Resend
                      </Button>
                    )}
                  </div>
                )}
              />
              <nav aria-label="Pagination" className="flex items-center gap-4">
                <span>
                  {collection.meta.total} records · Page {collection.meta.current_page} of{" "}
                  {collection.meta.last_page}
                </span>
                {collection.meta.current_page > 1 && (
                  <a href={pageHref(returnTo, collection.meta.current_page - 1)}>Previous</a>
                )}
                {collection.meta.current_page < collection.meta.last_page && (
                  <a href={pageHref(returnTo, collection.meta.current_page + 1)}>Next</a>
                )}
              </nav>
            </>
          ) : (
            !error && <p role="status">Loading records…</p>
          )}
        </>
      ) : (
        !error && (
          <p role="status">
            {creating || editing ? "This action is not available." : "Loading record…"}
          </p>
        )
      )}
    </section>
  );
}

function pageHref(href: string, page: number) {
  const url = new URL(href, window.location.origin);
  url.searchParams.set("page", String(page));
  return `${url.pathname}${url.search}`;
}
