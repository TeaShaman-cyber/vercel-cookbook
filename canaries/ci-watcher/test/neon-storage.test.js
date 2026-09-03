import test from "node:test";
import assert from "node:assert/strict";

import { InconclusiveStorage, NeonStorage, productionStorage } from "../lib/storage.js";
import { environmentStatus } from "../api/env-status.js";

const receipt = {
  receipt_id: "sha256:test",
  schema_version: 1,
  source: "synthetic_github_workflow_run",
  repository: "TeaShaman-cyber/theseus-needle-lab",
  workflow_run_id: 33722433205,
  workflow_name: "Needle Stage B full",
  status: "completed",
  conclusion: "success",
  head_sha: "7a5f75c4e1ad249803e5bc4e4b805223e436356f",
  source_updated_at: "2026-09-03T07:00:00Z",
  received_at: "2026-09-03T07:01:00Z",
};

test("NeonStorage append reports inserted row as non-duplicate", async () => {
  const calls = [];
  const storage = new NeonStorage(async (text, params) => {
    calls.push({ text, params });
    return [{ receipt_id: receipt.receipt_id }];
  });
  const result = await storage.append(receipt);
  assert.equal(result.ok, true);
  assert.equal(result.duplicate, false);
  assert.match(calls[0].text, /ON CONFLICT \(receipt_id\) DO NOTHING/);
  assert.equal(calls[0].params[0], receipt.receipt_id);
});

test("NeonStorage append reports empty RETURNING as duplicate", async () => {
  const storage = new NeonStorage(async () => []);
  const result = await storage.append(receipt);
  assert.equal(result.duplicate, true);
});

test("NeonStorage list returns stored JSON payloads", async () => {
  const storage = new NeonStorage(async () => [{ payload: receipt }]);
  const result = await storage.list(10);
  assert.deepEqual(result, { ok: true, receipts: [receipt] });
});

test("productionStorage remains explicitly inconclusive without DATABASE_URL", () => {
  assert.ok(productionStorage({}) instanceof InconclusiveStorage);
});

test("env presence probe returns booleans and never secret values", () => {
  const status = environmentStatus({
    DATABASE_URL: "postgresql://secret",
    DATABASE_URL_UNPOOLED: "postgresql://other-secret",
    POSTGRES_URL: "postgresql://legacy-secret",
    VERCEL_ENV: "preview",
  });
  assert.deepEqual(status, {
    ok: true,
    has_DATABASE_URL: true,
    has_DATABASE_URL_UNPOOLED: true,
    has_POSTGRES_URL: true,
    vercel_env: "preview",
  });
  assert.equal(JSON.stringify(status).includes("secret"), false);
});
