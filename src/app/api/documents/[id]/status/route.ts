import { NextResponse } from "next/server";
import { accessErrorResponse, requireTravelerStatusAccess } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import {
  listDocumentItems,
  listTripTravelersForBusinessData,
  updateDocumentTravelerStatus
} from "@/lib/server/sharedDataStore";
import { type DocumentTravelerStatus } from "@/lib/sharedDataTypes";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { travelerId } = await requireTravelerStatusAccess(request);
    const { id } = await context.params;
    const body = (await request.json()) as { status?: unknown };
    await updateDocumentTravelerStatus(id, travelerId, String(body.status ?? "") as DocumentTravelerStatus);
    const documents = await listDocumentItems();
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ documents, travelers });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to update document status.", 400);
  }
}
