export type HappyScribeErrorCode =
  "auth" | "rate_limit" | "not_found" | "timeout" | "upstream" | "validation";

export class HappyScribeError extends Error {
  readonly status: number;
  readonly code: HappyScribeErrorCode;

  constructor(message: string, status: number, code: HappyScribeErrorCode) {
    super(message);
    this.name = "HappyScribeError";
    this.status = status;
    this.code = code;
  }
}

export class VoiceboxUnavailableError extends Error {
  constructor() {
    super(
      "Voicebox is not currently running. Start the local Voicebox service and try again.",
    );
    this.name = "VoiceboxUnavailableError";
  }
}

export class VoiceboxError extends Error {
  readonly status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "VoiceboxError";
    this.status = status;
  }
}

export function publicHappyScribeStatus(status: number): number {
  if (status === 401 || status === 403) {
    return 401;
  }
  if (status === 404 || status === 429 || status === 504) {
    return status;
  }
  if (status >= 500) {
    return 502;
  }
  return 400;
}

export function happyScribeStatusMessage(
  status: number,
  retryInSeconds?: number,
): string {
  if (status === 401 || status === 403) {
    return "HappyScribe rejected the API key. Check HAPPYSCRIBE_API_KEY.";
  }
  if (status === 404) {
    return "HappyScribe could not find that job.";
  }
  if (status === 429) {
    if (retryInSeconds && retryInSeconds > 0) {
      return `HappyScribe is rate limiting requests. Wait ${retryInSeconds} seconds and try again.`;
    }
    return "HappyScribe is rate limiting requests. Wait a moment and try again.";
  }
  if (status === 504) {
    return "HappyScribe took too long to respond. Try again.";
  }
  if (status >= 500) {
    return "HappyScribe is temporarily unavailable. Try again in a moment.";
  }
  return "HappyScribe could not complete that request.";
}
