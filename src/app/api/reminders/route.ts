import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import {
  createReminder,
  listReminders,
  validateReminderInput
} from "@/lib/server/sharedDataStore";

export async function GET() {
  try {
    const reminders = await listReminders();
    return NextResponse.json({ reminders });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load reminders.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = validateReminderInput(await request.json());
    await createReminder(input);
    const reminders = await listReminders();
    return NextResponse.json({ reminders }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to create reminder.", 400);
  }
}
