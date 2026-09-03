import { listReceipts } from "../lib/http.js";
import { productionStorage } from "../lib/storage.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false, error: "method_not_allowed" });
  }
  const result = await listReceipts(productionStorage(), 50);
  return response.status(result.status).json(result.body);
}
