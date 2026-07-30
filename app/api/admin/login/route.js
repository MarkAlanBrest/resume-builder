import { verifyAdminPin } from "../../../../lib/adminAuth";
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

  const pin = body?.pin || "";
  if (!(await verifyAdminPin(pin))) {
    return jsonNoStore({ error: "Incorrect PIN" }, { status: 401 });
  }

  return jsonNoStore({ ok: true });
}
