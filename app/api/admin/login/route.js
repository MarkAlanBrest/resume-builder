import { verifyAdminPassword } from "../../../../lib/adminAuth";

export const runtime = "nodejs";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const password = body?.password || "";
  if (!verifyAdminPassword(password)) {
    return Response.json({ error: "Incorrect password" }, { status: 401 });
  }

  return Response.json({ ok: true });
}
