import { getProgramStorageDiagnostics } from "../../../../lib/programStorage";
import { jsonNoStore } from "../../../../lib/apiResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return jsonNoStore(await getProgramStorageDiagnostics());
}
