import { NextResponse } from "next/server";

const infrastructureErrorCodes = new Set([
  "ENOTFOUND",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ECONNRESET",
  "PROTOCOL_CONNECTION_LOST",
  "ER_ACCESS_DENIED_ERROR",
  "ER_BAD_DB_ERROR",
  "ER_CON_COUNT_ERROR"
]);

function getErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";
}

function isInfrastructureError(error: unknown) {
  const code = getErrorCode(error);
  const message = error instanceof Error ? error.message : "";

  return (
    infrastructureErrorCodes.has(code) ||
    /getaddrinfo|aivencloud|mysql|connection|connect|timeout|ECONN|ETIMEDOUT|ENOTFOUND|ER_/i.test(message)
  );
}

export function apiErrorResponse(error: unknown, fallbackMessage: string, status: number) {
  const code = getErrorCode(error);
  const internalError = isInfrastructureError(error);
  const message = internalError ? fallbackMessage : error instanceof Error ? error.message : fallbackMessage;

  console.error(fallbackMessage, {
    name: error instanceof Error ? error.name : "UnknownError",
    code: code || undefined,
    message: error instanceof Error ? error.message : "Unknown error"
  });

  return NextResponse.json({ error: message }, { status: internalError ? 500 : status });
}
