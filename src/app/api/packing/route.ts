import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import {
  createPackingItem,
  listPackingItems,
  listTripTravelersForBusinessData,
  validatePackingInput
} from "@/lib/server/sharedDataStore";

export async function GET() {
  try {
    const items = await listPackingItems();
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ items, travelers });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load packing items.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = await validatePackingInput(await request.json());
    await createPackingItem(input);
    const items = await listPackingItems();
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ items, travelers }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to create packing item.", 400);
  }
}
