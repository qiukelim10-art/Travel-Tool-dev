import { NextResponse } from "next/server";
import { accessErrorResponse, requireTripEditor, requireTripViewer } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import { getActiveTripSettings, updateActiveTripSettings } from "@/lib/server/sharedDataStore";

export async function GET(request: Request) {
  try {
    await requireTripViewer(request);
    const settings = await getActiveTripSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to load trip settings.", 500);
  }
}

export async function PUT(request: Request) {
  try {
    await requireTripEditor(request);
    const settings = await updateActiveTripSettings(await request.json());
    return NextResponse.json(settings);
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to save trip settings.", 400);
  }
}
