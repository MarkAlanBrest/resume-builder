import { updateAdminPassword } from "../../../../lib/adminAuth";
import { verifyAdminAccessForPasswordChange } from "../../../../lib/adminAccess";
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

  const currentPassword = body?.currentPassword || "";
  const newPassword = String(body?.newPassword || "").trim();

  if (!newPassword) {
    return jsonNoStore({ error: "New password cannot be empty" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return jsonNoStore(
      { error: "New password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const access = await verifyAdminAccessForPasswordChange({ currentPassword });

  if (!access.ok) {
    return jsonNoStore({ error: access.error || "Not authorized" }, { status: 401 });
  }

  try {
    await updateAdminPassword(newPassword);
    return jsonNoStore({ ok: true });
  } catch (err) {
    return jsonNoStore(
      { error: err.message || "Could not update password" },
      { status: 500 }
    );
  }
}
