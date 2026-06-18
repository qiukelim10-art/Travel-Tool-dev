import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
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
    return apiErrorResponse(error, "Unable to update itinerary item.", 400);
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
    return apiErrorResponse(error, "Unable to delete itinerary item.", 500);
  }
}
