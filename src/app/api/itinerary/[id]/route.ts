import { NextResponse } from "next/server";
import {
  deleteItineraryItem,
  listItineraryItems,
  updateItineraryItem,
  validateItineraryInput
} from "@/lib/server/sharedDataStore";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const input = validateItineraryInput(await request.json());
    await updateItineraryItem(id, input);
    const itineraryItems = await listItineraryItems();
    return NextResponse.json({ itineraryItems });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update itinerary item." },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  return PATCH(request, context);
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteItineraryItem(id);
    const itineraryItems = await listItineraryItems();
    return NextResponse.json({ itineraryItems });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete itinerary item." },
      { status: 500 }
    );
  }
}
