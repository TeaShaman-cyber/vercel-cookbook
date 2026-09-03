import { ingestSyntheticEvent } from "../lib/http.js";
import { productionStorage } from "../lib/storage.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ ok: false, error: "method_not_allowed" });
  }
  const result = await ingestSyntheticEvent(request.body, productionStorage());
  return response.status(result.status).json(result.body);
}
