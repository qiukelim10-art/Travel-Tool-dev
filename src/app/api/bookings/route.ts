import { NextResponse } from "next/server";
import { accessErrorResponse, requireTripEditor, requireTripViewer } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import {
  createBooking,
  listBookings,
  validateBookingInput
} from "@/lib/server/sharedDataStore";

export async function GET(request: Request) {
  try {
    await requireTripViewer(request);
    const bookings = await listBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to load bookings.", 500);
  }
}

export async function POST(request: Request) {
  try {
    await requireTripEditor(request);
    const input = validateBookingInput(await request.json());
    await createBooking(input);
    const bookings = await listBookings();
    return NextResponse.json({ bookings }, { status: 201 });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to create booking.", 400);
  }
}
