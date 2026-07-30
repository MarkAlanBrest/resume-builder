import { verifyAdminAccess } from "../../../../lib/adminAccess";
import { jsonNoStore } from "../../../../lib/apiResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const password = body?.password || "";
  const access = await verifyAdminAccess(password);
  if (!access.ok) {
    return jsonNoStore({ error: "Incorrect password" }, { status: 401 });
  }

  return jsonNoStore({ ok: true, via: access.via });
}
