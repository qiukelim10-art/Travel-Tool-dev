import { travelers } from "@/data/tripData";
import { NextResponse } from "next/server";
import {
  deletePackingItem,
  listPackingItems,
  updatePackingItem,
  validatePackingInput
} from "@/lib/server/sharedDataStore";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const input = validatePackingInput(await request.json());
    await updatePackingItem(id, input);
    const items = await listPackingItems();
    return NextResponse.json({ items, travelers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update packing item." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deletePackingItem(id);
    const items = await listPackingItems();
    return NextResponse.json({ items, travelers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete packing item." },
      { status: 500 }
    );
  }
}
