import { updateAdminPin } from "../../../../lib/adminAuth";
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

  const currentPin = body?.currentPin || "";
  const newPin = body?.newPin || "";

  try {
    await updateAdminPin(currentPin, newPin);
    return jsonNoStore({ ok: true });
  } catch (err) {
    return jsonNoStore(
      { error: err.message || "Could not update PIN" },
      { status: 400 }
    );
  }
}
