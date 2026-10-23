import { connection } from "next/server";

import { errorResponse, jsonError } from "@/lib/http";
import { getOrder } from "@/lib/happyscribe/orders";
import {
  mapOrderStatus,
  missingTranscriptMessage,
  orderFailureMessage,
  transcriptionIdFromOrder,
} from "@/lib/happyscribe/status";

type OrderContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: OrderContext) {
  await connection();
  try {
    const { id } = await context.params;
    if (!isResourceId(id)) {
      return jsonError("HappyScribe could not find that job.", 404);
    }

    const order = await getOrder(id);
    const status = mapOrderStatus(order.state);
    const transcriptionId = transcriptionIdFromOrder(order);

    if (status === "fulfilled" && !transcriptionId) {
      return Response.json({
        id: order.id,
        state: order.state,
        status: "failed",
        message: missingTranscriptMessage(order),
      });
    }

    return Response.json({
      id: order.id,
      state: order.state,
      status,
      ...(transcriptionId ? { transcriptionId } : {}),
      ...(status === "failed" ? { message: orderFailureMessage(order) } : {}),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

function isResourceId(id: string): boolean {
  return /^[a-zA-Z0-9-]{1,80}$/.test(id);
}
