import { NextResponse } from "next/server";
import { accessErrorResponse, requireTripViewer } from "@/lib/server/accessControl";
import { apiErrorResponse } from "@/lib/server/apiErrorResponse";
import { unlockDocumentItem } from "@/lib/server/sharedDataStore";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await requireTripViewer(request);
    const { id } = await context.params;
    const body = (await request.json()) as { passcode?: unknown };
    const externalUrl = await unlockDocumentItem(id, String(body.passcode ?? ""));

    if (!externalUrl) {
      return NextResponse.json({ error: "Invalid passcode." }, { status: 401 });
    }

    return NextResponse.json({ externalUrl });
  } catch (error) {
    return accessErrorResponse(error) ?? apiErrorResponse(error, "Unable to unlock document link.", 400);
  }
}
