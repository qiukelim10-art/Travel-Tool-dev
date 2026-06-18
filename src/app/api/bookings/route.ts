import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
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
    return apiErrorResponse(error, "Unable to load bookings.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = validateBookingInput(await request.json());
    await createBooking(input);
    const bookings = await listBookings();
    return NextResponse.json({ bookings }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to create booking.", 400);
  }
}
