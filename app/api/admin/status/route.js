import { getStorageDiagnostics } from "../../../../lib/jsonStore";
import { jsonNoStore } from "../../../../lib/apiResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return jsonNoStore(await getStorageDiagnostics());
}
