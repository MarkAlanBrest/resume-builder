import {
  readCourseOfStudyStore,
  updateProgramCourseOfStudy,
} from "../../../lib/courseOfStudyStore";
import { getAllPrograms } from "../../../lib/campuses";

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
  const adminKey = req.headers.get("x-admin-key");
  const expectedKey = process.env.COURSE_OF_STUDY_ADMIN_KEY;

  if (!expectedKey || adminKey !== expectedKey) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { program, text } = body;
  if (!program || !getAllPrograms().includes(program)) {
    return Response.json({ error: "Invalid program" }, { status: 400 });
  }

  const entry = updateProgramCourseOfStudy(program, text);
  return Response.json({ program, ...entry });
}
