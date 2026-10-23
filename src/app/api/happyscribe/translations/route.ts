import { errorResponse, jsonError, readJsonBody } from "@/lib/http";
import { createTranslationOrder } from "@/lib/happyscribe/orders";
import { createTranslationRequestSchema } from "@/lib/happyscribe/schemas";
import {
  isSameSpokenLanguage,
  isTargetLanguage,
  sameLanguageMessage,
} from "@/lib/languages";

export async function POST(request: Request) {
  try {
    const parsed = createTranslationRequestSchema.safeParse(
      await readJsonBody(request),
    );
    if (!parsed.success || !isResourceId(parsed.data.transcriptionId)) {
      return jsonError(
        "Choose a transcript and target language, then try again.",
        400,
      );
    }

    if (!isTargetLanguage(parsed.data.targetLanguage)) {
      return jsonError("Choose a supported translation language.", 400);
    }

    if (
      parsed.data.sourceLanguage &&
      isSameSpokenLanguage(
        parsed.data.sourceLanguage,
        parsed.data.targetLanguage,
      )
    ) {
      return jsonError(
        sameLanguageMessage(
          parsed.data.sourceLanguage,
          parsed.data.targetLanguage,
        ),
        400,
      );
    }

    const order = await createTranslationOrder({
      transcriptionId: parsed.data.transcriptionId,
      targetLanguage: parsed.data.targetLanguage,
    });

    return Response.json({ id: order.id, state: order.state });
  } catch (error) {
    return errorResponse(error);
  }
}

function isResourceId(id: string): boolean {
  return /^[a-zA-Z0-9-]{1,80}$/.test(id);
}
