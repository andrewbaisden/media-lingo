import type { HappyScribeOrder } from "@/lib/happyscribe/schemas";

export type OrderProgress = "pending" | "fulfilled" | "failed";

const SUCCESS_STATES = new Set(["fulfilled", "free_trial_fulfilled"]);
const FAILURE_STATES = new Set(["failed", "locked", "canceled", "expired"]);

export function mapOrderStatus(state: string): OrderProgress {
  if (SUCCESS_STATES.has(state)) {
    return "fulfilled";
  }
  if (FAILURE_STATES.has(state)) {
    return "failed";
  }
  return "pending";
}

export function transcriptionIdFromOrder(
  order: HappyScribeOrder,
): string | undefined {
  const outputId = order.outputsIds?.[0] ?? order.outputs_ids?.[0];
  if (outputId) {
    return outputId;
  }
  const uuid = order.transcriptions?.find(
    (transcription) => transcription.uuid,
  )?.uuid;
  return uuid || undefined;
}

export function orderFailureMessage(order: HappyScribeOrder): string {
  const ingestionMessage = order.ingestions?.find(
    (ingestion) => ingestion.failure_message,
  )?.failure_message;

  if (ingestionMessage) {
    return ingestionMessage;
  }

  if (order.state === "locked") {
    return "HappyScribe could not start this job because the account does not have enough credits.";
  }

  if (order.failure_reason === "ingestion_failed") {
    return "HappyScribe could not import the media file.";
  }

  if (order.failure_reason === "transcription_failed") {
    return "HappyScribe could not finish this job.";
  }

  if (order.state === "canceled") {
    return "This HappyScribe job was canceled.";
  }

  if (order.state === "expired") {
    return "This HappyScribe job expired before it finished.";
  }

  return "HappyScribe could not finish this job.";
}

export function missingTranscriptMessage(order: HappyScribeOrder): string {
  const operation = order.operations?.find((item) => item.target_language);
  const source = operation?.language?.split("-")[0]?.toLowerCase();
  const target = operation?.target_language?.toLowerCase();
  if (
    source &&
    target &&
    (target === source || target.startsWith(`${source}-`))
  ) {
    return "HappyScribe did not create a translation because the target language matches the source. Choose a different language and process the file again.";
  }
  return "HappyScribe finished the job without a transcript.";
}

export function organizationIdValue(id: string): number | string {
  return /^\d+$/.test(id) ? Number(id) : id;
}
