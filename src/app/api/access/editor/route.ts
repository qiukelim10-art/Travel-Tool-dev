import { NextResponse } from "next/server";
import { accessErrorResponse, requireTripViewer } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import { createActiveTripEditorSession } from "@/lib/server/sharedDataStore";

export async function POST(request: Request) {
  try {
    const { shareToken } = await requireTripViewer(request);
    const body = (await request.json()) as { passcode?: unknown };
    const session = await createActiveTripEditorSession(shareToken, body.passcode);
    return NextResponse.json(session);
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to enter editor mode.", 400);
  }
}
