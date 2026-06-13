import { travelers } from "@/data/tripData";
import { NextResponse } from "next/server";
import {
  deleteExpense,
  listExpenses,
  updateExpense,
  validateExpenseInput
} from "@/lib/server/sharedDataStore";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const input = validateExpenseInput(await request.json());
    await updateExpense(id, input);
    const expenses = await listExpenses();
    return NextResponse.json({ expenses, travelers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update expense." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteExpense(id);
    const expenses = await listExpenses();
    return NextResponse.json({ expenses, travelers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete expense." },
      { status: 500 }
    );
  }
}
