import { NextResponse } from "next/server";
import { accessErrorResponse, requireTravelerStatusAccess } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import {
  listPackingItems,
  listTripTravelersForBusinessData,
  updatePackingTravelerStatus
} from "@/lib/server/sharedDataStore";
import { type PackingTravelerStatus } from "@/lib/sharedDataTypes";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { travelerId } = await requireTravelerStatusAccess(request);
    const { id } = await context.params;
    const body = (await request.json()) as { status?: unknown };
    await updatePackingTravelerStatus(id, travelerId, String(body.status ?? "") as PackingTravelerStatus);
    const items = await listPackingItems();
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ items, travelers });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to update packing status.", 400);
  }
}
