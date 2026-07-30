import { verifyAdminCredentials } from "../../../../lib/adminAuth";
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

  const email = body?.email || "";
  const password = body?.password || "";
  if (!(await verifyAdminCredentials(email, password))) {
    return jsonNoStore({ error: "Incorrect email or password" }, { status: 401 });
  }

  return jsonNoStore({ ok: true, email: String(email).trim().toLowerCase() });
}
