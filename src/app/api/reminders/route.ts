import { NextResponse } from "next/server";
import { accessErrorResponse, requireTripEditor, requireTripViewer } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import {
  createReminder,
  listReminders,
  validateReminderInput
} from "@/lib/server/sharedDataStore";

export async function GET(request: Request) {
  try {
    await requireTripViewer(request);
    const reminders = await listReminders();
    return NextResponse.json({ reminders });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to load reminders.", 500);
  }
}

export async function POST(request: Request) {
  try {
    await requireTripEditor(request);
    const input = validateReminderInput(await request.json());
    await createReminder(input);
    const reminders = await listReminders();
    return NextResponse.json({ reminders }, { status: 201 });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to create reminder.", 400);
  }
}
