import OpenAI from "openai";

export async function POST(req) {
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
    model: "tts-1-hd",
    voice: body.voice || "nova",
    input: text,
    speed: 0.92,
  });

  const buffer = Buffer.from(await speech.arrayBuffer());

  return new Response(buffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
