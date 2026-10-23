import "server-only";

import { HappyScribeError } from "@/lib/errors";
import { assertHttpsUrl, happyscribeRequest } from "@/lib/happyscribe/client";
import { parseSignedUpload } from "@/lib/happyscribe/schemas";

const UPLOAD_URL_ERROR = "HappyScribe returned an unexpected upload URL.";

export async function createSignedUpload(filename: string): Promise<string> {
  const payload = await happyscribeRequest(
    `/uploads/new?filename=${encodeURIComponent(filename)}`,
  );
  const upload = parseSignedUpload(payload);
  if (!upload) {
    throw new HappyScribeError(
      "HappyScribe returned an unexpected upload response.",
      502,
      "upstream",
    );
  }
  return assertHttpsUrl(upload.signedUrl, UPLOAD_URL_ERROR);
}
