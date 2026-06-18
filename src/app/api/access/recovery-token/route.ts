import { NextResponse } from "next/server";
import { accessErrorResponse, requireTripEditor } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import { rotateActiveTripOwnerRecoveryToken } from "@/lib/server/sharedDataStore";

export async function POST(request: Request) {
  try {
    await requireTripEditor(request);
    const ownerRecoveryToken = await rotateActiveTripOwnerRecoveryToken();
    return NextResponse.json({ ownerRecoveryToken });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to create recovery token.", 400);
  }
}
