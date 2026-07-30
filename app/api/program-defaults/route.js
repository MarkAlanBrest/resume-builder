import { verifyAdminPin } from "../../../lib/adminAuth";
import { getAllPrograms } from "../../../lib/campuses";
import {
  getProgramDefaults,
  readProgramDefaultsStore,
  updateProgramDefaults,
} from "../../../lib/programDefaultsStore";
import { jsonNoStore } from "../../../lib/apiResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const program = searchParams.get("program");

  if (program) {
    const entry = await getProgramDefaults(program);
    return jsonNoStore({ program, ...entry });
  }

  return jsonNoStore(await readProgramDefaultsStore());
}

export async function PUT(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { program, skills, certifications, pin } = body;
  if (!(await verifyAdminPin(pin))) {
    return jsonNoStore({ error: "Not authorized" }, { status: 401 });
  }

  if (!program || !getAllPrograms().includes(program)) {
    return jsonNoStore({ error: "Invalid program" }, { status: 400 });
  }

  try {
    const entry = await updateProgramDefaults(program, { skills, certifications });
    return jsonNoStore({ program, ...entry });
  } catch (err) {
    return jsonNoStore(
      { error: err.message || "Save failed" },
      { status: 500 }
    );
  }
}
