import OpenAI from "openai";

const INSTRUCTOR_INSTRUCTIONS =
  "Speak like an experienced shop instructor teaching blueprint reading. Calm, clear, patient, and confident. Not salesy or overly cheerful.";

export async function POST(req) {
  try {
    const body = await req.json();
    const text = body.text?.trim();

    if (!text) {
      return Response.json({ error: "No text provided." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "OPENAI_API_KEY not configured on server." }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: body.voice || "onyx",
      input: text,
      instructions: body.instructions || INSTRUCTOR_INSTRUCTIONS,
      speed: 0.95,
    });

    const buffer = Buffer.from(await speech.arrayBuffer());

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Text-to-speech failed." },
      { status: 500 }
    );
  }
}
