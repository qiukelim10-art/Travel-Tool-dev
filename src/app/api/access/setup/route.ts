import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import { setupActiveTripAccess } from "@/lib/server/sharedDataStore";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { editPasscode?: unknown };
    const result = await setupActiveTripAccess(body.editPasscode);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to configure trip access.", 400);
  }
}
