export function environmentStatus(env = process.env) {
  return {
    ok: true,
    has_DATABASE_URL: Boolean(env.DATABASE_URL),
    has_DATABASE_URL_UNPOOLED: Boolean(env.DATABASE_URL_UNPOOLED),
    has_POSTGRES_URL: Boolean(env.POSTGRES_URL),
    vercel_env: env.VERCEL_ENV ?? null,
  };
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ ok: false, error: "method_not_allowed" });
  }
  return response.status(200).json(environmentStatus());
}
