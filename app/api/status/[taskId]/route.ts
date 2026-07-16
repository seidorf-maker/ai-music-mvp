import { NextRequest, NextResponse } from "next/server";
import { getGenerationStatus } from "@/lib/suno";

const FAILURE_MARKERS = ["FAIL", "ERROR"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  if (!taskId) {
    return NextResponse.json({ error: "Missing task id." }, { status: 400 });
  }

  try {
    const result = await getGenerationStatus(taskId);
    const status = result.data.status ?? "UNKNOWN";
    const tracks = result.data.response?.sunoData ?? [];

    if (status === "SUCCESS" && tracks.length > 0) {
      return NextResponse.json({ state: "completed", tracks });
    }
    if (FAILURE_MARKERS.some((marker) => status.toUpperCase().includes(marker))) {
      return NextResponse.json({ state: "failed", providerStatus: status });
    }
    return NextResponse.json({ state: "processing", providerStatus: status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status check failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
