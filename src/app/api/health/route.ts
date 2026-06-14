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
  } catch (error) {
    console.error("Health check failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown database error"
    });

    return NextResponse.json(
      {
        status: "error",
        database: "unavailable"
      },
      { status: 503 }
    );
  }
}
