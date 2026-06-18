import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import {
  createDocumentItem,
  listDocumentItems,
  listTripTravelersForBusinessData,
  validateDocumentInput
} from "@/lib/server/sharedDataStore";

export async function GET() {
  try {
    const documents = await listDocumentItems();
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ documents, travelers });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load documents.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = await validateDocumentInput(await request.json());
    await createDocumentItem(input);
    const documents = await listDocumentItems();
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ documents, travelers }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to create document.", 400);
  }
}
