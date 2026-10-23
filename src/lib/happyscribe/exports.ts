import "server-only";

import { HappyScribeError } from "@/lib/errors";
import { assertHttpsUrl, happyscribeRequest } from "@/lib/happyscribe/client";
import { parseExport, type HappyScribeExport } from "@/lib/happyscribe/schemas";

const EXPORT_INTERVAL_MS = 2_000;
const EXPORT_TIMEOUT_MS = 45_000;

export async function exportTranscriptText(
  transcriptionId: string,
): Promise<string> {
  const created = await createExport(transcriptionId);
  const ready = await waitForExport(created);
  if (!ready.download_link) {
    throw new HappyScribeError(
      "HappyScribe finished the export without a download link.",
      502,
      "upstream",
    );
  }

  const downloadUrl = assertHttpsUrl(
    ready.download_link,
    "HappyScribe returned an unexpected transcript link.",
  );
  return downloadTranscript(downloadUrl);
}

async function createExport(
  transcriptionId: string,
): Promise<HappyScribeExport> {
  const payload = await happyscribeRequest("/exports", {
    method: "POST",
    body: {
      export: {
        format: "txt",
        transcription_ids: [transcriptionId],
        show_timestamps: false,
        show_speakers: false,
        show_comments: false,
      },
    },
  });
  return readExport(payload);
}

async function getExport(id: string): Promise<HappyScribeExport> {
  const payload = await happyscribeRequest(
    `/exports/${encodeURIComponent(id)}`,
  );
  return readExport(payload);
}

async function waitForExport(
  initial: HappyScribeExport,
): Promise<HappyScribeExport> {
  let current = initial;
  const started = Date.now();

  while (Date.now() - started < EXPORT_TIMEOUT_MS) {
    if (current.state === "ready") {
      return current;
    }
    if (current.state === "failed" || current.state === "expired") {
      throw new HappyScribeError(
        "HappyScribe could not export the transcript.",
        502,
        "upstream",
      );
    }
    await delay(EXPORT_INTERVAL_MS);
    current = await getExport(current.id);
  }

  throw new HappyScribeError(
    "The transcript export timed out. Try again.",
    504,
    "timeout",
  );
}

async function downloadTranscript(url: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new HappyScribeError(
        "The transcript download timed out. Try again.",
        504,
        "timeout",
      );
    }
    throw new HappyScribeError(
      "The transcript could not be downloaded. Try again.",
      502,
      "upstream",
    );
  }

  if (!response.ok) {
    throw new HappyScribeError(
      "The transcript could not be downloaded. Try again.",
      502,
      "upstream",
    );
  }

  const text = (await response.text()).replace(/^\uFEFF/, "").trim();
  if (text.length > 1_000_000) {
    throw new HappyScribeError(
      "This transcript is too large to show.",
      502,
      "upstream",
    );
  }
  return text;
}

function readExport(payload: unknown): HappyScribeExport {
  const parsed = parseExport(payload);
  if (!parsed) {
    throw new HappyScribeError(
      "HappyScribe returned an unexpected export response.",
      502,
      "upstream",
    );
  }
  return parsed;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
