import { NextResponse } from "next/server";
import { getTripEditorToken, getTripShareToken } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import { getActiveTripAccessStatus } from "@/lib/server/sharedDataStore";

export async function GET(request: Request) {
  try {
    const status = await getActiveTripAccessStatus(getTripShareToken(request), getTripEditorToken(request));
    const responseStatus = status.configured && !status.authorized ? 401 : 200;
    return NextResponse.json(status, { status: responseStatus });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load trip access status.", 500);
  }
}
