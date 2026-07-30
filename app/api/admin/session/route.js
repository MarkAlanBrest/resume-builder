import { getAdminSession } from "../../../../lib/adminAccess";
import { isMicrosoftAuthConfigured } from "../../../../lib/authOptions";
import { jsonNoStore } from "../../../../lib/apiResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  return jsonNoStore({
    authenticated: !!session,
    email: session?.user?.email || null,
    microsoftEnabled: isMicrosoftAuthConfigured(),
  });
}
