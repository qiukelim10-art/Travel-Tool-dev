import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import { getActiveTripSettings, updateActiveTripSettings } from "@/lib/server/sharedDataStore";

export async function GET() {
  try {
    const settings = await getActiveTripSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return apiErrorResponse(error, "Unable to load trip settings.", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const settings = await updateActiveTripSettings(await request.json());
    return NextResponse.json(settings);
  } catch (error) {
    return apiErrorResponse(error, "Unable to save trip settings.", 400);
  }
}
