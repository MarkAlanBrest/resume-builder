import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";
import { getAdminPassword, verifyAdminPassword } from "./adminAuth";
import { isEmailAllowed } from "./adminAuth";

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  if (!isEmailAllowed(session.user.email)) return null;
  return session;
}

export async function verifyAdminAccess(password) {
  const session = await getAdminSession();
  if (session) {
    return { ok: true, via: "microsoft", email: session.user.email };
  }

  if (password && (await verifyAdminPassword(password))) {
    return { ok: true, via: "password" };
  }

  return { ok: false };
}

export async function verifyAdminAccessForPasswordChange({ currentPassword }) {
  const session = await getAdminSession();
  if (session) {
    return { ok: true, via: "microsoft", email: session.user.email };
  }

  if (currentPassword && (await verifyAdminPassword(currentPassword))) {
    return { ok: true, via: "password" };
  }

  return {
    ok: false,
    error: "Enter your current password or sign in with Microsoft",
  };
}

export { getAdminPassword };
