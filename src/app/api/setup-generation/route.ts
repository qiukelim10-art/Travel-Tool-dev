import { NextResponse } from "next/server";
import { accessErrorResponse, requireTripEditor } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import { generateStarterWorkspace } from "@/lib/server/sharedDataStore";

export async function POST(request: Request) {
  try {
    await requireTripEditor(request);
    const body = (await request.json()) as Record<string, unknown>;
    const { confirmReplaceStarterContent, ...setupInput } = body;
    if (confirmReplaceStarterContent !== true) {
      throw new Error("Setup generation confirmation is required.");
    }
    const result = await generateStarterWorkspace(setupInput);
    return NextResponse.json(result);
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to generate starter workspace.", 400);
  }
}
