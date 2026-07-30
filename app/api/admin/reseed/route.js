import { verifyAdminAccess } from "../../../../lib/adminAccess";
import { reseedFromBundled } from "../../../../lib/programStorage";
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
    return jsonNoStore({ error: "Not authorized" }, { status: 401 });
  }

  try {
    const result = await reseedFromBundled();
    return jsonNoStore({ ok: true, ...result });
  } catch (err) {
    return jsonNoStore(
      { error: err.message || "Reseed failed" },
      { status: 500 }
    );
  }
}
