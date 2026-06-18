import { NextResponse } from "next/server";
import { accessErrorResponse, requireTripEditor } from "@/lib/server/accessControl";
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
    await requireTripEditor(request);
    const { id } = await context.params;
    const input = validateBookingInput(await request.json());
    await updateBooking(id, input);
    const bookings = await listBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to update booking.", 400);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireTripEditor(request);
    const { id } = await context.params;
    await deleteBooking(id);
    const bookings = await listBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to delete booking.", 500);
  }
}
