import { NextResponse } from "next/server";
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load packing items." },
      { status: 500 }
    );
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create packing item." },
      { status: 400 }
    );
  }
}
