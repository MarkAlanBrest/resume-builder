export function jsonNoStore(data, init = {}) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      ...(init.headers || {}),
    },
  });
}
