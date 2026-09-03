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

export function productionStorage() {
  return new InconclusiveStorage();
}
