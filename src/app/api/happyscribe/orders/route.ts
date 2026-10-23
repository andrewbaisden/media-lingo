import { errorResponse, jsonError, readJsonBody } from "@/lib/http";
import { assertHttpsUrl } from "@/lib/happyscribe/client";
import { createTranscriptionOrder } from "@/lib/happyscribe/orders";
import { createOrderRequestSchema } from "@/lib/happyscribe/schemas";
import { isSourceLanguage } from "@/lib/languages";

export async function POST(request: Request) {
  try {
    const parsed = createOrderRequestSchema.safeParse(
      await readJsonBody(request),
    );
    if (!parsed.success) {
      return jsonError(
        "Check the file and source language, then try again.",
        400,
      );
    }

    if (!isSourceLanguage(parsed.data.language)) {
      return jsonError("Choose a supported source language.", 400);
    }

    let url: string;
    try {
      url = assertHttpsUrl(
        parsed.data.url,
        "The upload link is not valid. Try the upload again.",
      );
    } catch (error) {
      return errorResponse(error);
    }

    const order = await createTranscriptionOrder({
      url,
      language: parsed.data.language,
      name: parsed.data.name,
    });

    return Response.json({ id: order.id, state: order.state });
  } catch (error) {
    return errorResponse(error);
  }
}
