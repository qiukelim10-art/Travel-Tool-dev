import { NextResponse } from "next/server";
import { unlockDocumentItem } from "@/lib/server/sharedDataStore";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { passcode?: unknown };
    const externalUrl = await unlockDocumentItem(id, String(body.passcode ?? ""));

    if (!externalUrl) {
      return NextResponse.json({ error: "Invalid passcode." }, { status: 401 });
    }

    return NextResponse.json({ externalUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to unlock document link." },
      { status: 400 }
    );
  }
}
