import { NextResponse } from "next/server";
import { accessErrorResponse, requireTripViewer } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import { recoverActiveTripEditorAccess } from "@/lib/server/sharedDataStore";

export async function POST(request: Request) {
  try {
    const { shareToken } = await requireTripViewer(request);
    const body = (await request.json()) as {
      ownerRecoveryToken?: unknown;
      newEditPasscode?: unknown;
    };
    const session = await recoverActiveTripEditorAccess(
      shareToken,
      body.ownerRecoveryToken,
      body.newEditPasscode
    );
    return NextResponse.json(session);
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to recover editor access.", 400);
  }
}
