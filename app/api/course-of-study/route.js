import {
  getCourseOfStudy,
  readCourseOfStudyStore,
  updateProgramCourseOfStudy,
} from "../../../lib/courseOfStudyStore";
import { verifyAdminPassword } from "../../../lib/adminAuth";
import { getAllPrograms } from "../../../lib/campuses";
import { jsonNoStore } from "../../../lib/apiResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const program = searchParams.get("program");

  if (program) {
    const entry = await getCourseOfStudy(program);
    return jsonNoStore({ program, ...entry });
  }

  return jsonNoStore(await readCourseOfStudyStore());
}

export async function PUT(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonNoStore({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { program, text, password } = body;
  if (!(await verifyAdminPassword(password))) {
    return jsonNoStore({ error: "Incorrect password" }, { status: 401 });
  }

  if (!program || !getAllPrograms().includes(program)) {
    return jsonNoStore({ error: "Invalid program" }, { status: 400 });
  }

  try {
    const entry = await updateProgramCourseOfStudy(program, text);
    return jsonNoStore({ program, ...entry });
  } catch (err) {
    return jsonNoStore(
      { error: err.message || "Save failed" },
      { status: 500 }
    );
  }
}
