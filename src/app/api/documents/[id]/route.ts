import { NextResponse } from "next/server";
import { accessErrorResponse, requireTripEditor } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import {
  deleteDocumentItem,
  listDocumentItems,
  listTripTravelersForBusinessData,
  updateDocumentItem,
  validateDocumentInput
} from "@/lib/server/sharedDataStore";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireTripEditor(request);
    const { id } = await context.params;
    const input = await validateDocumentInput(await request.json());
    await updateDocumentItem(id, input);
    const documents = await listDocumentItems();
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ documents, travelers });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to update document.", 400);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireTripEditor(request);
    const { id } = await context.params;
    await deleteDocumentItem(id);
    const documents = await listDocumentItems();
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ documents, travelers });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to delete document.", 500);
  }
}
