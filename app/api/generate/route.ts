import { NextRequest, NextResponse } from "next/server";
import { generateTrack } from "@/lib/suno";

export async function POST(req: NextRequest) {
  let body: { prompt?: string; instrumental?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
  }
  if (prompt.length > 500) {
    return NextResponse.json({ error: "Prompt must be 500 characters or fewer." }, { status: 400 });
  }

  const callBackUrl = new URL("/api/suno-callback", req.url).toString();

  try {
    const result = await generateTrack({
      prompt,
      instrumental: Boolean(body.instrumental),
      callBackUrl,
    });
    return NextResponse.json({ taskId: result.data.taskId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation request failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
