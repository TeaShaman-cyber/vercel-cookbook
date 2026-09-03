import { normalizeWorkflowRun } from "./receipt.js";
import { reconcileReceipts } from "./reconcile.js";

export const DEFAULT_TARGET = {
  repository: "TeaShaman-cyber/theseus-needle-lab",
  workflowName: "Needle Stage B full",
  freshnessMs: 24 * 60 * 60 * 1000,
};

export async function ingestSyntheticEvent(payload, storage, receivedAt) {
  let receipt;
  try {
    receipt = normalizeWorkflowRun(payload, receivedAt);
  } catch (error) {
    return { status: 400, body: { ok: false, error: error.message } };
  }

  const result = await storage.append(receipt);
  if (!result.ok) {
    return { status: 503, body: { ok: false, state: "INCONCLUSIVE_STORAGE", reason: result.reason } };
  }
  return {
    status: 202,
    body: { ok: true, duplicate: Boolean(result.duplicate), receipt },
  };
}

export async function listReceipts(storage, limit = 50) {
  const result = await storage.list(limit);
  if (!result.ok) {
    return { status: 503, body: { ok: false, state: "INCONCLUSIVE_STORAGE", reason: result.reason } };
  }
  return { status: 200, body: { ok: true, receipts: result.receipts } };
}

export async function reconcileHttp(storage, options = {}) {
  const result = await storage.list(100);
  if (!result.ok) {
    return { status: 503, body: { ok: false, state: "INCONCLUSIVE_STORAGE", reason: result.reason } };
  }
  const target = {
    repository: options.repository ?? DEFAULT_TARGET.repository,
    workflowName: options.workflowName ?? DEFAULT_TARGET.workflowName,
    freshnessMs: options.freshnessMs ?? DEFAULT_TARGET.freshnessMs,
    now: options.now ?? new Date(),
  };
  return { status: 200, body: { ok: true, ...reconcileReceipts(result.receipts, target) } };
}
