import { NextResponse } from "next/server";
import { accessErrorResponse, requireTripEditor } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import {
  deleteReminder,
  listReminders,
  updateReminder,
  validateReminderInput
} from "@/lib/server/sharedDataStore";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireTripEditor(request);
    const { id } = await context.params;
    const input = validateReminderInput(await request.json());
    await updateReminder(id, input);
    const reminders = await listReminders();
    return NextResponse.json({ reminders });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to update reminder.", 400);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireTripEditor(request);
    const { id } = await context.params;
    await deleteReminder(id);
    const reminders = await listReminders();
    return NextResponse.json({ reminders });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to delete reminder.", 500);
  }
}
