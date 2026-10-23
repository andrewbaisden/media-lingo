export const POLL_INTERVAL_MS = 4_000;
export const POLL_TIMEOUT_MS = 10 * 60 * 1000;

export type OrderSnapshot = {
  status: "pending" | "fulfilled" | "failed";
  transcriptionId?: string;
  message?: string;
};

export async function pollOrder(
  orderId: string,
  signal: AbortSignal,
): Promise<string> {
  const started = Date.now();

  while (Date.now() - started <= POLL_TIMEOUT_MS) {
    const snapshot = await getJson<OrderSnapshot>(
      `/api/happyscribe/orders/${orderId}`,
      signal,
    );

    if (snapshot.status === "failed") {
      throw new Error(
        snapshot.message || "HappyScribe could not finish this job.",
      );
    }

    if (snapshot.status === "fulfilled" && snapshot.transcriptionId) {
      return snapshot.transcriptionId;
    }

    await delay(POLL_INTERVAL_MS, signal);
  }

  throw new Error(
    "HappyScribe took too long to finish. Try again with a shorter file.",
  );
}

export async function postJson<T>(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal,
  });
  return readResponse<T>(response);
}

export async function getJson<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { cache: "no-store", signal });
  return readResponse<T>(response);
}

async function readResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    (T & { message?: string }) | null;

  if (!response.ok) {
    throw new Error(payload?.message || "Something went wrong. Try again.");
  }

  if (!payload) {
    throw new Error("Something went wrong. Try again.");
  }

  return payload;
}

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function abortError(): DOMException {
  return new DOMException("The request was aborted.", "AbortError");
}
