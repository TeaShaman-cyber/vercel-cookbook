export class InconclusiveStorage {
  async append() {
    return { ok: false, state: "INCONCLUSIVE_STORAGE", reason: "durable_backend_not_configured" };
  }

  async list() {
    return { ok: false, state: "INCONCLUSIVE_STORAGE", reason: "durable_backend_not_configured" };
  }
}

export class MemoryStorage {
  constructor(seed = []) {
    this.receipts = [...seed];
  }

  async append(receipt) {
    const exists = this.receipts.some((item) => item.receipt_id === receipt.receipt_id);
    if (!exists) this.receipts.push(receipt);
    return { ok: true, duplicate: exists, receipt };
  }

  async list(limit = 50) {
    const receipts = [...this.receipts]
      .sort((a, b) => Date.parse(b.received_at) - Date.parse(a.received_at))
      .slice(0, limit);
    return { ok: true, receipts };
  }
}

export class NeonStorage {
  constructor(query) {
    this.query = query;
  }

  async append(receipt) {
    const rows = await this.query(
      `INSERT INTO receipts (
        receipt_id, repository, workflow_name, workflow_run_id, status, conclusion,
        head_sha, source_updated_at, received_at, payload
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
      ON CONFLICT (receipt_id) DO NOTHING
      RETURNING receipt_id`,
      [
        receipt.receipt_id,
        receipt.repository,
        receipt.workflow_name,
        receipt.workflow_run_id,
        receipt.status,
        receipt.conclusion,
        receipt.head_sha,
        receipt.source_updated_at,
        receipt.received_at,
        JSON.stringify(receipt),
      ],
    );
    return { ok: true, duplicate: rows.length === 0, receipt };
  }

  async list(limit = 50) {
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));
    const rows = await this.query(
      `SELECT payload
       FROM receipts
       ORDER BY received_at DESC
       LIMIT $1`,
      [safeLimit],
    );
    return { ok: true, receipts: rows.map((row) => row.payload) };
  }
}

function lazyNeonQuery(connectionString) {
  let sqlPromise;
  return async (text, params = []) => {
    if (!sqlPromise) {
      sqlPromise = import("@neondatabase/serverless").then(({ neon }) => neon(connectionString));
    }
    const sql = await sqlPromise;
    return sql.query(text, params);
  };
}

export function productionStorage(env = process.env) {
  if (!env.DATABASE_URL) return new InconclusiveStorage();
  return new NeonStorage(lazyNeonQuery(env.DATABASE_URL));
}
