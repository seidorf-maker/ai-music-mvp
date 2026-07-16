import { NextRequest, NextResponse } from "next/server";
import { getLyrics } from "@/lib/suno";

export async function POST(req: NextRequest) {
  let body: { taskId?: string; audioId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { taskId, audioId } = body;
  if (!taskId || !audioId) {
    return NextResponse.json({ error: "taskId and audioId are required." }, { status: 400 });
  }

  try {
    const text = await getLyrics(taskId, audioId);
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load lyrics.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
