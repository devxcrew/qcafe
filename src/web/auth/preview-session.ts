const key = "qcafe.preview-desk";
export function enterPreviewDesk() {
  sessionStorage.setItem(key, "open");
}
export function hasPreviewDesk() {
  return sessionStorage.getItem(key) === "open";
}
export function leavePreviewDesk() {
  sessionStorage.removeItem(key);
}
