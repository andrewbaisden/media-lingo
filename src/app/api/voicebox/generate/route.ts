import { errorResponse, jsonError, readJsonBody } from "@/lib/http";
import { generateSpeech } from "@/lib/voicebox/client";
import { VOICEBOX_MAX_CHARACTERS } from "@/lib/voicebox/language";
import { generateRequestSchema } from "@/lib/voicebox/schemas";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    if (
      body &&
      typeof body === "object" &&
      "text" in body &&
      typeof body.text === "string" &&
      body.text.trim().length > VOICEBOX_MAX_CHARACTERS
    ) {
      return jsonError(
        "This translation is too long for Voicebox. Voicebox accepts up to 50,000 characters.",
        400,
      );
    }

    const parsed = generateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        "Choose a voice, then try generating speech again.",
        400,
      );
    }

    const generation = await generateSpeech(parsed.data);
    return Response.json({
      id: generation.id,
      audioUrl: `/api/voicebox/audio/${generation.id}`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
