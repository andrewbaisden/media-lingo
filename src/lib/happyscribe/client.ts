import "server-only";

import { HappyScribeError, happyScribeStatusMessage } from "@/lib/errors";

const BASE_URL = "https://www.happyscribe.com/api/v1";

type RequestOptions = {
  method?: string;
  body?: unknown;
  timeoutMs?: number;
};

export async function happyscribeRequest(
  path: string,
  options: RequestOptions = {},
): Promise<unknown> {
  const apiKey = process.env.HAPPYSCRIBE_API_KEY?.trim();
  if (!apiKey) {
    throw new HappyScribeError(
      "HappyScribe is not configured. Add HAPPYSCRIBE_API_KEY to the server environment.",
      500,
      "auth",
    );
  }

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
  });

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs ?? 30_000),
    });
  } catch (error) {
    if (isTimeout(error)) {
      throw new HappyScribeError(
        "HappyScribe took too long to respond. Try again.",
        504,
        "timeout",
      );
    }
    throw new HappyScribeError(
      "HappyScribe could not be reached. Try again.",
      502,
      "upstream",
    );
  }

  const payload = await readJson(response);

  if (!response.ok) {
    const route = path.split("?")[0] ?? path;
    console.error(`HappyScribe ${response.status} ${route}`);
    throw new HappyScribeError(
      happyScribeStatusMessage(response.status, retrySeconds(payload)),
      response.status,
      response.status === 429
        ? "rate_limit"
        : response.status === 401 || response.status === 403
          ? "auth"
          : response.status === 404
            ? "not_found"
            : "upstream",
    );
  }

  return payload;
}

export function assertHttpsUrl(value: string, message: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new HappyScribeError(message, 502, "upstream");
  }

  if (url.protocol !== "https:") {
    throw new HappyScribeError(message, 502, "upstream");
  }

  return url.toString();
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function retrySeconds(payload: unknown): number | undefined {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("retry_in_seconds" in payload)
  ) {
    return undefined;
  }
  const value = payload.retry_in_seconds;
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}
