import { errorResponse, jsonError, readJsonBody } from "@/lib/http";
import { exportTranscriptText } from "@/lib/happyscribe/exports";
import { exportRequestSchema } from "@/lib/happyscribe/schemas";

export async function POST(request: Request) {
  try {
    const parsed = exportRequestSchema.safeParse(await readJsonBody(request));
    if (!parsed.success || !isResourceId(parsed.data.transcriptionId)) {
      return jsonError("HappyScribe could not export that transcript.", 400);
    }

    const text = await exportTranscriptText(parsed.data.transcriptionId);
    return Response.json({ text });
  } catch (error) {
    return errorResponse(error);
  }
}

function isResourceId(id: string): boolean {
  return /^[a-zA-Z0-9-]{1,80}$/.test(id);
}
