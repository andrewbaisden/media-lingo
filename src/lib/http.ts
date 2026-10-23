import {
  HappyScribeError,
  publicHappyScribeStatus,
  VoiceboxError,
  VoiceboxUnavailableError,
} from "@/lib/errors";

export function jsonError(message: string, status: number): Response {
  return Response.json({ message }, { status });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HappyScribeError) {
    return jsonError(error.message, publicHappyScribeStatus(error.status));
  }
  if (error instanceof VoiceboxUnavailableError) {
    return jsonError(error.message, 503);
  }
  if (error instanceof VoiceboxError) {
    return jsonError(error.message, error.status === 404 ? 404 : 502);
  }
  console.error(error instanceof Error ? error.name : "UnknownError");
  return jsonError("Something went wrong. Try again.", 500);
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
