import { NextResponse } from "next/server";
import { getActiveTripSettings } from "@/lib/server/sharedDataStore";

export async function GET() {
  try {
    const settings = await getActiveTripSettings();

    return NextResponse.json({
      status: "ok",
      database: "ready",
      activeTripId: settings.trip.id
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        database: "unavailable"
      },
      { status: 503 }
    );
  }
}
