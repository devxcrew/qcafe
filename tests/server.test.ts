import assert from "node:assert/strict";
import { test } from "node:test";
import { readApplicationConfig } from "@devxcrew/core-framework";
const env = {
  APP_NAME: "QCafe",
  APP_PORT: "5176",
  APP_URL: "http://127.0.0.1:5176",
  APP_MODE: "development",
};
test("application config requires a valid port, mode, and matching origin", () => {
  assert.equal(readApplicationConfig(env).port, 5176);
  for (const APP_PORT of ["0", "65536", "abc", "4100.5", ""])
    assert.throws(() => readApplicationConfig({ ...env, APP_PORT }));
  assert.throws(() => readApplicationConfig({ ...env, APP_MODE: "staging" }));
  assert.throws(() => readApplicationConfig({ ...env, APP_URL: "http://127.0.0.1:9999" }));
  assert.throws(() => readApplicationConfig({ ...env, APP_URL: "http://127.0.0.1:5176/desk" }));
});
