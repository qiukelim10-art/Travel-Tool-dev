import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
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
    return apiErrorResponse(error, "Unable to update expense.", 400);
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
    return apiErrorResponse(error, "Unable to delete expense.", 500);
  }
}
