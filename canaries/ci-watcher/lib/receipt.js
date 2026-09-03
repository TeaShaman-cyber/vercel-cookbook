import { createHash } from "node:crypto";

const REQUIRED_RUN_FIELDS = [
  "id",
  "name",
  "status",
  "head_sha",
  "updated_at",
];

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function normalizeWorkflowRun(payload, receivedAt = new Date().toISOString()) {
  if (!payload || typeof payload !== "object") {
    throw new TypeError("payload must be an object");
  }
  if (typeof payload.repository !== "string" || !payload.repository.includes("/")) {
    throw new TypeError("repository must be owner/repo");
  }
  const run = payload.workflow_run;
  if (!run || typeof run !== "object") {
    throw new TypeError("workflow_run is required");
  }
  for (const field of REQUIRED_RUN_FIELDS) {
    if (run[field] === undefined || run[field] === null || run[field] === "") {
      throw new TypeError(`workflow_run.${field} is required`);
    }
  }
  if (!Number.isInteger(run.id) || run.id <= 0) {
    throw new TypeError("workflow_run.id must be a positive integer");
  }
  if (run.conclusion !== null && run.conclusion !== undefined && typeof run.conclusion !== "string") {
    throw new TypeError("workflow_run.conclusion must be string or null");
  }

  const identity = {
    schema_version: 1,
    source: "synthetic_github_workflow_run",
    repository: payload.repository,
    workflow_run_id: run.id,
    workflow_name: run.name,
    status: run.status,
    conclusion: run.conclusion ?? null,
    head_sha: run.head_sha,
    source_updated_at: run.updated_at,
  };
  const receiptId = `sha256:${createHash("sha256").update(canonical(identity)).digest("hex")}`;

  return {
    ...identity,
    received_at: receivedAt,
    receipt_id: receiptId,
  };
}

export { canonical };
