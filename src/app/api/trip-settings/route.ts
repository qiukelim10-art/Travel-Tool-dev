import { NextResponse } from "next/server";
import { getActiveTripSettings } from "@/lib/server/sharedDataStore";

export async function GET() {
  try {
    const settings = await getActiveTripSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load trip settings." },
      { status: 500 }
    );
  }
}
