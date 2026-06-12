import { NextResponse } from "next/server";
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
    const { id } = await context.params;
    const input = validateReminderInput(await request.json());
    await updateReminder(id, input);
    const reminders = await listReminders();
    return NextResponse.json({ reminders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update reminder." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteReminder(id);
    const reminders = await listReminders();
    return NextResponse.json({ reminders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete reminder." },
      { status: 500 }
    );
  }
}
