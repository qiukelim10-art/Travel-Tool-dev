import { NextResponse } from "next/server";
import {
  deleteExpense,
  listExpenses,
  listTripTravelersForBusinessData,
  updateExpense,
  validateExpenseInput
} from "@/lib/server/sharedDataStore";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const input = await validateExpenseInput(await request.json());
    await updateExpense(id, input);
    const expenses = await listExpenses();
    const travelers = await listTripTravelersForBusinessData();
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
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ expenses, travelers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete expense." },
      { status: 500 }
    );
  }
}
