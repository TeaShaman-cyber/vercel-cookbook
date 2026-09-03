import test from "node:test";
import assert from "node:assert/strict";

import { normalizeWorkflowRun } from "../lib/receipt.js";
import { reconcileReceipts } from "../lib/reconcile.js";
import { InconclusiveStorage, MemoryStorage } from "../lib/storage.js";
import { DEFAULT_TARGET, ingestSyntheticEvent, listReceipts, reconcileHttp } from "../lib/http.js";

const basePayload = {
  repository: "TeaShaman-cyber/theseus-needle-lab",
  workflow_run: {
    id: 33722433205,
    name: "Needle Stage B full",
    status: "in_progress",
    conclusion: null,
    head_sha: "7a5f75c4e1ad249803e5bc4e4b805223e436356f",
    run_started_at: "2026-09-03T06:15:57Z",
    updated_at: "2026-09-03T07:00:00Z",
  },
};

test("valid workflow_run normalizes to required receipt fields", () => {
  const receipt = normalizeWorkflowRun(basePayload, "2026-09-03T07:01:00Z");
  assert.equal(receipt.workflow_run_id, 33722433205);
  assert.equal(receipt.source, "synthetic_github_workflow_run");
  assert.match(receipt.receipt_id, /^sha256:[0-9a-f]{64}$/);
});

test("receipt identity is deterministic across received_at changes", () => {
  const a = normalizeWorkflowRun(basePayload, "2026-09-03T07:01:00Z");
  const b = normalizeWorkflowRun(basePayload, "2026-09-03T08:01:00Z");
  assert.equal(a.receipt_id, b.receipt_id);
  assert.notEqual(a.received_at, b.received_at);
});

test("missing authority field is rejected", () => {
  const broken = structuredClone(basePayload);
  delete broken.workflow_run.head_sha;
  assert.throws(() => normalizeWorkflowRun(broken), /head_sha is required/);
});

test("reconcile reports ABSENT when matching receipt does not exist", () => {
  const result = reconcileReceipts([], {
    repository: basePayload.repository,
    workflowName: basePayload.workflow_run.name,
    now: new Date("2026-09-03T08:00:00Z"),
  });
  assert.equal(result.state, "ABSENT");
});

test("reconcile reports FRESH inside freshness window", () => {
  const receipt = normalizeWorkflowRun(basePayload, "2026-09-03T07:01:00Z");
  const result = reconcileReceipts([receipt], {
    repository: basePayload.repository,
    workflowName: basePayload.workflow_run.name,
    now: new Date("2026-09-03T08:00:00Z"),
    freshnessMs: 2 * 60 * 60 * 1000,
  });
  assert.equal(result.state, "FRESH");
});

test("reconcile reports STALE outside freshness window", () => {
  const receipt = normalizeWorkflowRun(basePayload, "2026-09-03T07:01:00Z");
  const result = reconcileReceipts([receipt], {
    repository: basePayload.repository,
    workflowName: basePayload.workflow_run.name,
    now: new Date("2026-09-04T08:00:01Z"),
    freshnessMs: 24 * 60 * 60 * 1000,
  });
  assert.equal(result.state, "STALE");
});

test("production placeholder storage is explicitly inconclusive", async () => {
  const storage = new InconclusiveStorage();
  assert.equal((await storage.append({})).state, "INCONCLUSIVE_STORAGE");
  assert.equal((await storage.list()).state, "INCONCLUSIVE_STORAGE");
});

test("ingest rejects malformed event with 400", async () => {
  const result = await ingestSyntheticEvent({}, new MemoryStorage());
  assert.equal(result.status, 400);
});

test("ingest deduplicates deterministic identity in test durable store", async () => {
  const storage = new MemoryStorage();
  const first = await ingestSyntheticEvent(basePayload, storage, "2026-09-03T07:01:00Z");
  const second = await ingestSyntheticEvent(basePayload, storage, "2026-09-03T08:01:00Z");
  assert.equal(first.status, 202);
  assert.equal(second.status, 202);
  assert.equal(second.body.duplicate, true);
  const listed = await listReceipts(storage);
  assert.equal(listed.body.receipts.length, 1);
});

test("HTTP layer preserves INCONCLUSIVE_STORAGE instead of pretending absence", async () => {
  const result = await reconcileHttp(new InconclusiveStorage());
  assert.equal(result.status, 503);
  assert.equal(result.body.state, "INCONCLUSIVE_STORAGE");
});

test("cron reconciliation has a fixed synthetic default target", async () => {
  const storage = new MemoryStorage();
  const result = await reconcileHttp(storage, { now: new Date("2026-09-03T08:00:00Z") });
  assert.equal(DEFAULT_TARGET.repository, "TeaShaman-cyber/theseus-needle-lab");
  assert.equal(DEFAULT_TARGET.workflowName, "Needle Stage B full");
  assert.equal(result.status, 200);
  assert.equal(result.body.state, "ABSENT");
});
