import { getStorageMode } from "../../../lib/jsonStore";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ storage: getStorageMode() });
}
