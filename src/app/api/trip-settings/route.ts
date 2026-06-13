import { NextResponse } from "next/server";
import { getActiveTripSettings, updateActiveTripSettings } from "@/lib/server/sharedDataStore";

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

export async function PUT(request: Request) {
  try {
    const settings = await updateActiveTripSettings(await request.json());
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save trip settings." },
      { status: 400 }
    );
  }
}
