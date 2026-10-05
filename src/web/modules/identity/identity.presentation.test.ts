import assert from "node:assert/strict";
import { test } from "node:test";
import { formatIdentityDate } from "./identity.presentation";

test("resource timestamps honor the saved application timezone", () => {
  const instant = "2026-01-01T23:30:00Z";
  const utc = formatIdentityDate(instant, {
    displayName: "Application",
    organizationDisplayName: "Organization",
    locale: "en-US",
    timeZone: "UTC",
  });
  const india = formatIdentityDate(instant, {
    displayName: "Application",
    organizationDisplayName: "Organization",
    locale: "en-US",
    timeZone: "Asia/Kolkata",
  });
  assert.match(utc, /Jan 1, 2026/);
  assert.match(india, /Jan 2, 2026/);
  assert.match(india, /5:00 AM/);
});

test("resource timestamps honor locale and retain malformed values safely", () => {
  const presentation = {
    displayName: "Application",
    organizationDisplayName: "Organization",
    locale: "en-GB",
    timeZone: "UTC",
  };
  assert.match(formatIdentityDate("2026-01-01T23:30:00Z", presentation), /1 Jan 2026/);
  assert.equal(formatIdentityDate("unknown", presentation), "unknown");
});
