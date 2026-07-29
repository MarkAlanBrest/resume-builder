import { verifyAdminPassword } from "../../../lib/adminAuth";
import { getAllPrograms } from "../../../lib/campuses";
import {
  getProgramDefaults,
  readProgramDefaultsStore,
  updateProgramDefaults,
} from "../../../lib/programDefaultsStore";

export const runtime = "nodejs";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const program = searchParams.get("program");

  if (program) {
    const entry = getProgramDefaults(program);
    return Response.json({ program, ...entry });
  }

  return Response.json(readProgramDefaultsStore());
}

export async function PUT(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { program, skills, certifications, password } = body;
  if (!verifyAdminPassword(password)) {
    return Response.json({ error: "Incorrect password" }, { status: 401 });
  }

  if (!program || !getAllPrograms().includes(program)) {
    return Response.json({ error: "Invalid program" }, { status: 400 });
  }

  const entry = updateProgramDefaults(program, { skills, certifications });
  return Response.json({ program, ...entry });
}
