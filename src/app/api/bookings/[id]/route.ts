import { NextResponse } from "next/server";
import {
  deleteBooking,
  listBookings,
  updateBooking,
  validateBookingInput
} from "@/lib/server/sharedDataStore";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const input = validateBookingInput(await request.json());
    await updateBooking(id, input);
    const bookings = await listBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update booking." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteBooking(id);
    const bookings = await listBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete booking." },
      { status: 500 }
    );
  }
}
