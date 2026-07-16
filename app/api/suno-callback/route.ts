import { NextResponse } from "next/server";

/**
 * Suno requires a callBackUrl on every generation request, but this app has no
 * database or job queue to write the callback into — the frontend gets status
 * updates by polling /api/status/[taskId] instead. This route only exists so
 * the required field has somewhere valid to point; it intentionally no-ops.
 */
export async function POST() {
  return NextResponse.json({ received: true });
}
