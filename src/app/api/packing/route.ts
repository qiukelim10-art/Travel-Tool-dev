import { NextResponse } from "next/server";
import { accessErrorResponse, requireTripEditor, requireTripViewer } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import {
  createPackingItem,
  listPackingItems,
  listTripTravelersForBusinessData,
  validatePackingInput
} from "@/lib/server/sharedDataStore";

export async function GET(request: Request) {
  try {
    await requireTripViewer(request);
    const items = await listPackingItems();
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ items, travelers });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to load packing items.", 500);
  }
}

export async function POST(request: Request) {
  try {
    await requireTripEditor(request);
    const input = await validatePackingInput(await request.json());
    await createPackingItem(input);
    const items = await listPackingItems();
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ items, travelers }, { status: 201 });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to create packing item.", 400);
  }
}
