import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
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
    return apiErrorResponse(error, "Unable to update booking.", 400);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteBooking(id);
    const bookings = await listBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    return apiErrorResponse(error, "Unable to delete booking.", 500);
  }
}
