import { travelers } from "@/data/tripData";
import { NextResponse } from "next/server";
import {
  createDocumentItem,
  listDocumentItems,
  validateDocumentInput
} from "@/lib/server/sharedDataStore";

export async function GET() {
  try {
    const documents = await listDocumentItems();
    return NextResponse.json({ documents, travelers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load documents." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const input = validateDocumentInput(await request.json());
    await createDocumentItem(input);
    const documents = await listDocumentItems();
    return NextResponse.json({ documents, travelers }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create document." },
      { status: 400 }
    );
  }
}
