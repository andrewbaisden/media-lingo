import "server-only";

import { HappyScribeError } from "@/lib/errors";
import { happyscribeRequest } from "@/lib/happyscribe/client";
import { resolveOrganizationId } from "@/lib/happyscribe/organizations";
import { parseOrder, type HappyScribeOrder } from "@/lib/happyscribe/schemas";
import { organizationIdValue } from "@/lib/happyscribe/status";

export async function createTranscriptionOrder(input: {
  url: string;
  language: string;
  name?: string;
}): Promise<HappyScribeOrder> {
  const organizationId = await resolveOrganizationId();
  const payload = await happyscribeRequest("/orders", {
    method: "POST",
    body: {
      order: {
        url: input.url,
        language: input.language,
        organization_id: organizationIdValue(organizationId),
        service: "auto",
        confirm: true,
        ...(input.name ? { name: input.name } : {}),
      },
    },
  });
  return readOrder(payload);
}

export async function createTranslationOrder(input: {
  transcriptionId: string;
  targetLanguage: string;
}): Promise<HappyScribeOrder> {
  const payload = await happyscribeRequest("/orders/translation", {
    method: "POST",
    body: {
      order: {
        source_transcription_id: input.transcriptionId,
        target_languages: [input.targetLanguage],
        service: "auto",
        confirm: true,
      },
    },
  });
  return readOrder(payload);
}

export async function getOrder(id: string): Promise<HappyScribeOrder> {
  const payload = await happyscribeRequest(`/orders/${encodeURIComponent(id)}`);
  return readOrder(payload);
}

function readOrder(payload: unknown): HappyScribeOrder {
  const order = parseOrder(payload);
  if (!order) {
    throw new HappyScribeError(
      "HappyScribe returned an unexpected order response.",
      502,
      "upstream",
    );
  }
  return order;
}
