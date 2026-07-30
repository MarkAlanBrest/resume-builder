import { updateAdminPassword } from "../../../../lib/adminAuth";
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
  const currentPassword = body?.currentPassword || "";
  const newPassword = body?.newPassword || "";

  try {
    await updateAdminPassword(email, currentPassword, newPassword);
    return jsonNoStore({ ok: true });
  } catch (err) {
    return jsonNoStore(
      { error: err.message || "Could not update password" },
      { status: 400 }
    );
  }
}
