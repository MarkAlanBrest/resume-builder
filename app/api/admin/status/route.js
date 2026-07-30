import { getStorageDiagnostics } from "../../../../lib/jsonStore";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(getStorageDiagnostics());
}
