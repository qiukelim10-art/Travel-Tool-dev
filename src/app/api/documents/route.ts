import { NextResponse } from "next/server";
import { accessErrorResponse, requireTripEditor, requireTripViewer } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import {
  createDocumentItem,
  listDocumentItems,
  listTripTravelersForBusinessData,
  validateDocumentInput
} from "@/lib/server/sharedDataStore";

export async function GET(request: Request) {
  try {
    await requireTripViewer(request);
    const documents = await listDocumentItems();
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ documents, travelers });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to load documents.", 500);
  }
}

export async function POST(request: Request) {
  try {
    await requireTripEditor(request);
    const input = await validateDocumentInput(await request.json());
    await createDocumentItem(input);
    const documents = await listDocumentItems();
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ documents, travelers }, { status: 201 });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to create document.", 400);
  }
}
