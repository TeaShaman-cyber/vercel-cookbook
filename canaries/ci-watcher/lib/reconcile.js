export function reconcileReceipts(
  receipts,
  {
    repository,
    workflowName,
    now = new Date(),
    freshnessMs = 24 * 60 * 60 * 1000,
  } = {},
) {
  if (!Array.isArray(receipts)) {
    return { state: "INCONCLUSIVE_STORAGE", reason: "receipts_not_array" };
  }
  if (!repository || !workflowName) {
    throw new TypeError("repository and workflowName are required");
  }

  const matching = receipts
    .filter((r) => r?.repository === repository && r?.workflow_name === workflowName)
    .filter((r) => !Number.isNaN(Date.parse(r.source_updated_at)))
    .sort((a, b) => Date.parse(b.source_updated_at) - Date.parse(a.source_updated_at));

  if (matching.length === 0) {
    return { state: "ABSENT", latest: null };
  }

  const latest = matching[0];
  const ageMs = now.getTime() - Date.parse(latest.source_updated_at);
  return {
    state: ageMs <= freshnessMs ? "FRESH" : "STALE",
    age_ms: ageMs,
    latest,
  };
}
