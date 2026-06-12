import { NextResponse } from "next/server";
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load itinerary." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const input = validateItineraryInput(await request.json());
    await createItineraryItem(input);
    const itineraryItems = await listItineraryItems();
    return NextResponse.json({ itineraryItems }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create itinerary item." },
      { status: 400 }
    );
  }
}
