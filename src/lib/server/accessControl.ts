import { NextResponse } from "next/server";
import { verifyActiveTripShareToken } from "@/lib/server/sharedDataStore";

export const tripShareTokenHeader = "x-trip-share-token";
export const tripEditorTokenHeader = "x-trip-editor-token";
export const tripTravelerIdHeader = "x-trip-traveler-id";

export class AccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AccessError";
    this.status = status;
  }
}

export function isAccessError(error: unknown): error is AccessError {
  return error instanceof AccessError;
}

export function accessErrorResponse(error: unknown) {
  if (isAccessError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return null;
}

export function getTripShareToken(request: Request) {
  return request.headers.get(tripShareTokenHeader)?.trim() ?? "";
}

export function getTripEditorToken(request: Request) {
  return request.headers.get(tripEditorTokenHeader)?.trim() ?? "";
}

export function getTripTravelerId(request: Request) {
  return request.headers.get(tripTravelerIdHeader)?.trim() ?? "";
}

export async function requireTripViewer(request: Request) {
  const shareToken = getTripShareToken(request);

  if (!shareToken || !(await verifyActiveTripShareToken(shareToken))) {
    throw new AccessError("Private trip link is required.", 401);
  }

  return { shareToken };
}

export async function requireTripEditor(request: Request) {
  const { shareToken } = await requireTripViewer(request);
  return { shareToken, editorToken: "" };
}

export async function requireTravelerStatusAccess(request: Request) {
  const { shareToken } = await requireTripViewer(request);
  const travelerId = getTripTravelerId(request);

  if (!travelerId) {
    throw new AccessError("Select a traveler identity before updating status.", 403);
  }

  return { shareToken, travelerId };
}
