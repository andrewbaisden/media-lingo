import { connection } from "next/server";

import { errorResponse, jsonError } from "@/lib/http";
import { readGeneratedAudio } from "@/lib/voicebox/client";

type AudioContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: AudioContext) {
  await connection();
  try {
    const { id } = await context.params;
    if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) {
      return jsonError("That audio file could not be found.", 404);
    }

    const upstream = await readGeneratedAudio(id);
    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
