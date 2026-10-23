import { connection } from "next/server";

import { errorResponse } from "@/lib/http";
import { getVoiceboxStatus } from "@/lib/voicebox/client";
import { profileEngine } from "@/lib/voicebox/schemas";

export async function GET() {
  await connection();
  try {
    const status = await getVoiceboxStatus();
    return Response.json({
      available: status.available,
      profiles: status.profiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        language: profile.language ?? null,
        ...(profileEngine(profile) ? { engine: profileEngine(profile) } : {}),
      })),
      ...(status.message ? { message: status.message } : {}),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
