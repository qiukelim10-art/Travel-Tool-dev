import { travelers } from "@/data/tripData";
import { NextResponse } from "next/server";
import {
  createExpense,
  listExpenses,
  validateExpenseInput
} from "@/lib/server/sharedDataStore";

export async function GET() {
  try {
    const expenses = await listExpenses();
    return NextResponse.json({ expenses, travelers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load expenses." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const input = validateExpenseInput(await request.json());
    await createExpense(input);
    const expenses = await listExpenses();
    return NextResponse.json({ expenses, travelers }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create expense." },
      { status: 400 }
    );
  }
}
