import { NextResponse } from "next/server";
import { accessErrorResponse, requireTripEditor } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import {
  deletePackingItem,
  listPackingItems,
  listTripTravelersForBusinessData,
  updatePackingItem,
  validatePackingInput
} from "@/lib/server/sharedDataStore";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireTripEditor(request);
    const { id } = await context.params;
    const input = await validatePackingInput(await request.json());
    await updatePackingItem(id, input);
    const items = await listPackingItems();
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ items, travelers });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to update packing item.", 400);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireTripEditor(request);
    const { id } = await context.params;
    await deletePackingItem(id);
    const items = await listPackingItems();
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ items, travelers });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to delete packing item.", 500);
  }
}
