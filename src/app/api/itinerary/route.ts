import { NextResponse } from "next/server";
import { accessErrorResponse, requireTripEditor, requireTripViewer } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import {
  createItineraryItem,
  listItineraryItems,
  validateItineraryInput
} from "@/lib/server/sharedDataStore";

export async function GET(request: Request) {
  try {
    await requireTripViewer(request);
    const itineraryItems = await listItineraryItems();
    return NextResponse.json({ itineraryItems });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to load itinerary.", 500);
  }
}

export async function POST(request: Request) {
  try {
    await requireTripEditor(request);
    const input = validateItineraryInput(await request.json());
    await createItineraryItem(input);
    const itineraryItems = await listItineraryItems();
    return NextResponse.json({ itineraryItems }, { status: 201 });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to create itinerary item.", 400);
  }
}
