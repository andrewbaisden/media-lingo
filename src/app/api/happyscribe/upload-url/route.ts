import { jsonError, readJsonBody, errorResponse } from "@/lib/http";
import { fileExtension, sanitizeFilename } from "@/lib/media/validate";
import { createSignedUpload } from "@/lib/happyscribe/uploads";
import { uploadUrlRequestSchema } from "@/lib/happyscribe/schemas";

const ALLOWED_EXTENSIONS = new Set(["mp3", "wav", "m4a", "mp4", "mov", "webm"]);

export async function POST(request: Request) {
  try {
    const parsed = uploadUrlRequestSchema.safeParse(
      await readJsonBody(request),
    );
    if (!parsed.success) {
      return jsonError("Choose an audio or video file.", 400);
    }

    const extension = fileExtension(parsed.data.filename);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return jsonError(
        "This file type is not supported. Use MP3, WAV, M4A, MP4, MOV, or WebM.",
        400,
      );
    }

    const signedUrl = await createSignedUpload(
      sanitizeFilename(parsed.data.filename),
    );
    return Response.json({ signedUrl });
  } catch (error) {
    return errorResponse(error);
  }
}
