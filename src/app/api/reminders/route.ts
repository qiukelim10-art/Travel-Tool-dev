import { NextResponse } from "next/server";
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load reminders." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const input = validateReminderInput(await request.json());
    await createReminder(input);
    const reminders = await listReminders();
    return NextResponse.json({ reminders }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create reminder." },
      { status: 400 }
    );
  }
}
