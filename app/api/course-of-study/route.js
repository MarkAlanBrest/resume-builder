import {
  readCourseOfStudyStore,
  updateProgramCourseOfStudy,
} from "../../../lib/courseOfStudyStore";
import { verifyAdminPassword } from "../../../lib/adminAuth";
import { getAllPrograms } from "../../../lib/campuses";

export const runtime = "nodejs";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const program = searchParams.get("program");
  const store = readCourseOfStudyStore();

  if (program) {
    const entry = store[program] || { text: "", updatedAt: null };
    return Response.json({ program, ...entry });
  }

  return Response.json(store);
}

export async function PUT(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { program, text, password } = body;
  if (!verifyAdminPassword(password)) {
    return Response.json({ error: "Incorrect password" }, { status: 401 });
  }

  if (!program || !getAllPrograms().includes(program)) {
    return Response.json({ error: "Invalid program" }, { status: 400 });
  }

  const entry = updateProgramCourseOfStudy(program, text);
  return Response.json({ program, ...entry });
}
