import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import {
  createItineraryItem,
  listItineraryItems,
  validateItineraryInput
} from "@/lib/server/sharedDataStore";

export async function GET() {
  try {
    const itineraryItems = await listItineraryItems();
    return NextResponse.json({ itineraryItems });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load itinerary.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = validateItineraryInput(await request.json());
    await createItineraryItem(input);
    const itineraryItems = await listItineraryItems();
    return NextResponse.json({ itineraryItems }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to create itinerary item.", 400);
  }
}
