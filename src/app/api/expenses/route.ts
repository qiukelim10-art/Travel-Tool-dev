import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import {
  createExpense,
  listExpenses,
  listTripTravelersForBusinessData,
  validateExpenseInput
} from "@/lib/server/sharedDataStore";

export async function GET() {
  try {
    const expenses = await listExpenses();
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ expenses, travelers });
  } catch (error) {
    return apiErrorResponse(error, "Unable to load expenses.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = await validateExpenseInput(await request.json());
    await createExpense(input);
    const expenses = await listExpenses();
    const travelers = await listTripTravelersForBusinessData();
    return NextResponse.json({ expenses, travelers }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, "Unable to create expense.", 400);
  }
}
