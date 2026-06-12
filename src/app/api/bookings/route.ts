import { NextResponse } from "next/server";
import {
  createBooking,
  listBookings,
  validateBookingInput
} from "@/lib/server/sharedDataStore";

export async function GET() {
  try {
    const bookings = await listBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load bookings." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const input = validateBookingInput(await request.json());
    await createBooking(input);
    const bookings = await listBookings();
    return NextResponse.json({ bookings }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create booking." },
      { status: 400 }
    );
  }
}
